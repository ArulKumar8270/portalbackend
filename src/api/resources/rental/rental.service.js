const { Op } = require('sequelize');
const db = require('../../../models');

/** Products in this app use status "1" for active; some code paths used "active". */
const ACTIVE_PRODUCT_STATUS = { [Op.in]: ['1', 'active', 1] };

function parseJson(val, fallback) {
  if (val == null) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(String(val));
  } catch {
    return fallback;
  }
}

function getPeriodDateRange(period) {
  if (!period || period === 'all') return null;
  const now = new Date();
  const from = new Date(now);
  if (period === 'day') from.setHours(0, 0, 0, 0);
  else if (period === 'week') from.setDate(from.getDate() - 7);
  else if (period === 'month') from.setDate(from.getDate() - 30);
  else return null;
  return { from, to: now };
}

async function getStoreOrThrow(storeId) {
  const store = await db.store.findByPk(storeId);
  if (!store) {
    const err = new Error('Store not found');
    err.status = 404;
    throw err;
  }
  return store;
}

function rentalItemRates(item, billingMode) {
  return {
    pricePerHour: Number(item.pricePerHour ?? item.rentalPricePerHour) || 0,
    pricePerDay: Number(item.pricePerDay ?? item.rentalPricePerDay) || 0,
    minDurationHours: Number(item.minDurationHours ?? item.rentalMinDurationHours) || 1,
    maxDurationDays: Number(item.maxDurationDays ?? item.rentalMaxDurationDays) || 30,
    billingMode: billingMode || 'auto',
  };
}

function computeRentalAmount(rates, startAt, endAt) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return { ok: false, reason: 'Invalid start/end date range' };
  }
  const ms = end.getTime() - start.getTime();
  const hours = ms / (1000 * 60 * 60);
  const days = Math.ceil(hours / 24) || 1;
  const billedHours = Math.max(1, Math.ceil(hours));

  const hourTotal = rates.pricePerHour > 0 ? billedHours * rates.pricePerHour : null;
  const dayTotal = rates.pricePerDay > 0 ? days * rates.pricePerDay : null;

  let total = 0;
  const mode = rates.billingMode || 'auto';
  if (mode === 'hour') {
    if (!hourTotal) return { ok: false, reason: 'Hourly rate not configured' };
    total = hourTotal;
  } else if (mode === 'day') {
    if (!dayTotal) return { ok: false, reason: 'Daily rate not configured' };
    total = dayTotal;
  } else {
    const options = [hourTotal, dayTotal].filter((n) => n != null && n > 0);
    if (!options.length) return { ok: false, reason: 'No rental rate configured' };
    total = Math.min(...options);
  }

  return {
    ok: true,
    durationHours: hours,
    billedHours,
    billedDays: days,
    totalAmount: Math.round(total),
  };
}

/** Statuses that hold a rental unit (block calendar). Completed/cancelled/rejected free the unit. */
const BLOCKING_RENTAL_STATUSES = [
  'pending_approval',
  'pending_proofs',
  'pending_payment',
  'confirmed',
  'handover_pending',
  'active',
  'return_requested',
  'return_pickup',
  'returned',
];

let rentalQuantityColumnsReady = false;
let rentalDocumentColumnsReady = false;
let rentalProofDocumentColumnReady = false;

const RENTAL_DOCUMENT_TYPES = {
  pan_card: 'PAN card',
  aadhar_card: 'Aadhar card',
  driving_licence: 'Driving licence',
  address_proof: 'Address proof',
  company_document: 'Company document',
  other: 'Any other document',
};

function normalizeRentalRequiredDocuments(input) {
  const list = Array.isArray(input) ? input : parseJson(input, []);
  if (!Array.isArray(list)) return [];
  const allowed = new Set(Object.keys(RENTAL_DOCUMENT_TYPES));
  return [...new Set(list.map((k) => String(k)).filter((k) => allowed.has(k)))];
}

function serializeRentalRequiredDocuments(input) {
  if (input === undefined || input === null) return null;
  const normalized = normalizeRentalRequiredDocuments(input);
  return JSON.stringify(normalized);
}

