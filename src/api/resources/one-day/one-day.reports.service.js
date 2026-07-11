const { Op } = require('sequelize');
const db = require('../../../models');

function getDateRange(period, fromQuery) {
  const now = new Date();
  let from = new Date(now);
  if (period === 'day') from.setDate(from.getDate() - 1);
  else if (period === 'week') from.setDate(from.getDate() - 7);
  else if (period === 'month') from.setMonth(from.getMonth() - 1);
  else if (period === 'year') from.setFullYear(from.getFullYear() - 1);
  else from = new Date(0);
  if (fromQuery) from = new Date(fromQuery);
  return { from, to: now, period };
}

async function fetchOneDayOrders({ storeId, from, to }) {
  const where = {
    deliveryType: 'one_day',
    createdAt: { [Op.gte]: from, [Op.lte]: to },
  };
  if (storeId != null) where.storeId = storeId;
  return db.orders.findAll({ where, order: [['id', 'DESC']], raw: true });
}

function aggregateReports(orders, { employeeMap = {}, storeMap = {} } = {}) {
  const byDate = {};
  const byStatus = {};
  const byEmployee = {};
  const byStore = {};
  const revenueByDate = {};
  let totalRevenue = 0;
  let totalDeliveryCharge = 0;

  for (const o of orders) {
    const d = new Date(o.createdAt).toISOString().slice(0, 10);
    byDate[d] = (byDate[d] || 0) + 1;
    revenueByDate[d] = (revenueByDate[d] || 0) + Number(o.grandtotal || 0);

    const st = o.oneDayStatus || 'placed';
    byStatus[st] = (byStatus[st] || 0) + 1;

    if (o.assignedEmployeeId) {
      byEmployee[o.assignedEmployeeId] = (byEmployee[o.assignedEmployeeId] || 0) + 1;
    }
    if (o.storeId) {
      if (!byStore[o.storeId]) {
        byStore[o.storeId] = { storeId: o.storeId, count: 0, revenue: 0, deliveryCharge: 0 };
      }
      byStore[o.storeId].count += 1;
      byStore[o.storeId].revenue += Number(o.grandtotal || 0);
      byStore[o.storeId].deliveryCharge += Number(o.deliveryCharge || 0);
    }

    totalRevenue += Number(o.grandtotal || 0);
    totalDeliveryCharge += Number(o.deliveryCharge || 0);
  }

  return {
    totalOrders: orders.length,
    totalRevenue,
    totalDeliveryCharge,
    ordersByDate: Object.entries(byDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    revenueByDate: Object.entries(revenueByDate)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    ordersByStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
    ordersByEmployee: Object.entries(byEmployee).map(([id, count]) => ({
      employeeId: Number(id),
      name: employeeMap[id] || `Employee ${id}`,
      count,
    })),
    ordersByStore: Object.values(byStore).map((row) => ({
      ...row,
      storeName: storeMap[row.storeId] || `Store ${row.storeId}`,
    })),
    orders: orders.map((o) => ({
      id: o.id,
      storeId: o.storeId,
      storeName: storeMap[o.storeId] || '',
      custId: o.custId,
      oneDayStatus: o.oneDayStatus,
      grandtotal: o.grandtotal,
      deliveryCharge: o.deliveryCharge,
      distanceKm: o.distanceKm,
      assignedEmployeeId: o.assignedEmployeeId,
      employeeName: employeeMap[o.assignedEmployeeId] || '',
      createdAt: o.createdAt,
      deliveredAt: o.deliveredAt,
    })),
  };
}

async function buildStoreReport(storeId, period, fromQuery) {
  const { from, to } = getDateRange(period, fromQuery);
  const orders = await fetchOneDayOrders({ storeId, from, to });

  const employeeIds = [...new Set(orders.map((o) => o.assignedEmployeeId).filter(Boolean))];
  const employees = employeeIds.length
    ? await db.store_employees.findAll({ where: { id: employeeIds }, raw: true })
    : [];
  const employeeMap = Object.fromEntries(employees.map((e) => [e.id, e.name]));

  const store = await db.store.findByPk(storeId, { raw: true }).catch(() => null);
  const storeMap = store ? { [storeId]: store.storename } : {};

  return {
    period,
    from,
    to,
    storeId,
    ...aggregateReports(orders, { employeeMap, storeMap }),
  };
}

async function buildAdminReport(period, fromQuery) {
  const { from, to } = getDateRange(period, fromQuery);
  const orders = await fetchOneDayOrders({ from, to });

  const employeeIds = [...new Set(orders.map((o) => o.assignedEmployeeId).filter(Boolean))];
  const storeIds = [...new Set(orders.map((o) => o.storeId).filter(Boolean))];

  const [employees, stores] = await Promise.all([
    employeeIds.length
      ? db.store_employees.findAll({ where: { id: employeeIds }, raw: true })
      : [],
    storeIds.length ? db.store.findAll({ where: { id: storeIds }, raw: true }) : [],
  ]);

  const employeeMap = Object.fromEntries(employees.map((e) => [e.id, e.name]));
  const storeMap = Object.fromEntries(stores.map((s) => [s.id, s.storename]));

  return {
    period,
    from,
    to,
    ...aggregateReports(orders, { employeeMap, storeMap }),
  };
}

function escapeCsv(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function ordersToCsv(rows) {
  const headers = [
    'Order ID', 'Store ID', 'Store Name', 'Customer ID', 'Status',
    'Grand Total', 'Delivery Charge', 'Distance Km', 'Employee', 'Created At', 'Delivered At',
  ];
  const lines = [headers.join(',')];
  for (const o of rows) {
    lines.push(
      [
        o.id,
        o.storeId,
        o.storeName,
        o.custId,
        o.oneDayStatus,
        o.grandtotal,
        o.deliveryCharge,
        o.distanceKm,
        o.employeeName,
        o.createdAt ? new Date(o.createdAt).toISOString() : '',
        o.deliveredAt ? new Date(o.deliveredAt).toISOString() : '',
      ].map(escapeCsv).join(',')
    );
  }
  return lines.join('\n');
}

module.exports = {
  getDateRange,
  buildStoreReport,
  buildAdminReport,
  ordersToCsv,
};
