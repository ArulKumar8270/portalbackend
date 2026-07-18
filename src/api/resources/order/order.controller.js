const { Op } = require('sequelize');
const db = require('../../../models');
const { attachActiveOtpsToOrders } = require('../one-day/one-day.service');
const { notifyNewOrder } = require('./order.notify');
const shiprocket = require('../shiprocket/shiprocket.service');

const CANCELLABLE_STANDARD = ['processing', 'pending', 'confirmed'];
const CANCELLABLE_ONE_DAY = ['placed', 'assigned'];

function getCustomerUserId(req) {
  const u = req.user;
  if (!u) return null;
  return u.custId ?? u.id ?? u.userId ?? null;
}

function isOneDayOrder(order) {
  return String(order.deliveryType || '').toLowerCase() === 'one_day';
}

function parseRefundStatus(order) {
  return String(order.refundStatus || 'none').toLowerCase();
}

function clampText(value, maxLen) {
  const s = String(value ?? '').trim();
  if (!maxLen || maxLen <= 0) return s;
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - 1).trimEnd();
}

/** DB ENUM uses typo `delieverd` and `cancel`; dashboard may send `delivered` / `cancelled`. */
function normalizeStatus(status) {
  if (status == null || status === '') return 'processing';
  const s = String(status).toLowerCase();
  if (s === 'delivered') return 'delieverd';
  if (s === 'cancelled') return 'cancel';
  if (['processing', 'shipping', 'delieverd', 'cancel'].includes(s)) return s;
  return 'processing';
}

function salvageTruncatedDeliveryAddress(raw) {
  const str = String(raw || '');
  if (!str.startsWith('{')) return null;
  const pick = (key) => {
    const m = str.match(new RegExp(`"${key}":"([^"]*)"`));
    return m ? m[1] : '';
  };
  const fullname = pick('fullname');
  const phone = pick('phone');
  const city = pick('city');
  const pincode = pick('pincode');
  const shipping = pick('shipping');
  if (!fullname && !shipping && !city) return null;
  return {
    ...(fullname ? { fullname } : {}),
    ...(phone ? { phone } : {}),
    ...(shipping ? { shipping } : {}),
    ...(city ? { city } : {}),
    ...(pincode ? { pincode } : {}),
  };
}

function parseDeliveryAddress(raw) {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const addr = { ...raw };
    if (addr.shipping && String(addr.shipping).startsWith('{')) {
      return salvageTruncatedDeliveryAddress(String(addr.shipping)) || addr;
    }
    return addr;
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(String(raw));
    if (parsed && typeof parsed === 'object') {
      if (parsed.shipping && String(parsed.shipping).startsWith('{')) {
        return salvageTruncatedDeliveryAddress(String(parsed.shipping)) || parsed;
      }
      return parsed;
    }
  } catch (_) {
    return salvageTruncatedDeliveryAddress(String(raw));
  }
  return null;
}

async function enrichOrdersForList(orders) {
  const rows = orders.map((o) => (o.toJSON ? o.toJSON() : o));
  const prodIds = [
    ...new Set(
      rows
        .map((o) => Number(o.productIds))
        .filter((n) => Number.isFinite(n) && n > 0)
    ),
  ];

  const products = prodIds.length
    ? await db.product.findAll({ where: { id: prodIds }, raw: true }).catch(() => [])
    : [];

  const byPid = new Map(products.map((p) => [Number(p.id), p]));

  const missingPhotoIds = products
    .filter((p) => !p.photo)
    .map((p) => Number(p.id));
  if (missingPhotoIds.length) {
    const [photoRows] = await db.sequelize.query(
      `SELECT productId, imgUrl FROM productphotos WHERE productId IN (:ids) ORDER BY id ASC`,
      { replacements: { ids: missingPhotoIds } }
    ).catch(() => [[]]);
    const firstPhoto = new Map();
    for (const row of photoRows || []) {
      if (!firstPhoto.has(row.productId)) firstPhoto.set(row.productId, row.imgUrl);
    }
    for (const p of products) {
      if (!p.photo && firstPhoto.has(Number(p.id))) {
        p.photo = firstPhoto.get(Number(p.id));
      }
    }
  }

  const mapped = rows.map((json) => {
    const product = byPid.get(Number(json.productIds));
    return {
      ...json,
      deliveryType: json.deliveryType || 'standard',
      products: product ? [product] : [],
      parsedDeliveryAddress: parseDeliveryAddress(json.deliveryAddress),
    };
  });

  return attachActiveOtpsToOrders(mapped);
}