function parseRentalRequiredDocumentsFromItem(item) {
  return normalizeRentalRequiredDocuments(item?.rentalRequiredDocuments);
}

function getRentalRequiredDocuments(resolved, store) {
  const raw = resolved?.item?.rentalRequiredDocuments;
  if (raw != null && String(raw).trim()) {
    return parseRentalRequiredDocumentsFromItem(resolved.item);
  }
  if (store?.rentalRequireIdProof !== false) return ['aadhar_card'];
  return [];
}

function parseDocumentProofs(input) {
  const raw = typeof input === 'object' && input !== null ? input : parseJson(input, {});
  if (!raw || typeof raw !== 'object') return {};
  const out = {};
  for (const [key, val] of Object.entries(raw)) {
    if (typeof val === 'string' && val.trim()) {
      out[key] = val.trim();
    } else if (val && typeof val === 'object' && val.url) {
      out[key] = String(val.url).trim();
    }
  }
  return out;
}

function validateDocumentProofs(requiredDocs, documentProofs) {
  for (const docKey of requiredDocs) {
    if (!documentProofs[docKey]) {
      return `${RENTAL_DOCUMENT_TYPES[docKey] || docKey} is required`;
    }
  }
  return null;
}

async function ensureRentalDocumentColumns() {
  if (rentalDocumentColumnsReady) return;
  for (const sql of [
    `ALTER TABLE products ADD COLUMN rentalRequiredDocuments TEXT NULL`,
    `ALTER TABLE products ADD COLUMN rentalOtherDocumentLabel VARCHAR(255) NULL`,
    `ALTER TABLE rental_catalog_items ADD COLUMN rentalRequiredDocuments TEXT NULL`,
    `ALTER TABLE rental_catalog_items ADD COLUMN rentalOtherDocumentLabel VARCHAR(255) NULL`,
  ]) {
    try {
      await db.sequelize.query(sql);
    } catch {
      /* column may exist */
    }
  }
  rentalDocumentColumnsReady = true;
}

async function ensureRentalBookingProofDocumentColumn() {
  if (rentalProofDocumentColumnReady) return;
  for (const sql of [
    `ALTER TABLE rental_booking_proofs ADD COLUMN documentProofs TEXT NULL`,
    `ALTER TABLE rental_booking_proofs ADD COLUMN otherDocumentLabel VARCHAR(255) NULL`,
  ]) {
    try {
      await db.sequelize.query(sql);
    } catch {
      /* column may exist */
    }
  }
  rentalProofDocumentColumnReady = true;
}

async function updateProductRentalDocuments(productId, docs, otherLabel) {
  await ensureRentalDocumentColumns();
  await db.sequelize.query(
    `UPDATE products SET rentalRequiredDocuments = :docs, rentalOtherDocumentLabel = :label, updatedAt = NOW() WHERE id = :id`,
    {
      replacements: {
        id: Number(productId),
        docs: serializeRentalRequiredDocuments(docs),
        label: otherLabel ? String(otherLabel).trim().slice(0, 255) : null,
      },
    }
  );
}

async function ensureRentalQuantityColumns() {
  if (rentalQuantityColumnsReady) return;
  try {
    await db.sequelize.query(
      `ALTER TABLE products ADD COLUMN rentalQuantity INT NOT NULL DEFAULT 1`
    );
  } catch {
    /* column may exist */
  }
  try {
    await db.sequelize.query(
      `ALTER TABLE rental_catalog_items ADD COLUMN rentalQuantity INT NOT NULL DEFAULT 1`
    );
  } catch {
    /* column may exist */
  }
  rentalQuantityColumnsReady = true;
}

function getRentalItemQuantity(item) {
  const q = Number(item?.rentalQuantity ?? item?.quantity ?? 1);
  return Number.isFinite(q) && q > 0 ? Math.floor(q) : 1;
}

