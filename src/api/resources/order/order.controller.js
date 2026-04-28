const db = require("../../../models");
const shiprocket = require("../shiprocket/shiprocket.service");

const OrderModel = () => db.orders;

function clampText(value, maxLen) {
  const s = String(value ?? "").trim();
  if (!maxLen || maxLen <= 0) return s;
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - 1).trimEnd();
}

/** DB ENUM uses typo `delieverd` and `cancel`; dashboard may send `delivered` / `cancelled`. */
function normalizeStatus(status) {
  if (status == null || status === "") return "processing";
  const s = String(status).toLowerCase();
  if (s === "delivered") return "delieverd";
  if (s === "cancelled") return "cancel";
  if (["processing", "shipping", "delieverd", "cancel"].includes(s)) return s;
  return "processing";
}

module.exports = {
  /** POST /order/create */
  async index(req, res, next) {
    try {
      const b = req.body || {};
      const row = await OrderModel().create({
        custId: b.custId,
        storeId: b.storeId,
        number: b.number,
        paymentmethod: b.paymentmethod,
        deliverydate: b.deliverydate,
        // Frontend sends `grandTotal` (camelCase); DB column is `grandtotal`
        grandtotal: b.grandtotal ?? b.grandTotal ?? null,
        status: normalizeStatus(b.status),
        productIds: b.productIds,
        qty: b.qty,
        customization: b.customization,
        cutomerDeliveryDate: b.cutomerDeliveryDate,
        deliveryAddress:
          b.deliveryAddress != null && typeof b.deliveryAddress === "object"
            ? JSON.stringify(b.deliveryAddress)
            : b.deliveryAddress,
        orderType: b.orderType,
        size: b.size,
        unitSize: b.unitSize,
        sizeDetails: b.sizeDetails,
      });

      // Auto-create Shiprocket shipment ONLY if store is mapped to Shiprocket.
      try {
        const storeId = row?.storeId ?? b.storeId;
        if (storeId) {
          const store = await db.store.findByPk(storeId, { raw: true }).catch(() => null);
          const partner = String(store?.deliveryPartner || "").toLowerCase();
          if (partner === "shiprocket" && String(row?.orderType) === "Product") {
            const addrObj = (() => {
              const raw = b.deliveryAddress;
              if (raw && typeof raw === "object") return raw;
              try {
                return JSON.parse(String(row.deliveryAddress || ""));
              } catch {
                return null;
              }
            })();

            const to = {
              name: String(addrObj?.fullname || "Customer"),
              phone: String(addrObj?.phone || "9999999999"),
              email: String(addrObj?.email || store?.email || "no-reply@example.com"),
              address: String(addrObj?.shipping || addrObj?.address || row.deliveryAddress || "—"),
              city: String(addrObj?.city || ""),
              state: String(addrObj?.states || addrObj?.state || ""),
              pincode: String(addrObj?.pincode || "").trim(),
            };

            const prodId = Number(row.productIds ?? b.productIds);
            const prod = Number.isFinite(prodId) ? await db.product.findByPk(prodId, { raw: true }).catch(() => null) : null;
            const units = Number(row.qty ?? b.qty ?? 1) || 1;
            const sellingPrice = prod?.price != null ? Number(prod.price) : Number(row.grandtotal ?? b.grandtotal ?? 0);
            const itemName = prod?.name || `Order ${row.id}`;

            const payload = {
              order_id: `NP-${row.id}`,
              order_date: new Date(row.createdAt || Date.now()).toISOString().slice(0, 10),
              pickup_location:
                store?.shiprocketPickupLocation ||
                process.env.SHIPROCKET_PICKUP_LOCATION ||
                "Primary",
              billing_customer_name: to.name,
              billing_last_name: "",
              billing_address: clampText(to.address, 190),
              billing_city: to.city,
              billing_pincode: to.pincode,
              billing_state: to.state,
              billing_country: "India",
              billing_email: to.email,
              billing_phone: to.phone,
              shipping_is_billing: 1,
              order_items: [
                {
                  name: itemName,
                  sku: String(prodId || row.id),
                  units,
                  selling_price: sellingPrice,
                },
              ],
              payment_method: String(row.paymentmethod) === "3" ? "COD" : "Prepaid",
              sub_total: Number(row.grandtotal ?? 0) || sellingPrice * units,
              length: Number(process.env.SHIPROCKET_DEFAULT_LENGTH || 10),
              breadth: Number(process.env.SHIPROCKET_DEFAULT_BREADTH || 10),
              height: Number(process.env.SHIPROCKET_DEFAULT_HEIGHT || 10),
              weight: Number(process.env.SHIPROCKET_DEFAULT_WEIGHT || 0.5),
            };

            const isWrongPickup = (o) =>
              String(o?.message || o?.data?.message || "")
                .toLowerCase()
                .includes("wrong pickup location");

            let created = await shiprocket.createOrderAdhoc(payload);
            if (isWrongPickup(created) && String(payload.pickup_location).toLowerCase() !== "primary") {
              created = await shiprocket.createOrderAdhoc({ ...payload, pickup_location: "Primary" });
            }
            if (isWrongPickup(created)) {
              // Don't block order placement; just keep it as store delivery.
              await row.update({ deliveryPartner: null }).catch(() => {});
              throw new Error("Shiprocket pickup_location invalid");
            }
            const shipmentId = created?.shipment_id ?? created?.shipmentId ?? created?.data?.shipment_id;
            const srOrderId = created?.order_id ?? created?.orderId ?? created?.data?.order_id;

            let awb = created?.awb_code ?? created?.awb ?? created?.data?.awb_code;
            let courierName = created?.courier_name ?? created?.courier_company_name ?? created?.data?.courier_name;
            let trackingUrl = created?.tracking_url ?? created?.trackingUrl ?? created?.data?.tracking_url;

            if (!awb && shipmentId) {
              try {
                const assigned = await shiprocket.assignAwb({ shipment_id: shipmentId });
                awb = assigned?.awb_code ?? assigned?.awb ?? awb;
                courierName = assigned?.courier_name ?? assigned?.courier_company_name ?? courierName;
                trackingUrl = assigned?.tracking_url ?? trackingUrl;
              } catch {
                // ignore AWB assignment failures; shipment may still be created
              }
            }

            await row.update({
              deliveryPartner: "shiprocket",
              shiprocketOrderId: srOrderId ? String(srOrderId) : null,
              shiprocketShipmentId: shipmentId ? String(shipmentId) : null,
              shiprocketAwb: awb ? String(awb) : null,
              shiprocketCourierName: courierName ? String(courierName) : null,
              shiprocketTrackingUrl: trackingUrl ? String(trackingUrl) : null,
              shiprocketRaw: JSON.stringify(created),
            });
          } else {
            await row.update({ deliveryPartner: null }).catch(() => {});
          }
        }
      } catch {
        // Never fail order creation because Shiprocket sync failed.
      }

      res.status(201).json({ success: true, data: row });
    } catch (err) {
      next(err);
    }
  },

  /** GET /order/list (admin) */
  async getAllOrderList(req, res, next) {
    try {
      const list = await OrderModel().findAll({ order: [["id", "DESC"]] });
      res.status(200).json({ success: true, data: list });
    } catch (err) {
      next(err);
    }
  },

  /** POST /order/status/update */
  async statusUpdate(req, res, next) {
    try {
      const { id, status, deliverydate } = req.body || {};
      if (!id) {
        return res.status(400).json({ success: false, message: "Order id is required" });
      }
      const order = await OrderModel().findByPk(id);
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }
      await order.update({
        status: normalizeStatus(status ?? order.status),
        deliverydate: deliverydate != null ? deliverydate : order.deliverydate,
      });
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  /** GET /order/list/:id — orders for customer id */
  async getAllOrderListById(req, res, next) {
    try {
      const { id } = req.params;
      const list = await OrderModel().findAll({
        where: { custId: id },
        order: [["id", "DESC"]],
      });
      // Attach minimal product details (OrderCard expects `products[0]`)
      const prodIds = [...new Set(list.map((o) => Number(o.productIds)).filter((n) => Number.isFinite(n) && n > 0))];
      const products = prodIds.length ? await db.product.findAll({ where: { id: prodIds }, raw: true }).catch(() => []) : [];
      const byPid = new Map(products.map((p) => [Number(p.id), p]));
      const out = list.map((o) => {
        const p = byPid.get(Number(o.productIds));
        return { ...o.toJSON(), products: p ? [p] : [] };
      });
      res.status(200).json({ success: true, data: out });
    } catch (err) {
      next(err);
    }
  },

  /** GET /order/store/list/:id */
  async getAllOrderListBySoreId(req, res, next) {
    try {
      const { id } = req.params;
      const list = await OrderModel().findAll({
        where: { storeId: id },
        order: [["id", "DESC"]],
      });
      res.status(200).json({ success: true, data: list });
    } catch (err) {
      next(err);
    }
  },

  /** POST /order/status — counts per status */
  async getAllOrderStatus(req, res, next) {
    try {
      const rows = await OrderModel().findAll({
        attributes: [
          "status",
          [db.sequelize.fn("COUNT", db.sequelize.col("orders.id")), "count"],
        ],
        group: ["status"],
        raw: true,
      });
      res.status(200).json({ success: true, data: rows });
    } catch (err) {
      next(err);
    }
  },

  /** GET /order/count */
  async getAllOrderCount(req, res, next) {
    try {
      const count = await OrderModel().count();
      res.status(200).json({ success: true, data: { count } });
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /order/delete/:id */
  async deleteOrder(req, res, next) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ success: false, message: "Order id is required" });
      }

      const order = await OrderModel().findByPk(id);
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      const payload = req.user || {};
      const role = String(payload.role ?? payload.roleId ?? "");
      const isAdmin = role === "0" || role === "admin";

      if (!isAdmin) {
        const userStoreId =
          payload.storeId ?? payload.store_id ?? payload.storeID ?? payload.store?.id;
        const orderStoreId =
          order.storeId ??
          order.store_id ??
          order.get?.("storeId") ??
          order.get?.("store_id");
        if (userStoreId == null || String(orderStoreId) !== String(userStoreId)) {
          return res.status(403).json({ success: false, message: "Not allowed to delete this order" });
        }
      }

      if (db.carts) {
        try {
          await db.carts.destroy({ where: { orderId: id } });
        } catch {
          try {
            await db.carts.destroy({ where: { order_id: id } });
          } catch {
            /* ignore */
          }
        }
      }

      await order.destroy();
      res.status(200).json({ success: true, message: "Order deleted successfully" });
    } catch (err) {
      next(err);
    }
  },
};