module.exports = {
  /** POST /order/create — standard + one-day orders */
  async index(req, res, next) {
    try {
      const b = req.body || {};
      const deliveryType = String(b.deliveryType || 'standard').toLowerCase();
      const isOneDay = deliveryType === 'one_day' || deliveryType === 'oneday';

      if (isOneDay) {
        const custLat = Number(b.customerLat ?? b.latitude ?? b.lat);
        const custLng = Number(b.customerLng ?? b.longitude ?? b.lng);
        const addr = typeof b.deliveryAddress === 'object' ? b.deliveryAddress : null;
        try {
          const { quoteDelivery } = require('../one-day/one-day.service');
          const quote = await quoteDelivery({
            storeId: b.storeId,
            customerLat: custLat,
            customerLng: custLng,
            address: addr,
          });
          if (!quote?.serviceable) {
            return res.status(400).json({
              success: false,
              message: quote?.reason || 'Outside store max delivery radius',
              data: quote,
            });
          }
          // Prefer server-computed delivery charge / distance
          if (quote.deliveryCharge != null) b.deliveryCharge = quote.deliveryCharge;
          if (quote.distanceKm != null) b.distanceKm = quote.distanceKm;
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: e.message || 'Unable to validate one-day delivery radius',
          });
        }
      }

      const row = await db.orders.create({
        custId: b.custId,
        storeId: b.storeId,
        number: b.number,
        paymentmethod: b.paymentmethod,
        deliverydate: b.deliverydate,
        grandtotal: b.grandtotal ?? b.grandTotal ?? null,
        status: normalizeStatus(b.status),
        productIds: b.productIds,
        qty: b.qty,
        customization: b.customization,
        cutomerDeliveryDate: b.cutomerDeliveryDate,
        deliveryAddress:
          b.deliveryAddress != null && typeof b.deliveryAddress === 'object'
            ? JSON.stringify(b.deliveryAddress)
            : b.deliveryAddress,
        orderType: b.orderType,
        size: b.size,
        unitSize: b.unitSize,
        sizeDetails: b.sizeDetails,
        deliveryType: isOneDay ? 'one_day' : (b.deliveryType || 'standard'),
        oneDayStatus: isOneDay ? (b.oneDayStatus || 'placed') : null,
        isOneDayTrial: !!b.isOneDayTrial,
        deliveryCharge: b.deliveryCharge != null ? Number(b.deliveryCharge) : 0,
        distanceKm: b.distanceKm != null ? b.distanceKm : null,
        orderAdvancePercent: b.orderAdvancePercent != null ? Number(b.orderAdvancePercent) : null,
        orderAdvanceAmount: b.orderAdvanceAmount != null ? Number(b.orderAdvanceAmount) : null,
        orderBalanceAmount: b.orderBalanceAmount != null ? Number(b.orderBalanceAmount) : null,
        orderAdvancePaidAt: b.orderAdvancePaidAt || null,
      });

      // Auto-create Shiprocket shipment ONLY for standard product orders mapped to Shiprocket.
      try {
        const storeId = row?.storeId ?? b.storeId;
        if (storeId && !isOneDay) {
          const store = await db.store.findByPk(storeId, { raw: true }).catch(() => null);
          const partner = String(store?.deliveryPartner || '').toLowerCase();
          if (partner === 'shiprocket' && String(row?.orderType) === 'Product') {
            const addrObj = (() => {
              const raw = b.deliveryAddress;
              if (raw && typeof raw === 'object') return raw;
              try {
                return JSON.parse(String(row.deliveryAddress || ''));
              } catch {
                return null;
              }
            })();

            const to = {
              name: String(addrObj?.fullname || 'Customer'),
              phone: String(addrObj?.phone || '9999999999'),
              email: String(addrObj?.email || store?.email || 'no-reply@example.com'),
              address: String(addrObj?.shipping || addrObj?.address || row.deliveryAddress || '—'),
              city: String(addrObj?.city || ''),
              state: String(addrObj?.states || addrObj?.state || ''),
              pincode: String(addrObj?.pincode || '').trim(),
            };

            const prodId = Number(row.productIds ?? b.productIds);
            const prod = Number.isFinite(prodId)
              ? await db.product.findByPk(prodId, { raw: true }).catch(() => null)
              : null;
            const units = Number(row.qty ?? b.qty ?? 1) || 1;
            const sellingPrice =
              prod?.price != null ? Number(prod.price) : Number(row.grandtotal ?? b.grandtotal ?? 0);
            const itemName = prod?.name || `Order ${row.id}`;

            const payload = {
              order_id: `NP-${row.id}`,
              order_date: new Date(row.createdAt || Date.now()).toISOString().slice(0, 10),
              pickup_location:
                store?.shiprocketPickupLocation ||
                process.env.SHIPROCKET_PICKUP_LOCATION ||
                'Primary',
              billing_customer_name: to.name,
              billing_last_name: '',
              billing_address: clampText(to.address, 190),
              billing_city: to.city,
              billing_pincode: to.pincode,
              billing_state: to.state,
              billing_country: 'India',
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
              payment_method: String(row.paymentmethod) === '3' ? 'COD' : 'Prepaid',
              sub_total: Number(row.grandtotal ?? 0) || sellingPrice * units,
              length: Number(process.env.SHIPROCKET_DEFAULT_LENGTH || 10),
              breadth: Number(process.env.SHIPROCKET_DEFAULT_BREADTH || 10),
              height: Number(process.env.SHIPROCKET_DEFAULT_HEIGHT || 10),
              weight: Number(process.env.SHIPROCKET_DEFAULT_WEIGHT || 0.5),
            };

            const isWrongPickup = (o) =>
              String(o?.message || o?.data?.message || '')
                .toLowerCase()
                .includes('wrong pickup location');

            let created = await shiprocket.createOrderAdhoc(payload);
            if (isWrongPickup(created) && String(payload.pickup_location).toLowerCase() !== 'primary') {
              created = await shiprocket.createOrderAdhoc({ ...payload, pickup_location: 'Primary' });
            }
            if (isWrongPickup(created)) {
              await row.update({ deliveryPartner: null }).catch(() => {});
              throw new Error('Shiprocket pickup_location invalid');
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
                // ignore
              }
            }

            await row.update({
              deliveryPartner: 'shiprocket',
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

      notifyNewOrder(row).catch(() => {});
      res.status(201).json({ success: true, data: row });
    } catch (err) {
      next(err);
    }
  },

  /** POST /order/status/update */
  async statusUpdate(req, res, next) {
    try {
      const { id, status, deliverydate } = req.body || {};
      if (!id) {
        return res.status(400).json({ success: false, message: 'Order id is required' });
      }
      const order = await db.orders.findByPk(id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
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

  /** GET /order/list/:id — customer orders (web + mobile) */
  async getAllOrderListById(req, res, next) {
    try {
      const custId = Number(req.params.id);
      if (!Number.isFinite(custId) || custId <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid customer id' });
      }

      const jwtCustId = getCustomerUserId(req);
      if (jwtCustId && Number(jwtCustId) !== custId) {
        return res.status(403).json({ success: false, message: 'Not allowed' });
      }

      const list = await db.orders.findAll({
        where: { custId },
        order: [['id', 'DESC']],
      });

      const data = await enrichOrdersForList(list);
      res.status(200).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** GET /order/store/list/:id — standard store orders only (no one-day / rental) */
  async getStoreOrderList(req, res, next) {
    try {
      const storeId = Number(req.params.id);
      if (!Number.isFinite(storeId) || storeId <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid store id' });
      }

      const list = await db.orders.findAll({
        where: {
          storeId,
          [Op.and]: [
            {
              [Op.or]: [
                { deliveryType: null },
                { deliveryType: 'standard' },
                { deliveryType: '' },
              ],
            },
            { oneDayStatus: null },
            { rentalStatus: null },
          ],
        },
        order: [['id', 'DESC']],
      });

      const data = await enrichOrdersForList(list);
      res.status(200).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async requestRefund(req, res, next) {
    try {
      const order = await db.orders.findByPk(req.params.id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      if (String(order.deliveryType || '').toLowerCase() === 'rental' || order.rentalStatus) {
        return res.status(400).json({ success: false, message: 'Use rental flow for rental bookings' });
      }
      const custId = getCustomerUserId(req) || Number(req.body?.custId);
      if (custId && Number(order.custId) !== Number(custId)) {
        return res.status(403).json({ success: false, message: 'Not allowed' });
      }
      const refundStatus = parseRefundStatus(order);
      if (!['none', 'rejected'].includes(refundStatus)) {
        return res.status(400).json({ success: false, message: 'Refund already requested or processed' });
      }
      const advance = Number(order.orderAdvanceAmount || order.rentalAdvanceAmount || 0);
      const cancelled =
        String(order.status || '').toLowerCase() === 'cancelled' ||
        String(order.oneDayStatus || '').toLowerCase() === 'cancelled';
      const delivered =
        String(order.oneDayStatus || '').toLowerCase() === 'delivered' ||
        String(order.status || '').toLowerCase() === 'delivered';
      if (!cancelled && !delivered && advance <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Refund can be requested after cancellation or delivery when advance was paid',
        });
      }
      await order.update({
        refundStatus: 'requested',
        refundNote: String(req.body?.reason || req.body?.note || 'Customer requested refund').trim(),
      });
      res.json({ success: true, message: 'Refund request submitted to the store' });
    } catch (e) {
      next(e);
    }
  },

  async cancelOrder(req, res, next) {
    try {
      const order = await db.orders.findByPk(req.params.id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      const custId = getCustomerUserId(req) || Number(req.body?.custId);
      if (custId && Number(order.custId) !== Number(custId)) {
        return res.status(403).json({ success: false, message: 'Not allowed' });
      }
      if (isOneDayOrder(order)) {
        const s = String(order.oneDayStatus || 'placed').toLowerCase();
        if (!CANCELLABLE_ONE_DAY.includes(s)) {
          return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
        }
        const patch = { oneDayStatus: 'cancelled', status: 'cancelled' };
        if (Number(order.orderAdvanceAmount) > 0 && req.body?.requestRefund !== false) {
          patch.refundStatus = 'requested';
          patch.refundNote = String(req.body?.reason || 'Refund requested after order cancellation').trim();
        }
        await order.update(patch);
        return res.json({
          success: true,
          message: patch.refundStatus === 'requested'
            ? 'Order cancelled. Refund request sent to the store.'
            : 'Order cancelled',
        });
      }
      const s = String(order.status || 'processing').toLowerCase();
      if (!CANCELLABLE_STANDARD.includes(s)) {
        return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
      }
      const patch = { status: 'cancelled' };
      if (Number(order.orderAdvanceAmount) > 0 && req.body?.requestRefund !== false) {
        patch.refundStatus = 'requested';
        patch.refundNote = String(req.body?.reason || 'Refund requested after order cancellation').trim();
      }
      await order.update(patch);
      res.json({
        success: true,
        message: patch.refundStatus === 'requested'
          ? 'Order cancelled. Refund request sent to the store.'
          : 'Order cancelled',
      });
    } catch (e) {
      next(e);
    }
  },
};