async function countOverlappingBookings(storeId, source, itemId, startAt, endAt, excludeOrderId) {
  await ensureRentalQuantityColumns();
  const start = new Date(startAt);
  const end = new Date(endAt);
  const where = {
    storeId,
    deliveryType: 'rental',
    rentalStatus: { [Op.in]: BLOCKING_RENTAL_STATUSES },
    rentalStartAt: { [Op.lt]: end },
    rentalEndAt: { [Op.gt]: start },
  };
  if (excludeOrderId) where.id = { [Op.ne]: excludeOrderId };
  if (source === 'product') {
    where.rentalSource = 'product';
    where[Op.or] = [
      { productIds: itemId },
      { productIds: String(itemId) },
    ];
  } else {
    where.rentalSource = 'catalog';
    where.rentalCatalogItemId = itemId;
  }
  return db.orders.count({ where });
}

async function isRentalSlotAvailable(storeId, source, itemId, startAt, endAt, excludeOrderId) {
  const resolved = await resolveRentalItem(storeId, source, itemId);
  if (!resolved) return { ok: false, reason: 'Rental item not found' };
  const quantity = getRentalItemQuantity(resolved.item);
  const overlaps = await countOverlappingBookings(storeId, source, itemId, startAt, endAt, excludeOrderId);
  if (overlaps >= quantity) {
    return {
      ok: false,
      reason: quantity <= 1
        ? 'Not available for selected dates'
        : `All ${quantity} units are booked for selected dates`,
    };
  }
  return { ok: true, quantity, unitsBooked: overlaps, unitsAvailable: quantity - overlaps };
}

async function resolveRentalItem(storeId, source, itemId) {
  if (source === 'catalog') {
    const row = await db.sequelize.query(
      `SELECT * FROM rental_catalog_items WHERE id = :id AND storeId = :storeId AND status = 'active' LIMIT 1`,
      { replacements: { id: itemId, storeId }, type: db.sequelize.QueryTypes.SELECT }
    );
    const item = row?.[0];
    if (!item) return null;
    return { source: 'catalog', item, name: item.name, photo: item.photoUrl };
  }
  const product = await db.product.findOne({
    where: { id: itemId, createdId: storeId, isRentalEnabled: true },
    raw: true,
  });
  if (!product) return null;
  return { source: 'product', item: product, name: product.name, photo: product.photo };
}

async function quoteBooking({ storeId, source, itemId, startAt, endAt }) {
  const store = await getStoreOrThrow(storeId);
  if (!store.rentalEnabled) {
    return { serviceable: false, reason: 'Rental not enabled for this store' };
  }
  const resolved = await resolveRentalItem(storeId, source, itemId);
  if (!resolved) {
    return { serviceable: false, reason: 'Rental item not found' };
  }

  const rates = rentalItemRates(resolved.item, store.rentalBillingMode || 'auto');
  const start = new Date(startAt);
  const end = new Date(endAt);
  const now = new Date();
  const minLeadH = Number(store.rentalMinLeadTimeHours) || 2;
  const maxAdvanceDays = Number(store.rentalMaxAdvanceBookingDays) || 90;
  if (start.getTime() < now.getTime() + minLeadH * 3600000) {
    return { serviceable: false, reason: `Book at least ${minLeadH} hours in advance` };
  }
  if (start.getTime() > now.getTime() + maxAdvanceDays * 86400000) {
    return { serviceable: false, reason: `Cannot book more than ${maxAdvanceDays} days ahead` };
  }

  const hours = (end - start) / 3600000;
  if (hours < rates.minDurationHours) {
    return { serviceable: false, reason: `Minimum rental is ${rates.minDurationHours} hour(s)` };
  }
  if (hours > rates.maxDurationDays * 24) {
    return { serviceable: false, reason: `Maximum rental is ${rates.maxDurationDays} day(s)` };
  }

  const holidays = parseJson(store.rentalHolidayDates, []);
  const startDay = start.toISOString().slice(0, 10);
  if (Array.isArray(holidays) && holidays.includes(startDay)) {
    return { serviceable: false, reason: 'Selected start date is a holiday' };
  }

  const amount = computeRentalAmount(rates, startAt, endAt);
  if (!amount.ok) return { serviceable: false, reason: amount.reason };

  const availability = await isRentalSlotAvailable(storeId, source, itemId, startAt, endAt);
  if (!availability.ok) {
    return { serviceable: false, reason: availability.reason };
  }

  const advancePercent = Number(store.rentalAdvancePercent) || 30;
  const advanceAmount = Math.round((amount.totalAmount * advancePercent) / 100);
  const balanceAmount = amount.totalAmount - advanceAmount;

  return {
    serviceable: true,
    source,
    itemId: Number(itemId),
    itemName: resolved.name,
    durationHours: amount.durationHours,
    billedHours: amount.billedHours,
    billedDays: amount.billedDays,
    totalAmount: amount.totalAmount,
    advancePercent,
    advanceAmount,
    balanceAmount,
    rentalStartAt: start,
    rentalEndAt: end,
    rentalQuantity: availability.quantity,
    unitsAvailable: availability.unitsAvailable,
  };
}

