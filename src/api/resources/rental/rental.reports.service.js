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

async function fetchRentalOrders({ storeId, from, to }) {
  const where = {
    deliveryType: 'rental',
    createdAt: { [Op.gte]: from, [Op.lte]: to },
  };
  if (storeId != null) where.storeId = storeId;
  return db.orders.findAll({ where, order: [['id', 'DESC']], raw: true });
}

function aggregateReports(orders, { storeMap = {} } = {}) {
  const byDate = {};
  const byStatus = {};
  const byStore = {};
  const revenueByDate = {};
  let totalRevenue = 0;
  let totalAdvance = 0;
  let totalBalance = 0;

  for (const o of orders) {
    const d = new Date(o.createdAt).toISOString().slice(0, 10);
    byDate[d] = (byDate[d] || 0) + 1;
    const total = Number(o.rentalTotalAmount ?? o.grandtotal ?? 0);
    revenueByDate[d] = (revenueByDate[d] || 0) + total;

    const st = o.rentalStatus || 'pending_approval';
    byStatus[st] = (byStatus[st] || 0) + 1;

    if (o.storeId) {
      if (!byStore[o.storeId]) {
        byStore[o.storeId] = { storeId: o.storeId, count: 0, revenue: 0, advance: 0 };
      }
      byStore[o.storeId].count += 1;
      byStore[o.storeId].revenue += total;
      byStore[o.storeId].advance += Number(o.rentalAdvanceAmount || 0);
    }

    totalRevenue += total;
    totalAdvance += Number(o.rentalAdvanceAmount || 0);
    totalBalance += Number(o.rentalBalanceAmount || 0);
  }

  return {
    totalBookings: orders.length,
    totalRevenue,
    totalAdvance,
    totalBalance,
    bookingsByDate: Object.entries(byDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    revenueByDate: Object.entries(revenueByDate)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    bookingsByStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
    bookingsByStore: Object.values(byStore).map((row) => ({
      ...row,
      storeName: storeMap[row.storeId] || `Store ${row.storeId}`,
    })),
    bookings: orders.map((o) => ({
      id: o.id,
      storeId: o.storeId,
      storeName: storeMap[o.storeId] || '',
      custId: o.custId,
      rentalStatus: o.rentalStatus,
      rentalTotalAmount: o.rentalTotalAmount ?? o.grandtotal,
      rentalAdvanceAmount: o.rentalAdvanceAmount,
      rentalBalanceAmount: o.rentalBalanceAmount,
      rentalStartAt: o.rentalStartAt,
      rentalEndAt: o.rentalEndAt,
      createdAt: o.createdAt,
    })),
  };
}

async function buildStoreReport(storeId, period, fromQuery) {
  const { from, to, period: p } = getDateRange(period, fromQuery);
  const orders = await fetchRentalOrders({ storeId, from, to });
  const store = await db.store.findByPk(storeId, { raw: true }).catch(() => null);
  const storeMap = store ? { [storeId]: store.storename } : {};
  return { period: p, from, to, storeId, ...aggregateReports(orders, { storeMap }) };
}

async function buildAdminReport(period, fromQuery) {
  const { from, to, period: p } = getDateRange(period, fromQuery);
  const orders = await fetchRentalOrders({ from, to });
  const storeIds = [...new Set(orders.map((o) => o.storeId).filter(Boolean))];
  const stores = storeIds.length
    ? await db.store.findAll({ where: { id: storeIds }, raw: true })
    : [];
  const storeMap = Object.fromEntries(stores.map((s) => [s.id, s.storename]));
  return { period: p, from, to, ...aggregateReports(orders, { storeMap }) };
}

function escapeCsv(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function bookingsToCsv(rows) {
  const headers = [
    'Booking ID', 'Store ID', 'Store Name', 'Customer ID', 'Status',
    'Total', 'Advance', 'Balance', 'Start', 'End', 'Created At',
  ];
  const lines = [headers.join(',')];
  for (const o of rows) {
    lines.push(
      [
        o.id, o.storeId, o.storeName, o.custId, o.rentalStatus,
        o.rentalTotalAmount, o.rentalAdvanceAmount, o.rentalBalanceAmount,
        o.rentalStartAt ? new Date(o.rentalStartAt).toISOString() : '',
        o.rentalEndAt ? new Date(o.rentalEndAt).toISOString() : '',
        o.createdAt ? new Date(o.createdAt).toISOString() : '',
      ].map(escapeCsv).join(',')
    );
  }
  return lines.join('\n');
}

module.exports = {
  buildStoreReport,
  buildAdminReport,
  bookingsToCsv,
};
