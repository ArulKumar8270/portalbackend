const http = require('http');

const WS_HOST = process.env.WS_HOST || '127.0.0.1';
const WS_PORT = Number(process.env.WS_PORT || 3001);

/**
 * Broadcast rental event via WebSocket server (room-targeted when provided).
 */
function broadcastRental(event, data = {}) {
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
      console.warn('[RentalNotify] WebSocket broadcast failed:', err.message);
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
 * Notify store dashboard + seller apps when a customer submits a rental booking.
 * Emits both `rental-booking-created` (rental-specific) and `new-order`
 * (Flutter NewOrderService already listens for new-order).
 */
async function notifyRentalBookingCreated(order, extras = {}) {
  const orderId = order?.id;
  const storeId = order?.storeId;
  if (!orderId || storeId == null) return false;

  const bookerName = extras.bookerName || '';
  const advance = order.rentalAdvanceAmount ?? order.grandtotal ?? '';
  const message = bookerName
    ? `New rental booking #${orderId} from ${bookerName}`
    : `New rental booking #${orderId}`;

  const base = {
    orderId,
    storeId,
    deliveryType: 'rental',
    rentalStatus: order.rentalStatus || 'pending_approval',
    grandtotal: order.rentalTotalAmount ?? order.grandtotal,
    advanceAmount: advance,
    bookerName,
    message,
    title: 'New rental booking',
  };

  // Room-targeted + global fallback (clients that never joined rental rooms)
  await broadcastRental('rental-booking-created', {
    ...base,
    room: `rental-store-${storeId}`,
  });
  await broadcastRental('rental-booking-created', {
    ...base,
    room: 'rental-admin',
  });
  await broadcastRental('rental-booking-created', {
    ...base,
  });
  // Seller Flutter app listens for `new-order`
  await broadcastRental('new-order', {
    ...base,
    number: orderId,
    message,
    title: 'New rental booking',
  });

  return true;
}

async function notifyRentalBookingStatus(order, status, extras = {}) {
  const orderId = order?.id;
  const storeId = order?.storeId;
  if (!orderId || storeId == null) return false;

  const message =
    extras.message ||
    `Rental booking #${orderId} is now ${status}`;

  const base = {
    orderId,
    storeId,
    deliveryType: 'rental',
    rentalStatus: status,
    custId: order.custId,
    message,
    title: extras.title || 'Rental booking update',
  };

  await broadcastRental('rental-booking-updated', {
    ...base,
    room: `rental-store-${storeId}`,
  });

  if (order.custId) {
    await broadcastRental('rental-booking-updated', {
      ...base,
      room: `rental-customer-${order.custId}`,
    });
  }

  return true;
}

module.exports = {
  broadcastRental,
  notifyRentalBookingCreated,
  notifyRentalBookingStatus,
};
