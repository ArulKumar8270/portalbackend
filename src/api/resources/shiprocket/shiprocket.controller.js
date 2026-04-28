const shiprocket = require("./shiprocket.service");
const db = require("../../../models");

function pickQuery(req) {
  // Express query params are already objects; ensure plain key/values
  return req.query || {};
}

module.exports = {
  // Shiprocket has strict field length limits (e.g. billing_address <= 190 chars).
  // Keep full address in our DB, but clamp what we send to Shiprocket.
  _clampText(value, maxLen) {
    const s = String(value ?? "").trim();
    if (!maxLen || maxLen <= 0) return s;
    if (s.length <= maxLen) return s;
    return s.slice(0, maxLen - 1).trimEnd();
  },

  async serviceability(req, res, next) {
    try {
      const out = await shiprocket.serviceability(pickQuery(req));
      res.status(200).json({ success: true, data: out });
    } catch (e) {
      next(e);
    }
  },

  async createOrder(req, res, next) {
    try {
      const out = await shiprocket.createOrderAdhoc(req.body || {});
      res.status(200).json({ success: true, data: out });
    } catch (e) {
      next(e);
    }
  },

  /**
   * Create Shiprocket order from our DB order id.
   * - Store.storeaddress => pickup (from)
   * - Order.deliveryAddress (or addresses row) => shipping (to)
   * - carts rows => order_items
   */
  async createOrderFromOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      const order = await db.orders.findByPk(orderId);
      if (!order) return res.status(404).json({ success: false, message: "Order not found" });

      const store = order.storeId ? await db.store.findByPk(order.storeId) : null;
      const partner = String(store?.deliveryPartner || "").toLowerCase();
      const authUser = req.user || {};
      const role = String(authUser.role ?? authUser.roleId ?? "");
      const isAdmin = role === "0" || role === "admin";
      const force = String(req.query?.force || "") === "1";

      if (partner !== "shiprocket" && !(isAdmin && force)) {
        return res.status(400).json({
          success: false,
          message: "This store is not mapped to Shiprocket",
        });
      }
      const addrRow = await db.addresses.findOne({ where: { orderId: order.id }, raw: true }).catch(() => null);
      const user = order.custId ? await db.user.findByPk(order.custId) : null;
      const carts = await db.carts.findAll({ where: { orderId: order.id }, raw: true }).catch(() => []);

      const parseMaybeJsonAddress = (raw) => {
        if (raw == null) return null;
        if (typeof raw === "object") return raw;
        const s = String(raw).trim();
        if (!s) return null;
        // Heuristic: website orders store JSON string
        if (s.startsWith("{") && s.endsWith("}")) {
          try {
            return JSON.parse(s);
          } catch {
            return null;
          }
        }
        return null;
      };

      const parseAddress = (raw) => {
        const text = String(raw ?? "").trim();
        const pincodeMatch = text.match(/\b(\d{6})\b/);
        const pincode = pincodeMatch ? pincodeMatch[1] : "";
        const parts = text.split(",").map((s) => s.trim()).filter(Boolean);
        const city = addrRow?.city || parts[parts.length - 3] || parts[parts.length - 2] || "";
        const state = addrRow?.states || parts[parts.length - 2] || parts[parts.length - 1] || "";
        const line1 = addrRow?.shipping || text || "—";
        return { line1, city, state, pincode };
      };

      const addrJson = parseMaybeJsonAddress(order.deliveryAddress);
      const to = addrJson
        ? {
            line1: String(addrJson.shipping || addrJson.address || addrJson.line1 || "").trim(),
            city: String(addrJson.city || "").trim(),
            state: String(addrJson.states || addrJson.state || "").trim(),
            pincode: String(addrJson.pincode || "").trim(),
          }
        : parseAddress(addrRow?.shipping || order.deliveryAddress);
      const from = parseAddress(store?.storeaddress);

      const customerName = addrRow?.fullname || user?.name || "Customer";
      const customerPhone = addrRow?.phone || user?.phone || "9999999999";
      const customerEmail = user?.email || store?.email || "no-reply@example.com";

      const paymentMethod = String(order.paymentmethod) === "3" ? "COD" : "Prepaid";
      let subTotal =
        Number(order.grandtotal ?? order.grandTotal ?? 0) ||
        carts.reduce((sum, c) => sum + Number(c.total ?? 0), 0);

      // Fallback for old orders where grandtotal wasn't saved (frontend used grandTotal)
      if (!Number.isFinite(subTotal) || subTotal <= 0) {
        const pid = Number(order.productIds);
        const qty = Number(order.qty ?? 1) || 1;
        if (Number.isFinite(pid) && pid > 0) {
          const prod = await db.product.findByPk(pid, { raw: true }).catch(() => null);
          const price = Number(prod?.price ?? 0) || 0;
          subTotal = price * qty;
        }
      }

      const orderItems = (carts || []).map((c) => ({
        name: c.name || `Item ${c.productId ?? ""}`.trim(),
        sku: String(c.productId ?? c.id ?? ""),
        units: Number(c.qty ?? 1) || 1,
        selling_price: Number(c.price ?? 0) || 0,
      }));

      const pickupLocation =
        store?.shiprocketPickupLocation ||
        process.env.SHIPROCKET_PICKUP_LOCATION ||
        "Primary";

      // Validate required fields to avoid opaque Shiprocket 422 errors
      if (!pickupLocation) {
        return res.status(400).json({ success: false, message: "Shiprocket pickup_location missing (set SHIPROCKET_PICKUP_LOCATION)" });
      }
      if (!to.pincode || !/^\d{6}$/.test(String(to.pincode))) {
        return res.status(400).json({ success: false, message: "Delivery pincode missing/invalid in order address" });
      }
      if (!to.city) {
        return res.status(400).json({ success: false, message: "Delivery city missing in order address" });
      }
      if (!to.state) {
        return res.status(400).json({ success: false, message: "Delivery state missing in order address" });
      }
      if (!to.line1) {
        return res.status(400).json({ success: false, message: "Delivery address missing in order" });
      }

      const payload = {
        order_id:
          String(req.query?.reorder || "") === "1"
            ? `NP-${order.id}-${Date.now()}`
            : `NP-${order.id}`,
        order_date: new Date(order.createdAt || Date.now()).toISOString().slice(0, 10),
        pickup_location: pickupLocation,
        billing_customer_name: customerName,
        billing_last_name: "",
        billing_address: module.exports._clampText(to.line1, 190),
        billing_city: to.city,
        billing_pincode: to.pincode,
        billing_state: to.state,
        billing_country: "India",
        billing_email: customerEmail,
        billing_phone: String(customerPhone),
        shipping_is_billing: 1,
        order_items: orderItems.length ? orderItems : [{ name: "Order", sku: String(order.id), units: 1, selling_price: subTotal }],
        payment_method: paymentMethod,
        sub_total: Number(subTotal) || 0,
        length: Number(process.env.SHIPROCKET_DEFAULT_LENGTH || 10),
        breadth: Number(process.env.SHIPROCKET_DEFAULT_BREADTH || 10),
        height: Number(process.env.SHIPROCKET_DEFAULT_HEIGHT || 10),
        weight: Number(process.env.SHIPROCKET_DEFAULT_WEIGHT || 0.5),
      };

      const isWrongPickup = (o) =>
        String(o?.message || o?.data?.message || "")
          .toLowerCase()
          .includes("wrong pickup location");

      let out = await shiprocket.createOrderAdhoc(payload);
      // Shiprocket sometimes returns 200 with "Wrong Pickup location..." (not a 4xx).
      // Retry once with "Primary" which is the common default pickup name.
      if (isWrongPickup(out) && String(payload.pickup_location).toLowerCase() !== "primary") {
        out = await shiprocket.createOrderAdhoc({ ...payload, pickup_location: "Primary" });
      }
      if (isWrongPickup(out)) {
        return res.status(400).json({
          success: false,
          message: "Shiprocket pickup_location is invalid (use an existing pickup location name)",
          shiprocket: out,
        });
      }

      // Persist Shiprocket details on our order for UI + tracking
      try {
        const shiprocketOrderId = out?.order_id ?? out?.orderId ?? out?.data?.order_id ?? null;
        const shiprocketShipmentId = out?.shipment_id ?? out?.shipmentId ?? out?.data?.shipment_id ?? null;
        const shiprocketAwb = out?.awb_code ?? out?.awb ?? out?.data?.awb_code ?? null;
        const shiprocketCourierName = out?.courier_name ?? out?.courier_company_name ?? out?.data?.courier_name ?? null;
        const shiprocketTrackingUrl = out?.tracking_url ?? out?.trackingUrl ?? out?.data?.tracking_url ?? null;
        const shiprocketStatus = out?.status ?? out?.data?.status ?? null;
        const shiprocketStatusCode = out?.status_code ?? out?.data?.status_code ?? null;

        await order.update({
          deliveryPartner: "shiprocket",
          shiprocketOrderId: shiprocketOrderId != null ? String(shiprocketOrderId) : null,
          shiprocketShipmentId: shiprocketShipmentId != null ? String(shiprocketShipmentId) : null,
          shiprocketAwb: shiprocketAwb != null ? String(shiprocketAwb) : null,
          shiprocketCourierName: shiprocketCourierName != null ? String(shiprocketCourierName) : null,
          shiprocketTrackingUrl: shiprocketTrackingUrl != null ? String(shiprocketTrackingUrl) : null,
          shiprocketStatus: shiprocketStatus != null ? String(shiprocketStatus) : null,
          shiprocketStatusCode:
            shiprocketStatusCode != null && !Number.isNaN(Number(shiprocketStatusCode))
              ? Number(shiprocketStatusCode)
              : null,
          shiprocketRaw: JSON.stringify(out),
        });
      } catch {
        // ignore persistence failures; response still returns
      }

      res.status(200).json({
        success: true,
        data: out,
        meta: {
          orderId: order.id,
          storeId: order.storeId,
          deliveryDate: order.deliverydate,
          grandTotal: order.grandtotal,
          pickupAddress: from.line1,
          deliveryAddress: to.line1,
        },
      });
    } catch (e) {
      // Surface Shiprocket API errors to help configuration/debugging.
      // shiprocket.service throws { status, payload } when Shiprocket responds non-2xx.
      if (e?.status && e?.payload) {
        const status = Number(e.status) || 400;
        return res.status(400).json({
          success: false,
          message:
            status === 422
              ? "Shiprocket validation failed"
              : "Shiprocket request failed",
          shiprocket: e.payload,
          status_code: status,
        });
      }
      next(e);
    }
  },

  async assignAwb(req, res, next) {
    try {
      const out = await shiprocket.assignAwb(req.body || {});
      res.status(200).json({ success: true, data: out });
    } catch (e) {
      next(e);
    }
  },

  async generatePickup(req, res, next) {
    try {
      const out = await shiprocket.generatePickup(req.body || {});
      res.status(200).json({ success: true, data: out });
    } catch (e) {
      next(e);
    }
  },

  async generateManifest(req, res, next) {
    try {
      const out = await shiprocket.generateManifest(req.body || {});
      res.status(200).json({ success: true, data: out });
    } catch (e) {
      next(e);
    }
  },

  async printManifest(req, res, next) {
    try {
      const out = await shiprocket.printManifest(req.body || {});
      res.status(200).json({ success: true, data: out });
    } catch (e) {
      next(e);
    }
  },

  async generateLabel(req, res, next) {
    try {
      const out = await shiprocket.generateLabel(req.body || {});
      res.status(200).json({ success: true, data: out });
    } catch (e) {
      next(e);
    }
  },

  async printInvoice(req, res, next) {
    try {
      const out = await shiprocket.printInvoice(req.body || {});
      res.status(200).json({ success: true, data: out });
    } catch (e) {
      next(e);
    }
  },

  async trackAwb(req, res, next) {
    try {
      const out = await shiprocket.trackAwb(req.params.awb);
      res.status(200).json({ success: true, data: out });
    } catch (e) {
      next(e);
    }
  },
};

