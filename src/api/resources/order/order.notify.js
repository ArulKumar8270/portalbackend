const http = require('http');

const WS_HOST = process.env.WS_HOST || '127.0.0.1';
const WS_PORT = Number(process.env.WS_PORT || 3001);

function broadcastOrder(event, data = {}) {
  const payload = JSON.stringify({
    event,
    data,
    room: data.room || null,
  });

  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: WS_HOST,
        port: WS_PORT,
        path: '/broadcast',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 3000,
      },
      (res) => {
        res.on('data', () => {});
        res.on('end', () => resolve(true));
      }
    );
    req.on('error', (err) => {
      console.warn('[OrderNotify] WebSocket broadcast failed:', err.message);
      resolve(false);
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.write(payload);
    req.end();
  });
}

/**
 * Notify seller apps + dashboards that a new order was placed.
 * Emits global `new-order` (Flutter NewOrderService) and room-targeted events.
 */
async function notifyNewOrder(order) {
  const orderId = order?.id;
  const storeId = order?.storeId;
  if (!orderId || storeId == null) return false;

  const deliveryType = String(order.deliveryType || 'standard').toLowerCase();
  let title = 'New order';
  let message = `New order #${orderId}`;
  if (deliveryType === 'one_day' || deliveryType === 'oneday') {
    title = 'New one-day order';
    message = `New one-day order #${orderId}`;
  } else if (deliveryType === 'rental') {
    title = 'New rental booking';
    message = `New rental booking #${orderId}`;
  }

  const base = {
    orderId,
    number: orderId,
    storeId,
    deliveryType,
    grandtotal: order.grandtotal ?? order.rentalTotalAmount ?? null,
    status: order.status,
    oneDayStatus: order.oneDayStatus || null,
    rentalStatus: order.rentalStatus || null,
    title,
    message,
  };

  await broadcastOrder('new-order', base);
  await broadcastOrder('new-order', {
    ...base,
    room: `store-${storeId}`,
  });

  if (deliveryType === 'one_day' || deliveryType === 'oneday') {
    await broadcastOrder('one-day-order-created', {
      ...base,
      room: `one-day-store-${storeId}`,
    });
    await broadcastOrder('one-day-order-created', base);
  }

  return true;
}

module.exports = {
  broadcastOrder,
  notifyNewOrder,
};
