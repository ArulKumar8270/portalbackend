const db = require('../../../models');

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function parseJson(val, fallback) {
  if (val == null) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(String(val));
  } catch {
    return fallback;
  }
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function timeToMinutes(t) {
  const [h, m] = String(t || '00:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function isHoliday(store, date = new Date()) {
  const holidays = parseJson(store.holidayDates, []);
  const d = date.toISOString().slice(0, 10);
  return Array.isArray(holidays) && holidays.includes(d);
}

function isWithinWorkingHours(store, date = new Date()) {
  const hours = parseJson(store.workingHours, null);
  if (!hours || typeof hours !== 'object') return true;
  const key = DAY_KEYS[date.getDay()];
  const slot = hours[key];
  if (!slot || slot.closed) return false;
  const now = timeToMinutes(`${date.getHours()}:${date.getMinutes()}`);
  const open = timeToMinutes(slot.open || '00:00');
  const close = timeToMinutes(slot.close || '23:59');
  return now >= open && now <= close;
}

function calcDeliveryCharge(store, distanceKm) {
  const slabs = parseJson(store.deliveryChargeSlabs, [
    { fromKm: 0, toKm: 3, charge: 30 },
    { fromKm: 3, toKm: 5, charge: 50 },
    { fromKm: 5, toKm: 10, charge: 80 },
  ]);
  const d = Number(distanceKm) || 0;
  const list = [...slabs].sort((a, b) => Number(a?.fromKm) - Number(b?.fromKm));
  for (const slab of list) {
    const from = Number(slab.fromKm ?? 0);
    const to = Number(slab.toKm ?? 999);
    if (d >= from && d <= to) return Number(slab.charge ?? 0);
  }
  const last = list[list.length - 1];
  return last ? Number(last.charge ?? 0) : 0;
}

function computePromisedDeliveryAt(store, now = new Date()) {
  const cutoff = store.cutoffTime || '14:00';
  const cutoffMins = timeToMinutes(cutoff);
  const nowMins = timeToMinutes(`${now.getHours()}:${now.getMinutes()}`);
  const promised = new Date(now);
  if (nowMins <= cutoffMins) {
    promised.setHours(20, 0, 0, 0);
  } else {
    promised.setDate(promised.getDate() + 1);
    promised.setHours(14, 0, 0, 0);
  }
  return promised;
}

function getPromiseText(store, now = new Date()) {
  const cutoff = store.cutoffTime || '14:00';
  const cutoffMins = timeToMinutes(cutoff);
  const nowMins = timeToMinutes(`${now.getHours()}:${now.getMinutes()}`);
  return nowMins <= cutoffMins
    ? store.sameDayPromiseText || 'Today by 8 PM'
    : store.nextDayPromiseText || 'Tomorrow by 2 PM';
}

const {
  parseGoogleMapsCoordinates,
  resolveStoreCoordinates,
} = require('../../../utils/googleMapsCoords');

function getEffectiveMaxRadiusKm(store) {
  // Prefer the store setting; only fall back to slabs / default when unset.
  const saved = Number(store.maxDeliveryRadiusKm) || 0;
  if (saved > 0) return saved;
  const slabs = parseJson(store.deliveryChargeSlabs, []);
  const maxSlab =
    Array.isArray(slabs) && slabs.length
      ? Math.max(...slabs.map((s) => Number(s?.toKm) || 0))
      : 0;
  return maxSlab > 0 ? maxSlab : 10;
}

function parseAddressCoords(address) {
  const lat = Number(address?.latitude ?? address?.lat);
  const lng = Number(address?.longitude ?? address?.lng ?? address?.lon);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  return null;
}

async function getStoreOrThrow(storeId) {
  const store = await db.store.findByPk(storeId, { raw: true });
  if (!store) throw Object.assign(new Error('Store not found'), { status: 404 });
  return store;
}

async function quoteDelivery({ storeId, customerLat, customerLng, address }) {
  const store = await getStoreOrThrow(storeId);
  const oneDayEnabled =
    store.oneDayDeliveryEnabled === true ||
    store.oneDayDeliveryEnabled === 1 ||
    store.oneDayDeliveryEnabled === "1";
  if (!oneDayEnabled) {
    return { serviceable: false, reason: 'One-day delivery is not enabled for this store' };
  }
  if (isHoliday(store)) {
    return { serviceable: false, reason: 'Store is closed today (holiday)' };
  }

  const withinWorkingHours = isWithinWorkingHours(store);

  const storeCoords = resolveStoreCoordinates(store);
  if (!storeCoords) {
    return { serviceable: false, reason: 'Store location not configured (add GPS or Google Maps link)' };
  }
  const storeLat = storeCoords.lat;
  const storeLng = storeCoords.lng;

  const addrCoords = parseAddressCoords(address);
  const cLat = Number(customerLat ?? addrCoords?.lat);
  const cLng = Number(customerLng ?? addrCoords?.lng);

  if (!Number.isFinite(cLat) || !Number.isFinite(cLng)) {
    return { serviceable: false, reason: 'Customer location required for one-day delivery' };
  }

  const distanceKm = Math.round(haversineKm(storeLat, storeLng, cLat, cLng) * 100) / 100;
  const maxRadius = getEffectiveMaxRadiusKm(store);
  if (distanceKm > maxRadius) {
    return {
      serviceable: false,
      reason: `Outside delivery radius (${maxRadius} km)`,
      distanceKm,
      maxDeliveryRadiusKm: maxRadius,
    };
  }

  const deliveryCharge = calcDeliveryCharge(store, distanceKm);
  let promisedDeliveryAt;
  let promiseText;
  if (!withinWorkingHours) {
    promisedDeliveryAt = new Date();
    promisedDeliveryAt.setDate(promisedDeliveryAt.getDate() + 1);
    promisedDeliveryAt.setHours(14, 0, 0, 0);
    promiseText = store.nextDayPromiseText || 'Tomorrow by 2 PM';
  } else {
    promisedDeliveryAt = computePromisedDeliveryAt(store);
    promiseText = getPromiseText(store);
  }

  return {
    serviceable: true,
    distanceKm,
    deliveryCharge,
    promisedDeliveryAt,
    promiseText,
    outsideWorkingHours: !withinWorkingHours,
    maxDeliveryRadiusKm: maxRadius,
    storeLatitude: storeLat,
    storeLongitude: storeLng,
    customerLatitude: cLat,
    customerLongitude: cLng,
  };
}

async function logOrderEvent(orderId, status, { employeeId, latitude, longitude, note } = {}) {
  return db.one_day_order_events.create({
    orderId,
    status,
    employeeId: employeeId ?? null,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    note: note ?? null,
  });
}

async function getActiveDeliveryOtp(orderId) {
  const { Op } = require('sequelize');
  return db.one_day_otps.findOne({
    where: {
      orderId,
      verifiedAt: null,
      expiresAt: { [Op.gt]: new Date() },
    },
    order: [['id', 'DESC']],
    raw: true,
  });
}

async function attachActiveOtpsToOrders(orders) {
  const { Op } = require('sequelize');
  const oneDayIds = orders
    .filter((o) => String(o.deliveryType || '').toLowerCase() === 'one_day')
    .filter((o) => String(o.oneDayStatus || '') === 'out_for_delivery')
    .map((o) => o.id);
  if (!oneDayIds.length) {
    return orders.map((o) => ({ ...o, activeDeliveryOtp: null }));
  }
  const otps = await db.one_day_otps.findAll({
    where: {
      orderId: oneDayIds,
      verifiedAt: null,
      expiresAt: { [Op.gt]: new Date() },
    },
    order: [['id', 'DESC']],
    raw: true,
  });
  const byOrder = new Map();
  for (const row of otps) {
    if (!byOrder.has(row.orderId)) byOrder.set(row.orderId, row);
  }
  return orders.map((o) => {
    const otp = byOrder.get(o.id);
    return {
      ...o,
      activeDeliveryOtp: otp
        ? { otp: otp.otp, expiresAt: otp.expiresAt, sentAt: otp.createdAt }
        : null,
    };
  });
}

function estimateEtaMinutes(distanceKm, avgSpeedKmh = 25) {
  const speed = Number(avgSpeedKmh) || 25;
  return Math.max(15, Math.round((Number(distanceKm) / speed) * 60));
}

function getPeriodDateRange(period) {
  if (!period || period === 'all') return null;
  const now = new Date();
  const from = new Date(now);
  if (period === 'day') {
    from.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    from.setDate(from.getDate() - 7);
  } else if (period === 'month') {
    from.setDate(from.getDate() - 30);
  } else {
    return null;
  }
  return { from, to: now };
}

module.exports = {
  DAY_KEYS,
  parseJson,
  haversineKm,
  isHoliday,
  isWithinWorkingHours,
  calcDeliveryCharge,
  computePromisedDeliveryAt,
  getPromiseText,
  quoteDelivery,
  logOrderEvent,
  getActiveDeliveryOtp,
  attachActiveOtpsToOrders,
  estimateEtaMinutes,
  getStoreOrThrow,
  getEffectiveMaxRadiusKm,
  resolveStoreCoordinates,
  getPeriodDateRange,
};
