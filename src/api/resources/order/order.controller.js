const db = require('../../../models');

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

module.exports = {
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
