const http = require('http');

const WS_HOST = process.env.WS_HOST || '127.0.0.1';
const WS_PORT = Number(process.env.WS_PORT || 3001);

/**
 * Broadcast one-day event via WebSocket server (room-targeted when provided).
 */
function broadcastOneDay(event, data = {}) {
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
      console.warn('[OneDayNotify] WebSocket broadcast failed:', err.message);
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

async function notifyOrderAssigned(order, employee) {
  const payload = {
    orderId: order.id,
    storeId: order.storeId,
    employeeId: employee.id,
    employeeName: employee.name,
    message: `Order #${order.id} assigned to ${employee.name}`,
    title: 'New delivery assignment',
    room: `one-day-employee-${employee.id}`,
  };
  await broadcastOneDay('one-day-order-assigned', payload);
  await broadcastOneDay('one-day-order-assigned', {
    ...payload,
    room: `one-day-store-${order.storeId}`,
    message: `Order #${order.id} assigned to ${employee.name}`,
  });
}

async function notifyOutForDelivery(order, employeeName) {
  const payload = {
    orderId: order.id,
    storeId: order.storeId,
    employeeId: order.assignedEmployeeId,
    employeeName: employeeName || '',
    message: `Order #${order.id} is out for delivery`,
    title: 'Out for delivery',
    room: `one-day-store-${order.storeId}`,
  };
  await broadcastOneDay('one-day-out-for-delivery', payload);
  if (order.assignedEmployeeId) {
    await broadcastOneDay('one-day-out-for-delivery', {
      ...payload,
      room: `one-day-employee-${order.assignedEmployeeId}`,
    });
  }
  await broadcastOneDay('one-day-out-for-delivery', {
    ...payload,
    room: 'one-day-admin',
  });
  if (order.custId) {
    await broadcastOneDay('one-day-out-for-delivery', {
      ...payload,
      room: `one-day-customer-${order.custId}`,
      message: `Your order #${order.id} is on the way`,
      title: 'Order on the way',
    });
  }
}

async function notifyDeliveryOtp(order, otp, expiresAt) {
  const payload = {
    orderId: order.id,
    storeId: order.storeId,
    custId: order.custId,
    otp,
    expiresAt,
    message: `Delivery OTP for order #${order.id}`,
    title: 'Delivery OTP',
    room: order.custId ? `one-day-customer-${order.custId}` : null,
  };
  await broadcastOneDay('one-day-delivery-otp', payload);
  if (order.custId) {
    await broadcastOneDay('one-day-delivery-otp', {
      ...payload,
      room: `one-day-customer-${order.custId}`,
    });
  }
  await broadcastOneDay('one-day-delivery-otp', {
    ...payload,
    room: `one-day-order-${order.id}`,
  });
}

module.exports = {
  broadcastOneDay,
  notifyOrderAssigned,
  notifyOutForDelivery,
  notifyDeliveryOtp,
};