/** Quote extending an active rental to a later end date. */
async function quoteExtension({ orderId, newEndAt }) {
  const order = await db.orders.findByPk(orderId);
  if (!order || order.deliveryType !== 'rental') {
    return { serviceable: false, reason: 'Booking not found' };
  }
  if (String(order.rentalStatus) !== 'active') {
    return { serviceable: false, reason: 'Only active rentals can be extended' };
  }
  const currentEnd = new Date(order.rentalEndAt);
  const newEnd = new Date(newEndAt);
  if (Number.isNaN(currentEnd.getTime()) || Number.isNaN(newEnd.getTime())) {
    return { serviceable: false, reason: 'Invalid dates' };
  }
  if (newEnd <= currentEnd) {
    return { serviceable: false, reason: 'New end date must be after current rental end' };
  }

  const store = await getStoreOrThrow(order.storeId);
  const source = String(order.rentalSource || 'product');
  const itemId = source === 'catalog' ? Number(order.rentalCatalogItemId) : Number(order.productIds);
  const resolved = await resolveRentalItem(order.storeId, source, itemId);
  if (!resolved) {
    return { serviceable: false, reason: 'Rental item not found' };
  }

  const rates = rentalItemRates(resolved.item, store.rentalBillingMode || 'auto');
  const hours = (newEnd.getTime() - currentEnd.getTime()) / 3600000;
  if (hours > rates.maxDurationDays * 24) {
    return { serviceable: false, reason: `Extension cannot exceed ${rates.maxDurationDays} day(s) at once` };
  }

  const amount = computeRentalAmount(rates, currentEnd, newEnd);
  if (!amount.ok) return { serviceable: false, reason: amount.reason };

  const availability = await isRentalSlotAvailable(
    order.storeId,
    source,
    itemId,
    currentEnd,
    newEnd,
    order.id
  );
  if (!availability.ok) {
    return { serviceable: false, reason: availability.reason };
  }

  const advancePercent = Number(store.rentalAdvancePercent) || 30;
  const extensionTotal = amount.totalAmount;
  const extensionAdvance = Math.round((extensionTotal * advancePercent) / 100);
  const extensionBalance = extensionTotal - extensionAdvance;

  return {
    serviceable: true,
    orderId: order.id,
    currentEndAt: currentEnd,
    newEndAt: newEnd,
    extensionHours: amount.durationHours,
    extensionTotal,
    extensionAdvance,
    extensionBalance,
    advancePercent,
    newRentalTotal: Number(order.rentalTotalAmount || 0) + extensionTotal,
    newBalanceTotal: Number(order.rentalBalanceAmount || 0) + extensionBalance,
  };
}

async function logRentalEvent(orderId, status, note) {
  try {
    await db.sequelize.query(
      `INSERT INTO rental_booking_events (orderId, status, note, createdAt, updatedAt) VALUES (:orderId, :status, :note, NOW(), NOW())`,
      { replacements: { orderId, status, note: note || null } }
    );
  } catch {
    /* ignore if table missing during dev */
  }
}

let rentalReturnTableReady = false;

async function ensureRentalReturnTable() {
  if (rentalReturnTableReady) return;
  await db.sequelize.query(`
    CREATE TABLE IF NOT EXISTS rental_return_details (
      orderId INT NOT NULL PRIMARY KEY,
      damageReported TINYINT(1) NOT NULL DEFAULT 0,
      damageAmount DECIMAL(10,2) NOT NULL DEFAULT 0,
      damageNote TEXT NULL,
      damageProofUrl TEXT NULL,
      returnCondition VARCHAR(32) NULL,
      customerReturnNote TEXT NULL,
      returnPickupAt DATETIME NULL,
      returnedAt DATETIME NULL,
      damagePaidAt DATETIME NULL,
      returnConfirmedAt DATETIME NULL,
      requestedReturnAt DATETIME NULL,
      earlyReturn TINYINT(1) NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  try {
    await db.sequelize.query(
      `ALTER TABLE orders ADD COLUMN rentalDamageAmount DECIMAL(10,2) NULL DEFAULT 0`
    );
  } catch {
    /* column may already exist */
  }
  for (const sql of [
    `ALTER TABLE rental_return_details ADD COLUMN requestedReturnAt DATETIME NULL`,
    `ALTER TABLE rental_return_details ADD COLUMN earlyReturn TINYINT(1) NOT NULL DEFAULT 0`,
  ]) {
    try {
      await db.sequelize.query(sql);
    } catch {
      /* column may already exist */
    }
  }
  rentalReturnTableReady = true;
}

async function getRentalReturnDetails(orderId) {
  await ensureRentalReturnTable();
  const [rows] = await db.sequelize.query(
    `SELECT * FROM rental_return_details WHERE orderId = :orderId LIMIT 1`,
    { replacements: { orderId: Number(orderId) } }
  );
  return rows?.[0] || null;
}

async function upsertRentalReturnDetails(orderId, fields = {}) {
  await ensureRentalReturnTable();
  const id = Number(orderId);
  const existing = await getRentalReturnDetails(id);
  const clean = Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v !== undefined)
  );
  if (!existing) {
    const keys = Object.keys(clean);
    const cols = ['orderId', ...keys];
    const placeholders = cols.map((c) => `:${c}`);
    await db.sequelize.query(
      `INSERT INTO rental_return_details (${cols.join(', ')}, createdAt, updatedAt)
       VALUES (${placeholders.join(', ')}, NOW(), NOW())`,
      { replacements: { orderId: id, ...clean } }
    );
    return;
  }
  const keys = Object.keys(clean);
  if (!keys.length) return;
  const sets = keys.map((k) => `${k} = :${k}`);
  await db.sequelize.query(
    `UPDATE rental_return_details SET ${sets.join(', ')}, updatedAt = NOW() WHERE orderId = :orderId`,
    { replacements: { orderId: id, ...clean } }
  );
}

/** Login/register may use `users` or `customers` — orders.custId follows the logged-in id. */
async function resolveBookingCustomer(custId) {
  const id = Number(custId);
  if (!Number.isFinite(id) || id <= 0) return null;

  const customer = await db.customer.findByPk(id).catch(() => null);
  if (customer) return { id, record: customer, table: 'customer' };

  const user = await db.user.findByPk(id).catch(() => null);
  if (user) return { id, record: user, table: 'user' };

  return null;
}

module.exports = {
  ACTIVE_PRODUCT_STATUS,
  parseJson,
  getPeriodDateRange,
  getStoreOrThrow,
  rentalItemRates,
  computeRentalAmount,
  countOverlappingBookings,
  isRentalSlotAvailable,
  getRentalItemQuantity,
  ensureRentalQuantityColumns,
  ensureRentalDocumentColumns,
  ensureRentalBookingProofDocumentColumn,
  updateProductRentalDocuments,
  RENTAL_DOCUMENT_TYPES,
  normalizeRentalRequiredDocuments,
  serializeRentalRequiredDocuments,
  parseRentalRequiredDocumentsFromItem,
  getRentalRequiredDocuments,
  parseDocumentProofs,
  validateDocumentProofs,
  resolveRentalItem,
  quoteBooking,
  quoteExtension,
  logRentalEvent,
  resolveBookingCustomer,
  ensureRentalReturnTable,
  getRentalReturnDetails,
  upsertRentalReturnDetails,
};
