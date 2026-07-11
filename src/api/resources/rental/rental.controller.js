const { Op } = require('sequelize');
const db = require('../../../models');
const {
  parseJson,
  getPeriodDateRange,
  getStoreOrThrow,
  quoteBooking,
  logRentalEvent,
  resolveRentalItem,
  ACTIVE_PRODUCT_STATUS,
  resolveBookingCustomer,
  ensureRentalReturnTable,
  getRentalReturnDetails,
  upsertRentalReturnDetails,
  ensureRentalQuantityColumns,
  ensureRentalDocumentColumns,
  ensureRentalBookingProofDocumentColumn,
  updateProductRentalDocuments,
  normalizeRentalRequiredDocuments,
  serializeRentalRequiredDocuments,
  parseRentalRequiredDocumentsFromItem,
  getRentalRequiredDocuments,
  parseDocumentProofs,
  validateDocumentProofs,
  RENTAL_DOCUMENT_TYPES,
  quoteExtension,
} = require('./rental.service');
const { buildStoreReport, buildAdminReport, bookingsToCsv } = require('./rental.reports.service');

function getCustomerUserId(req) {
  const u = req.user || {};
  const id = Number(u.sub ?? u.id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/** Store dashboard users may have storeId / vendorId on the user record. */
function getUserStoreIds(req) {
  const u = req.user?.dataValues || req.user || {};
  const ids = new Set();
  for (const key of ['storeId', 'vendorId', 'id']) {
    const n = Number(u[key]);
    if (Number.isFinite(n) && n > 0) ids.add(n);
  }
  const jwtId = getCustomerUserId(req);
  if (jwtId) ids.add(jwtId);
  return ids;
}

function canAccessRentalBooking(req, order) {
  const queryCustId = Number(req.query.custId);
  const jwtUserId = getCustomerUserId(req);

  if (queryCustId && Number(order.custId) === queryCustId) return true;
  if (jwtUserId && Number(order.custId) === jwtUserId) return true;

  if (req.user) {
    const storeIds = getUserStoreIds(req);
    if (storeIds.has(Number(order.storeId))) return true;
    const queryStoreId = Number(req.query.storeId);
    if (queryStoreId && Number(order.storeId) === queryStoreId) return true;
  }

  return false;
}

function bookingJson(order, proof) {
  const plain = order.get ? order.get({ plain: true }) : order;
  return {
    ...plain,
    proof: proof || null,
  };
}

function buildRentalDeliveryAddress(b) {
  const nested =
    b.deliveryAddress && typeof b.deliveryAddress === 'object' && !Array.isArray(b.deliveryAddress)
      ? b.deliveryAddress
      : {};

  const latRaw = nested.latitude ?? b.latitude;
  const lngRaw = nested.longitude ?? b.longitude;
  const lat = latRaw != null && latRaw !== '' && Number.isFinite(Number(latRaw)) ? Number(latRaw) : null;
  const lng = lngRaw != null && lngRaw !== '' && Number.isFinite(Number(lngRaw)) ? Number(lngRaw) : null;

  const locationUrl =
    String(nested.locationUrl ?? b.locationUrl ?? '').trim() ||
    (lat != null && lng != null ? `https://www.google.com/maps?q=${lat},${lng}` : null);

  const addr = {
    bookerName: nested.bookerName ?? b.bookerName ?? null,
    bookerPhone: nested.bookerPhone ?? b.bookerPhone ?? null,
    locationMode: nested.locationMode ?? b.locationMode ?? null,
    addressLine: String(nested.addressLine ?? b.addressLine ?? '').trim() || null,
    city: String(nested.city ?? b.city ?? '').trim() || null,
    pincode: String(nested.pincode ?? b.pincode ?? '').trim() || null,
    landmark: String(nested.landmark ?? b.landmark ?? '').trim() || null,
    latitude: lat,
    longitude: lng,
    locationUrl,
  };

  const parts = [addr.addressLine, addr.landmark, addr.city, addr.pincode].filter(Boolean);
  if (parts.length) {
    addr.locationLabel = parts.join(', ');
  } else if (lat != null && lng != null) {
    addr.locationLabel = `GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } else if (locationUrl) {
    addr.locationLabel = 'Google Maps location';
  } else {
    addr.locationLabel = null;
  }

  return addr;
}

function validateRentalDeliveryAddress(addr) {
  const hasText = Boolean(addr.addressLine) || Boolean(addr.city);
  const hasCoords = addr.latitude != null && addr.longitude != null;
  const hasMaps = Boolean(addr.locationUrl);
  if (!hasText && !hasCoords && !hasMaps) {
    return 'Delivery address or location is required';
  }
  return null;
}

let rentalHandoverProofColumnsReady = false;

async function ensureRentalHandoverProofColumns() {
  if (rentalHandoverProofColumnsReady) return;
  for (const sql of [
    `ALTER TABLE rental_booking_proofs ADD COLUMN handoverProofUrl TEXT NULL`,
    `ALTER TABLE rental_booking_proofs ADD COLUMN handoverLatitude DECIMAL(10, 7) NULL`,
    `ALTER TABLE rental_booking_proofs ADD COLUMN handoverLongitude DECIMAL(10, 7) NULL`,
    `ALTER TABLE rental_booking_proofs ADD COLUMN handoverLocationUrl TEXT NULL`,
    `ALTER TABLE rental_booking_proofs ADD COLUMN handoverAt DATETIME NULL`,
    `ALTER TABLE rental_booking_proofs ADD COLUMN customerConfirmedAt DATETIME NULL`,
  ]) {
    try {
      await db.sequelize.query(sql);
    } catch {
      /* column may exist */
    }
  }
  rentalHandoverProofColumnsReady = true;
}

function buildMapsUrl(lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  return `https://www.google.com/maps?q=${la},${ln}`;
}

module.exports = {
  async getSettings(req, res, next) {
    try {
      const store = await getStoreOrThrow(req.params.storeId);
      res.json({
        success: true,
        data: {
          rentalEnabled: !!store.rentalEnabled,
          rentalBillingMode: store.rentalBillingMode || 'auto',
          rentalAdvancePercent: Number(store.rentalAdvancePercent) || 30,
          rentalMinLeadTimeHours: store.rentalMinLeadTimeHours,
          rentalMaxAdvanceBookingDays: store.rentalMaxAdvanceBookingDays,
          rentalWorkingHours: parseJson(store.rentalWorkingHours, null),
          rentalHolidayDates: parseJson(store.rentalHolidayDates, []),
          rentalTermsUrl: store.rentalTermsUrl,
          rentalCancellationPolicy: store.rentalCancellationPolicy,
          rentalRequireIdProof: store.rentalRequireIdProof !== false,
          rentalPaymentMode: 'razorpay',
        },
      });
    } catch (e) {
      next(e);
    }
  },

  async updateSettings(req, res, next) {
    try {
      const store = await getStoreOrThrow(req.params.storeId);
      const fields = [
        'rentalEnabled', 'rentalBillingMode', 'rentalAdvancePercent', 'rentalMinLeadTimeHours',
        'rentalMaxAdvanceBookingDays', 'rentalWorkingHours', 'rentalHolidayDates',
        'rentalTermsUrl', 'rentalCancellationPolicy', 'rentalRequireIdProof',
      ];
      const patch = {};
      for (const f of fields) {
        if (req.body?.[f] !== undefined) patch[f] = req.body[f];
      }
      await store.update(patch);
      res.json({ success: true, message: 'Rental settings updated' });
    } catch (e) {
      next(e);
    }
  },

  async listPublicCatalog(req, res, next) {
    try {
      await ensureRentalDocumentColumns();
      const storeId = Number(req.params.storeId);
      const store = await getStoreOrThrow(storeId);
      if (!store.rentalEnabled) {
        return res.json({ success: true, data: [] });
      }
      const products = await db.product.findAll({
        where: {
          createdId: storeId,
          isRentalEnabled: true,
          status: ACTIVE_PRODUCT_STATUS,
        },
        raw: true,
      });
      const [catalog] = await db.sequelize.query(
        `SELECT * FROM rental_catalog_items WHERE storeId = :storeId AND status = 'active' ORDER BY sortOrder ASC, id DESC`,
        { replacements: { storeId } }
      );

      const productIds = products.map((p) => p.id).filter(Boolean);
      const extraPhotos = new Map();
      const allPhotos = new Map();
      if (productIds.length) {
        const [photoRows] = await db.sequelize.query(
          `SELECT productId, imgUrl FROM productphotos WHERE productId IN (:ids) ORDER BY id ASC`,
          { replacements: { ids: productIds } }
        );
        for (const row of photoRows || []) {
          const pid = Number(row.productId);
          if (!row.imgUrl) continue;
          if (!extraPhotos.has(pid)) extraPhotos.set(pid, row.imgUrl);
          if (!allPhotos.has(pid)) allPhotos.set(pid, []);
          const list = allPhotos.get(pid);
          if (!list.includes(row.imgUrl)) list.push(row.imgUrl);
        }
      }

      const items = [
        ...products.map((p) => {
          const pid = Number(p.id);
          const gallery = allPhotos.get(pid) || [];
          const primaryPhoto = p.photo || extraPhotos.get(pid) || gallery[0] || null;
          return {
            source: 'product',
            itemId: p.id,
            name: p.name,
            description: p.sortDesc || p.desc,
            photo: primaryPhoto,
            photoUrl: primaryPhoto,
            photos: gallery.length ? gallery : primaryPhoto ? [primaryPhoto] : [],
            pricePerHour: p.rentalPricePerHour,
            pricePerDay: p.rentalPricePerDay,
            rentalQuantity: Number(p.rentalQuantity) > 0 ? Number(p.rentalQuantity) : 1,
            requiredDocuments:
              p.rentalRequiredDocuments != null && String(p.rentalRequiredDocuments).trim()
                ? parseRentalRequiredDocumentsFromItem(p)
                : null,
            otherDocumentLabel: p.rentalOtherDocumentLabel || null,
          };
        }),
        ...(catalog || []).map((c) => ({
          source: 'catalog',
          itemId: c.id,
          name: c.name,
          description: c.description,
          photo: c.photoUrl || null,
          photoUrl: c.photoUrl || null,
          pricePerHour: c.pricePerHour,
          pricePerDay: c.pricePerDay,
          rentalQuantity: Number(c.rentalQuantity) > 0 ? Number(c.rentalQuantity) : 1,
          requiredDocuments:
            c.rentalRequiredDocuments != null && String(c.rentalRequiredDocuments).trim()
              ? parseRentalRequiredDocumentsFromItem(c)
              : null,
          otherDocumentLabel: c.rentalOtherDocumentLabel || null,
        })),
      ];
      res.json({ success: true, data: items });
    } catch (e) {
      next(e);
    }
  },

  async listProducts(req, res, next) {
    try {
      await ensureRentalDocumentColumns();
      const storeId = Number(req.params.storeId);
      const products = await db.product.findAll({
        where: { createdId: storeId, isRentalEnabled: true },
        order: [['id', 'DESC']],
        raw: true,
      });
      const [catalog] = await db.sequelize.query(
        `SELECT * FROM rental_catalog_items WHERE storeId = :storeId ORDER BY id DESC`,
        { replacements: { storeId } }
      );
      res.json({ success: true, data: { products, catalogItems: catalog || [] } });
    } catch (e) {
      next(e);
    }
  },

  async linkProduct(req, res, next) {
    try {
      await ensureRentalQuantityColumns();
      await ensureRentalDocumentColumns();
      const {
        storeId,
        productId,
        rentalPricePerHour,
        rentalPricePerDay,
        rentalMinDurationHours,
        rentalMaxDurationDays,
        rentalQuantity,
        rentalRequiredDocuments,
        rentalOtherDocumentLabel,
      } = req.body || {};
      const product = await db.product.findOne({ where: { id: productId, createdId: storeId } });
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      if (!rentalPricePerHour && !rentalPricePerDay) {
        return res.status(400).json({ success: false, message: 'Set hourly or daily rental price' });
      }
      const qty = Math.max(1, Number(rentalQuantity) || 1);
      await product.update({
        isRentalEnabled: true,
        rentalPricePerHour: rentalPricePerHour ?? null,
        rentalPricePerDay: rentalPricePerDay ?? null,
        rentalMinDurationHours: rentalMinDurationHours ?? 1,
        rentalMaxDurationDays: rentalMaxDurationDays ?? 30,
        rentalQuantity: qty,
      });
      if (rentalRequiredDocuments !== undefined || rentalOtherDocumentLabel !== undefined) {
        await updateProductRentalDocuments(
          productId,
          rentalRequiredDocuments,
          rentalOtherDocumentLabel
        );
      }
      const refreshed = await db.product.findByPk(productId, { raw: true });
      res.json({ success: true, data: refreshed || product });
    } catch (e) {
      next(e);
    }
  },

  async unlinkProduct(req, res, next) {
    try {
      const { storeId, productId } = req.body || {};
      const product = await db.product.findOne({ where: { id: productId, createdId: storeId } });
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      await product.update({
        isRentalEnabled: false,
        rentalPricePerHour: null,
        rentalPricePerDay: null,
      });
      res.json({ success: true, message: 'Product removed from rental catalog' });
    } catch (e) {
      next(e);
    }
  },

  async createCatalogItem(req, res, next) {
    try {
      await ensureRentalQuantityColumns();
      await ensureRentalDocumentColumns();
      const b = req.body || {};
      const storeId = Number(b.storeId);
      if (!storeId || !b.name) {
        return res.status(400).json({ success: false, message: 'storeId and name required' });
      }
      if (!b.pricePerHour && !b.pricePerDay) {
        return res.status(400).json({ success: false, message: 'Set hourly or daily price' });
      }
      const photoUrl = b.photoUrl || b.photo || null;
      if (!photoUrl) {
        return res.status(400).json({
          success: false,
          message: 'Product image is required. Upload a photo before saving.',
        });
      }
      const qty = Math.max(1, Number(b.rentalQuantity) || 1);
      const docsJson = serializeRentalRequiredDocuments(b.rentalRequiredDocuments);
      const otherLabel = b.rentalOtherDocumentLabel
        ? String(b.rentalOtherDocumentLabel).trim().slice(0, 255)
        : null;
      await db.sequelize.query(
        `INSERT INTO rental_catalog_items (storeId, name, description, photoUrl, pricePerHour, pricePerDay, minDurationHours, maxDurationDays, rentalQuantity, rentalRequiredDocuments, rentalOtherDocumentLabel, status, sortOrder, createdAt, updatedAt)
         VALUES (:storeId, :name, :description, :photoUrl, :pricePerHour, :pricePerDay, :minDurationHours, :maxDurationDays, :rentalQuantity, :rentalRequiredDocuments, :rentalOtherDocumentLabel, 'active', 0, NOW(), NOW())`,
        {
          replacements: {
            storeId,
            name: b.name,
            description: b.description || null,
            photoUrl,
            pricePerHour: b.pricePerHour ?? null,
            pricePerDay: b.pricePerDay ?? null,
            minDurationHours: b.minDurationHours ?? 1,
            maxDurationDays: b.maxDurationDays ?? 30,
            rentalQuantity: qty,
            rentalRequiredDocuments: docsJson,
            rentalOtherDocumentLabel: otherLabel,
          },
        }
      );
      const [rows] = await db.sequelize.query(
        `SELECT * FROM rental_catalog_items WHERE storeId = :storeId ORDER BY id DESC LIMIT 1`,
        { replacements: { storeId } }
      );
      res.json({ success: true, data: rows?.[0] });
    } catch (e) {
      next(e);
    }
  },

  async updateCatalogItem(req, res, next) {
    try {
      await ensureRentalQuantityColumns();
      await ensureRentalDocumentColumns();
      const id = Number(req.params.id);
      const b = req.body || {};
      const fields = ['name', 'description', 'photoUrl', 'pricePerHour', 'pricePerDay', 'minDurationHours', 'maxDurationDays', 'status', 'rentalQuantity', 'rentalOtherDocumentLabel'];
      const sets = [];
      const replacements = { id };
      for (const f of fields) {
        if (b[f] !== undefined) {
          sets.push(`${f} = :${f}`);
          if (f === 'rentalQuantity') {
            replacements[f] = Math.max(1, Number(b[f]) || 1);
          } else if (f === 'pricePerHour' || f === 'pricePerDay') {
            replacements[f] = b[f] === null || b[f] === '' ? null : Number(b[f]);
          } else if (f === 'rentalOtherDocumentLabel') {
            replacements[f] = b[f] ? String(b[f]).trim().slice(0, 255) : null;
          } else {
            replacements[f] = b[f];
          }
        }
      }
      if (b.rentalRequiredDocuments !== undefined) {
        sets.push('rentalRequiredDocuments = :rentalRequiredDocuments');
        replacements.rentalRequiredDocuments = serializeRentalRequiredDocuments(b.rentalRequiredDocuments);
      }
      if (!sets.length) return res.status(400).json({ success: false, message: 'No fields to update' });
      await db.sequelize.query(
        `UPDATE rental_catalog_items SET ${sets.join(', ')}, updatedAt = NOW() WHERE id = :id`,
        { replacements }
      );
      const [rows] = await db.sequelize.query(`SELECT * FROM rental_catalog_items WHERE id = :id`, { replacements: { id } });
      res.json({ success: true, data: rows?.[0] });
    } catch (e) {
      console.error('[rental] updateCatalogItem failed:', e?.message || e);
      return res.status(500).json({ success: false, message: e?.message || 'Could not update rental item' });
    }
  },

  async deleteCatalogItem(req, res, next) {
    try {
      await db.sequelize.query(`UPDATE rental_catalog_items SET status = 'inactive', updatedAt = NOW() WHERE id = :id`, {
        replacements: { id: Number(req.params.id) },
      });
      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  },

  async quote(req, res, next) {
    try {
      const b = req.body || {};
      const data = await quoteBooking({
        storeId: Number(b.storeId),
        source: String(b.source || 'product'),
        itemId: Number(b.itemId),
        startAt: b.startAt,
        endAt: b.endAt,
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async quoteExtension(req, res, next) {
    try {
      const orderId = Number(req.params.id);
      const newEndAt = req.body?.newEndAt;
      if (!newEndAt) {
        return res.status(400).json({ success: false, message: 'newEndAt is required' });
      }
      const data = await quoteExtension({ orderId, newEndAt });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async extendBooking(req, res, next) {
    try {
      const orderId = Number(req.params.id);
      const b = req.body || {};
      const custId = getCustomerUserId(req) || Number(b.custId);
      if (!custId) {
        return res.status(400).json({ success: false, message: 'Customer id is required' });
      }
      if (!b.razorpayPaymentId) {
        return res.status(400).json({ success: false, message: 'Razorpay payment required for extension' });
      }
      if (!b.newEndAt) {
        return res.status(400).json({ success: false, message: 'newEndAt is required' });
      }

      const order = await db.orders.findByPk(orderId);
      if (!order || order.deliveryType !== 'rental') {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      if (Number(order.custId) !== custId) {
        return res.status(403).json({ success: false, message: 'Not your booking' });
      }

      let quote = await quoteExtension({ orderId, newEndAt: b.newEndAt });
      if (!quote.serviceable && b.extensionTotal && b.extensionAdvance) {
        quote = {
          serviceable: true,
          extensionTotal: Number(b.extensionTotal),
          extensionAdvance: Number(b.extensionAdvance),
          extensionBalance: Number(b.extensionBalance ?? Number(b.extensionTotal) - Number(b.extensionAdvance)),
          newEndAt: new Date(b.newEndAt),
        };
      }
      if (!quote.serviceable) {
        return res.status(400).json({ success: false, message: quote.reason || 'Cannot extend' });
      }

      const newTotal = Number(order.rentalTotalAmount || 0) + quote.extensionTotal;
      const newAdvance = Number(order.rentalAdvanceAmount || 0) + quote.extensionAdvance;
      const newBalance = Number(order.rentalBalanceAmount || 0) + quote.extensionBalance;

      await order.update({
        rentalEndAt: quote.newEndAt,
        rentalTotalAmount: newTotal,
        rentalAdvanceAmount: newAdvance,
        rentalBalanceAmount: newBalance,
        grandtotal: newTotal,
      });

      await logRentalEvent(
        order.id,
        'extended',
        `Rental extended to ${quote.newEndAt.toISOString?.() || b.newEndAt}. Extra ₹${quote.extensionTotal} (₹${quote.extensionAdvance} advance paid)`
      );

      res.json({
        success: true,
        message: 'Rental extended successfully',
        data: {
          orderId: order.id,
          rentalEndAt: quote.newEndAt,
          rentalTotalAmount: newTotal,
          rentalAdvanceAmount: newAdvance,
          rentalBalanceAmount: newBalance,
          extensionTotal: quote.extensionTotal,
        },
      });
    } catch (e) {
      next(e);
    }
  },

  async createBooking(req, res, next) {
    try {
      const b = req.body || {};
      const custId = getCustomerUserId(req) || Number(b.custId);
      if (!custId) {
        return res.status(400).json({ success: false, message: 'Customer id is required' });
      }

      if (!b.razorpayPaymentId) {
        return res.status(400).json({ success: false, message: 'Razorpay payment required for rental booking' });
      }

      const customer = await resolveBookingCustomer(custId);
      if (!customer) {
        return res.status(400).json({ success: false, message: 'Customer account not found' });
      }
      const resolvedCustId = customer.id;

      const [existingProof] = await db.sequelize.query(
        `SELECT orderId FROM rental_booking_proofs WHERE paymentReference = :ref LIMIT 1`,
        { replacements: { ref: String(b.razorpayPaymentId) } }
      );
      if (existingProof?.[0]?.orderId) {
        return res.json({
          success: true,
          message: 'Booking already recorded for this payment.',
          data: { orderId: existingProof[0].orderId },
        });
      }

      const source = String(b.source || 'product').toLowerCase();
      const itemId = Number(b.itemId);
      const storeId = Number(b.storeId);

      if (!Number.isFinite(itemId) || itemId <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid rental item' });
      }

      let quote = await quoteBooking({
        storeId, source, itemId, startAt: b.startAt, endAt: b.endAt,
      });

      // Payment already captured — do not fail booking if re-quote drifts; use paid amounts from client.
      if (!quote.serviceable && b.razorpayPaymentId && b.totalAmount && b.advanceAmount) {
        quote = {
          serviceable: true,
          source,
          itemId,
          totalAmount: Number(b.totalAmount),
          advanceAmount: Number(b.advanceAmount),
          balanceAmount: Number(b.balanceAmount ?? Number(b.totalAmount) - Number(b.advanceAmount)),
          advancePercent: Number(b.advancePercent) || 30,
          rentalStartAt: new Date(b.startAt),
          rentalEndAt: new Date(b.endAt),
        };
      }

      if (!quote.serviceable) {
        return res.status(400).json({ success: false, message: quote.reason || 'Not available' });
      }

      const store = await getStoreOrThrow(storeId);

      const resolved = await resolveRentalItem(storeId, source, itemId);
      if (!resolved) {
        return res.status(400).json({ success: false, message: 'Rental item not found' });
      }

      const requiredDocs = getRentalRequiredDocuments(resolved, store);
      const documentProofs = parseDocumentProofs(b.documentProofs);
      const proofError = validateDocumentProofs(requiredDocs, documentProofs);
      if (proofError) {
        return res.status(400).json({ success: false, message: proofError });
      }

      const idProofUrl =
        b.idProofUrl ||
        requiredDocs.map((key) => documentProofs[key]).find(Boolean) ||
        null;

      if (requiredDocs.length === 0 && store.rentalRequireIdProof !== false && !idProofUrl) {
        return res.status(400).json({ success: false, message: 'ID proof required' });
      }

      if (!b.bookerName || !b.bookerPhone) {
        return res.status(400).json({ success: false, message: 'Booker name and phone are required' });
      }

      const deliveryAddress = buildRentalDeliveryAddress(b);
      const locationError = validateRentalDeliveryAddress(deliveryAddress);
      if (locationError) {
        return res.status(400).json({ success: false, message: locationError });
      }

      const order = await db.orders.create({
        custId: resolvedCustId,
        storeId,
        // orders.productIds is NOT NULL — catalog rentals use rentalCatalogItemId; product rentals use item id.
        productIds: source === 'product' ? itemId : 0,
        qty: 1,
        paymentmethod: '1',
        orderType: 'Product',
        deliveryType: 'rental',
        grandtotal: quote.totalAmount,
        status: 'processing',
        rentalStatus: 'pending_approval',
        rentalSource: source,
        rentalCatalogItemId: source === 'catalog' ? itemId : null,
        rentalStartAt: quote.rentalStartAt,
        rentalEndAt: quote.rentalEndAt,
        rentalTotalAmount: quote.totalAmount,
        rentalAdvancePercent: quote.advancePercent,
        rentalAdvanceAmount: quote.advanceAmount,
        rentalBalanceAmount: quote.balanceAmount,
        deliveryAddress: JSON.stringify(deliveryAddress),
      });

      try {
        await ensureRentalBookingProofDocumentColumn();
        const otherDocumentLabel =
          resolved.item?.rentalOtherDocumentLabel ||
          b.otherDocumentLabel ||
          null;
        await db.sequelize.query(
          `INSERT INTO rental_booking_proofs (orderId, bookerName, bookerPhone, idProofUrl, documentProofs, otherDocumentLabel, paymentProofUrl, paymentMethod, paymentReference, createdAt, updatedAt)
           VALUES (:orderId, :bookerName, :bookerPhone, :idProofUrl, :documentProofs, :otherDocumentLabel, NULL, 'razorpay', :paymentReference, NOW(), NOW())`,
          {
            replacements: {
              orderId: order.id,
              bookerName: b.bookerName || null,
              bookerPhone: b.bookerPhone || null,
              idProofUrl: idProofUrl || null,
              documentProofs: Object.keys(documentProofs).length
                ? JSON.stringify(documentProofs)
                : null,
              otherDocumentLabel,
              paymentReference: b.razorpayPaymentId,
            },
          }
        );
      } catch (proofErr) {
        console.error('[rental] booking proof insert failed:', proofErr?.message || proofErr);
        return res.status(500).json({
          success: false,
          message: 'Booking saved but proof record failed. Contact support with payment ID.',
          data: { orderId: order.id, razorpayPaymentId: b.razorpayPaymentId },
        });
      }

      await logRentalEvent(order.id, 'pending_approval', 'Booking submitted with Razorpay advance payment');
      res.json({
        success: true,
        message: 'Booking submitted. Store will review your booking.',
        data: { orderId: order.id, rentalStatus: order.rentalStatus, razorpayPaymentId: b.razorpayPaymentId, ...quote },
      });
    } catch (e) {
      console.error('[rental] createBooking failed:', e?.message || e);
      if (e?.status) {
        return res.status(e.status).json({ success: false, message: e.message || 'Booking failed' });
      }
      return res.status(500).json({
        success: false,
        message: e?.message || 'Could not save rental booking',
      });
    }
  },

  async listStoreBookings(req, res, next) {
    try {
      const storeId = Number(req.params.storeId);
      const where = { storeId, deliveryType: 'rental' };
      if (req.query.status) where.rentalStatus = String(req.query.status);
      const range = getPeriodDateRange(String(req.query.period || ''));
      if (range) where.createdAt = { [Op.gte]: range.from, [Op.lte]: range.to };

      const rows = await db.orders.findAll({ where, order: [['id', 'DESC']] });
      const ids = rows.map((r) => r.id);
      let proofs = [];
      if (ids.length) {
        const [p] = await db.sequelize.query(
          `SELECT * FROM rental_booking_proofs WHERE orderId IN (:ids)`,
          { replacements: { ids } }
        );
        proofs = p || [];
      }
      const proofByOrder = new Map(proofs.map((p) => [Number(p.orderId), p]));
      const data = rows.map((r) => bookingJson(r, proofByOrder.get(Number(r.id))));
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async listCustomerBookings(req, res, next) {
    try {
      const custId = getCustomerUserId(req) || Number(req.query.custId);
      if (!custId) {
        return res.status(400).json({ success: false, message: 'Customer id required' });
      }
      const rows = await db.orders.findAll({
        where: { custId, deliveryType: 'rental' },
        order: [['id', 'DESC']],
      });
      res.json({ success: true, data: rows });
    } catch (e) {
      next(e);
    }
  },

  async getBooking(req, res, next) {
    try {
      const order = await db.orders.findByPk(req.params.id);
      if (!order || order.deliveryType !== 'rental') {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      if (!canAccessRentalBooking(req, order)) {
        return res.status(403).json({ success: false, message: 'Not allowed to view this booking' });
      }
      const [proofRows] = await db.sequelize.query(
        `SELECT * FROM rental_booking_proofs WHERE orderId = :orderId LIMIT 1`,
        { replacements: { orderId: order.id } }
      );
      const [events] = await db.sequelize.query(
        `SELECT * FROM rental_booking_events WHERE orderId = :orderId ORDER BY createdAt DESC`,
        { replacements: { orderId: order.id } }
      );
      let itemName = null;
      let itemPhoto = null;
      if (order.rentalSource === 'catalog' && order.rentalCatalogItemId) {
        const [c] = await db.sequelize.query(
          `SELECT name, photoUrl FROM rental_catalog_items WHERE id = :id`,
          { replacements: { id: order.rentalCatalogItemId } }
        );
        itemName = c?.[0]?.name;
        itemPhoto = c?.[0]?.photoUrl;
      } else if (order.productIds) {
        const p = await db.product.findByPk(order.productIds, { raw: true }).catch(() => null);
        itemName = p?.name;
        itemPhoto = p?.photo;
        if (!itemPhoto && p?.id) {
          const [photos] = await db.sequelize.query(
            `SELECT imgUrl FROM productphotos WHERE productId = :id ORDER BY id ASC LIMIT 1`,
            { replacements: { id: p.id } }
          );
          itemPhoto = photos?.[0]?.imgUrl || null;
        }
      }
      res.json({
        success: true,
        data: {
          order: order.get({ plain: true }),
          proof: proofRows?.[0] || null,
          events: events || [],
          returnDetails: await getRentalReturnDetails(order.id),
          itemName,
          itemPhoto,
        },
      });
    } catch (e) {
      next(e);
    }
  },

  async approveBooking(req, res, next) {
    try {
      const order = await db.orders.findByPk(req.params.id);
      if (!order || order.deliveryType !== 'rental') {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      if (!['pending_approval', 'pending_proofs', 'pending_payment'].includes(String(order.rentalStatus))) {
        return res.status(400).json({ success: false, message: 'Cannot approve this booking' });
      }
      await order.update({ rentalStatus: 'confirmed' });
      await db.sequelize.query(
        `UPDATE rental_booking_proofs SET reviewedAt = NOW(), updatedAt = NOW() WHERE orderId = :orderId`,
        { replacements: { orderId: order.id } }
      );
      await logRentalEvent(order.id, 'confirmed', 'Approved by store');
      res.json({ success: true, message: 'Booking confirmed', data: order });
    } catch (e) {
      next(e);
    }
  },

  async rejectBooking(req, res, next) {
    try {
      const order = await db.orders.findByPk(req.params.id);
      if (!order || order.deliveryType !== 'rental') {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      const reason = String(req.body?.reason || 'Rejected by store');
      await order.update({ rentalStatus: 'rejected', status: 'cancel' });
      await db.sequelize.query(
        `UPDATE rental_booking_proofs SET rejectReason = :reason, reviewedAt = NOW(), updatedAt = NOW() WHERE orderId = :orderId`,
        { replacements: { orderId: order.id, reason } }
      );
      await logRentalEvent(order.id, 'rejected', reason);
      res.json({ success: true, message: 'Booking rejected' });
    } catch (e) {
      next(e);
    }
  },

  async cancelBooking(req, res, next) {
    try {
      const order = await db.orders.findByPk(req.params.id);
      if (!order || order.deliveryType !== 'rental') {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      const custId = getCustomerUserId(req) || Number(req.body?.custId);
      if (!custId || Number(order.custId) !== custId) {
        return res.status(403).json({ success: false, message: 'Not your booking' });
      }
      if (!['pending_approval', 'confirmed'].includes(String(order.rentalStatus))) {
        return res.status(400).json({ success: false, message: 'Cannot cancel at this stage' });
      }
      await order.update({ rentalStatus: 'cancelled', status: 'cancel' });
      await logRentalEvent(order.id, 'cancelled', req.body?.reason || 'Cancelled by customer');
      res.json({ success: true, message: 'Booking cancelled' });
    } catch (e) {
      next(e);
    }
  },

  async markActive(req, res, next) {
    try {
      const order = await db.orders.findByPk(req.params.id);
      if (!order || order.deliveryType !== 'rental') {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      if (String(order.rentalStatus) !== 'confirmed') {
        return res.status(400).json({ success: false, message: 'Booking must be confirmed before handover' });
      }
      const handoverProofUrl = String(req.body?.handoverProofUrl || '').trim();
      const handoverLatitude = Number(req.body?.handoverLatitude);
      const handoverLongitude = Number(req.body?.handoverLongitude);
      if (!handoverProofUrl) {
        return res.status(400).json({ success: false, message: 'Handover photo proof is required' });
      }
      if (!Number.isFinite(handoverLatitude) || !Number.isFinite(handoverLongitude)) {
        return res.status(400).json({ success: false, message: 'Current location is required for handover' });
      }

      const patch = { rentalStatus: 'handover_pending' };
      if (req.body?.recordBalancePaid && !order.rentalBalancePaidAt) {
        patch.rentalBalancePaidAt = new Date();
      }
      await ensureRentalHandoverProofColumns();
      await order.update(patch);
      await db.sequelize.query(
        `INSERT INTO rental_booking_proofs (orderId, createdAt, updatedAt)
         SELECT :orderId, NOW(), NOW()
         WHERE NOT EXISTS (
           SELECT 1 FROM rental_booking_proofs WHERE orderId = :orderId
         )`,
        { replacements: { orderId: order.id } }
      );
      await db.sequelize.query(
        `UPDATE rental_booking_proofs
         SET handoverProofUrl = :handoverProofUrl,
             handoverLatitude = :handoverLatitude,
             handoverLongitude = :handoverLongitude,
             handoverLocationUrl = :handoverLocationUrl,
             handoverAt = NOW(),
             updatedAt = NOW()
         WHERE orderId = :orderId`,
        {
          replacements: {
            orderId: order.id,
            handoverProofUrl,
            handoverLatitude,
            handoverLongitude,
            handoverLocationUrl:
              String(req.body?.handoverLocationUrl || '').trim() ||
              buildMapsUrl(handoverLatitude, handoverLongitude),
          },
        }
      );
      await logRentalEvent(
        order.id,
        'handover_pending',
        'Item handed over — waiting for customer to confirm receipt'
      );
      if (patch.rentalBalancePaidAt) {
        await logRentalEvent(order.id, 'balance_paid', 'Balance collected at pickup');
      }
      const updated = await db.orders.findByPk(order.id);
      res.json({
        success: true,
        message: 'Handover recorded. Customer must confirm receipt before rental becomes active.',
        data: updated,
      });
    } catch (e) {
      next(e);
    }
  },

  async confirmHandover(req, res, next) {
    try {
      const order = await db.orders.findByPk(req.params.id);
      if (!order || order.deliveryType !== 'rental') {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      if (String(order.rentalStatus) !== 'handover_pending') {
        return res.status(400).json({
          success: false,
          message: 'No handover waiting for customer confirmation',
        });
      }
      const custId = getCustomerUserId(req) || Number(req.body?.custId);
      if (!custId || Number(order.custId) !== custId) {
        return res.status(403).json({
          success: false,
          message: 'Only the customer who booked this rental can confirm receipt.',
        });
      }
      await ensureRentalHandoverProofColumns();
      await order.update({ rentalStatus: 'active' });
      await db.sequelize.query(
        `UPDATE rental_booking_proofs
         SET customerConfirmedAt = NOW(), updatedAt = NOW()
         WHERE orderId = :orderId`,
        { replacements: { orderId: order.id } }
      );
      await logRentalEvent(order.id, 'active', 'Customer confirmed item received — rental is now active');
      const updated = await db.orders.findByPk(order.id);
      res.json({
        success: true,
        message: 'Thank you! Your rental is now active.',
        data: updated,
      });
    } catch (e) {
      next(e);
    }
  },

  async requestReturn(req, res, next) {
    try {
      const order = await db.orders.findByPk(req.params.id);
      if (!order || order.deliveryType !== 'rental') {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      if (String(order.rentalStatus) !== 'active') {
        return res.status(400).json({ success: false, message: 'Return can only be requested for active rentals' });
      }
      const custId = getCustomerUserId(req) || Number(req.body?.custId);
      if (!custId || Number(order.custId) !== custId) {
        return res.status(403).json({
          success: false,
          message: 'Only the customer who booked this rental can request a return.',
        });
      }
      const note = String(req.body?.note || '').trim();
      const now = new Date();
      const endAt = order.rentalEndAt ? new Date(order.rentalEndAt) : null;
      const earlyReturn = endAt && !Number.isNaN(endAt.getTime()) && now < endAt;
      await order.update({ rentalStatus: 'return_requested' });
      await upsertRentalReturnDetails(order.id, {
        customerReturnNote: note || 'Customer requested return pickup',
        requestedReturnAt: now,
        earlyReturn: earlyReturn ? 1 : 0,
      });
      const eventNote = earlyReturn
        ? `Early return requested (before booked end date)${note ? ` — ${note}` : ''}`
        : note || 'Customer requested return pickup';
      await logRentalEvent(order.id, 'return_requested', eventNote);
      res.json({ success: true, message: 'Return requested', data: order });
    } catch (e) {
      next(e);
    }
  },

  async markReturnPickup(req, res, next) {
    try {
      const order = await db.orders.findByPk(req.params.id);
      if (!order || order.deliveryType !== 'rental') {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      if (String(order.rentalStatus) !== 'return_requested') {
        return res.status(400).json({ success: false, message: 'Booking is not awaiting return pickup' });
      }
      await order.update({ rentalStatus: 'return_pickup' });
      await upsertRentalReturnDetails(order.id, { returnPickupAt: new Date() });
      const note = String(req.body?.note || '').trim() || 'Item picked up for return';
      await logRentalEvent(order.id, 'return_pickup', note);
      res.json({ success: true, message: 'Return pickup recorded', data: order });
    } catch (e) {
      next(e);
    }
  },

  async markReturned(req, res, next) {
    try {
      const order = await db.orders.findByPk(req.params.id);
      if (!order || order.deliveryType !== 'rental') {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      if (String(order.rentalStatus) !== 'return_pickup') {
        return res.status(400).json({
          success: false,
          message: 'Record return pickup before marking item received at store',
        });
      }
      const b = req.body || {};
      const damageReported = !!b.damageReported;
      const damageAmount = damageReported ? Math.max(0, Number(b.damageAmount) || 0) : 0;
      const damageNote = damageReported ? String(b.damageNote || '').trim() : null;
      const returnCondition = damageReported ? 'damaged' : String(b.returnCondition || 'good');
      const orderPatch = { rentalStatus: 'returned' };
      if (damageReported) orderPatch.rentalDamageAmount = damageAmount;
      await order.update(orderPatch);
      await upsertRentalReturnDetails(order.id, {
        damageReported: damageReported ? 1 : 0,
        damageAmount,
        damageNote,
        damageProofUrl: b.damageProofUrl || null,
        returnCondition,
        returnedAt: new Date(),
      });
      const eventNote = damageReported
        ? `Item returned with damage. Extra charge: ₹${damageAmount}${damageNote ? ` — ${damageNote}` : ''}`
        : 'Item returned in good condition';
      await logRentalEvent(order.id, 'returned', eventNote);
      res.json({ success: true, message: 'Return received at store', data: order });
    } catch (e) {
      next(e);
    }
  },

  async recordBalancePayment(req, res, next) {
    try {
      const order = await db.orders.findByPk(req.params.id);
      if (!order || order.deliveryType !== 'rental') {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      if (order.rentalBalancePaidAt) {
        return res.json({ success: true, message: 'Balance already recorded', data: order });
      }
      const allowed = ['confirmed', 'active', 'return_requested', 'return_pickup', 'returned'];
      if (!allowed.includes(String(order.rentalStatus))) {
        return res.status(400).json({ success: false, message: 'Cannot record balance at this stage' });
      }
      const method = String(req.body?.paymentMethod || 'cash').trim();
      const reference = String(req.body?.paymentReference || '').trim();
      await order.update({ rentalBalancePaidAt: new Date() });
      const note = reference
        ? `Balance collected (${method}) — ref: ${reference}`
        : `Balance collected (${method})`;
      await logRentalEvent(order.id, 'balance_paid', note);
      res.json({ success: true, message: 'Balance payment recorded', data: order });
    } catch (e) {
      next(e);
    }
  },

  async recordDamagePayment(req, res, next) {
    try {
      const order = await db.orders.findByPk(req.params.id);
      if (!order || order.deliveryType !== 'rental') {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      if (String(order.rentalStatus) !== 'returned') {
        return res.status(400).json({ success: false, message: 'Damage payment applies after item is returned' });
      }
      const details = await getRentalReturnDetails(order.id);
      const damageAmount = Number(order.rentalDamageAmount ?? details?.damageAmount ?? 0);
      if (!details?.damageReported && damageAmount <= 0) {
        return res.status(400).json({ success: false, message: 'No damage charge on this booking' });
      }
      if (details?.damagePaidAt) {
        return res.json({ success: true, message: 'Damage payment already recorded', data: order });
      }
      const method = String(req.body?.paymentMethod || 'cash').trim();
      const reference = String(req.body?.paymentReference || '').trim();
      await upsertRentalReturnDetails(order.id, { damagePaidAt: new Date() });
      const note = reference
        ? `Damage charge ₹${damageAmount} collected (${method}) — ref: ${reference}`
        : `Damage charge ₹${damageAmount} collected (${method})`;
      await logRentalEvent(order.id, 'damage_paid', note);
      res.json({ success: true, message: 'Damage payment recorded', data: order });
    } catch (e) {
      next(e);
    }
  },

  async markCompleted(req, res, next) {
    try {
      const order = await db.orders.findByPk(req.params.id);
      if (!order || order.deliveryType !== 'rental') {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      if (String(order.rentalStatus) !== 'returned') {
        return res.status(400).json({
          success: false,
          message: 'Item must be returned and inspected before completing the rental',
        });
      }
      const details = await getRentalReturnDetails(order.id);
      const damageAmount = Number(order.rentalDamageAmount ?? details?.damageAmount ?? 0);
      if (details?.damageReported && damageAmount > 0 && !details?.damagePaidAt) {
        return res.status(400).json({
          success: false,
          message: 'Record damage payment before closing this rental',
        });
      }
      const returnable = req.body?.returnableConfirmed !== false;
      const note = String(req.body?.note || '').trim()
        || (returnable
          ? 'Return confirmed — item checked and rental closed'
          : 'Rental closed after return inspection');
      await upsertRentalReturnDetails(order.id, {
        returnConfirmedAt: new Date(),
        returnCondition: returnable ? (details?.returnCondition || 'good') : 'not_returnable',
      });
      await order.update({ rentalStatus: 'completed', status: 'delieverd' });
      await logRentalEvent(order.id, 'completed', note);
      res.json({ success: true, data: order });
    } catch (e) {
      next(e);
    }
  },

  async overview(req, res, next) {
    try {
      const storeId = Number(req.params.storeId);
      const period = String(req.query.period || 'day');
      const base = { storeId, deliveryType: 'rental' };
      const range = getPeriodDateRange(period === 'all' ? '' : period);
      const periodWhere = range
        ? { createdAt: { [Op.gte]: range.from, [Op.lte]: range.to } }
        : {};
      const activeStatuses = [
        'confirmed',
        'handover_pending',
        'active',
        'return_requested',
        'return_pickup',
        'returned',
      ];

      const [
        periodBookings,
        pendingApproval,
        activeRentals,
        periodAdvance,
        periodTotal,
        recentRows,
        statusRows,
      ] = await Promise.all([
        db.orders.count({ where: { ...base, ...periodWhere } }),
        db.orders.count({ where: { ...base, rentalStatus: 'pending_approval' } }),
        db.orders.count({
          where: { ...base, rentalStatus: { [Op.in]: activeStatuses } },
        }),
        db.orders.sum('rentalAdvanceAmount', { where: { ...base, ...periodWhere } }),
        db.orders.sum('rentalTotalAmount', { where: { ...base, ...periodWhere } }),
        db.orders.findAll({
          where: { ...base, ...periodWhere },
          order: [['id', 'DESC']],
          limit: 8,
        }),
        db.orders.findAll({
          attributes: [
            'rentalStatus',
            [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
          ],
          where: { ...base, ...periodWhere },
          group: ['rentalStatus'],
          raw: true,
        }),
      ]);

      let periodBalance = 0;
      if (range) {
        periodBalance =
          (await db.orders.sum('rentalBalanceAmount', {
            where: {
              ...base,
              rentalBalancePaidAt: { [Op.gte]: range.from, [Op.lte]: range.to },
            },
          })) || 0;
      } else {
        periodBalance =
          (await db.orders.sum('rentalBalanceAmount', {
            where: { ...base, rentalBalancePaidAt: { [Op.ne]: null } },
          })) || 0;
      }

      const recentIds = recentRows.map((r) => r.id);
      let proofs = [];
      if (recentIds.length) {
        const [p] = await db.sequelize.query(
          `SELECT orderId, bookerName, bookerPhone FROM rental_booking_proofs WHERE orderId IN (:ids)`,
          { replacements: { ids: recentIds } }
        );
        proofs = p || [];
      }
      const proofByOrder = new Map(proofs.map((p) => [Number(p.orderId), p]));

      const bookingsByStatus = (statusRows || []).reduce((acc, row) => {
        const key = String(row.rentalStatus || 'unknown');
        acc[key] = Number(row.count) || 0;
        return acc;
      }, {});

      const recentBookings = recentRows.map((r) => {
        const j = r.get({ plain: true });
        const proof = proofByOrder.get(Number(j.id));
        return {
          id: j.id,
          rentalStatus: j.rentalStatus,
          rentalStartAt: j.rentalStartAt,
          rentalEndAt: j.rentalEndAt,
          rentalTotalAmount: j.rentalTotalAmount,
          rentalAdvanceAmount: j.rentalAdvanceAmount,
          createdAt: j.createdAt,
          bookerName: proof?.bookerName || null,
          bookerPhone: proof?.bookerPhone || null,
        };
      });

      res.json({
        success: true,
        data: {
          period,
          periodBookings,
          pendingApproval,
          activeRentals,
          periodAdvanceCollected: periodAdvance || 0,
          periodTotalValue: periodTotal || 0,
          periodBalanceCollected: periodBalance || 0,
          bookingsByStatus,
          recentBookings,
          // Legacy fields for backward compatibility
          todayBookings: period === 'day' ? periodBookings : undefined,
          todayAdvanceCollected: period === 'day' ? periodAdvance || 0 : undefined,
        },
      });
    } catch (e) {
      next(e);
    }
  },

  async listPayments(req, res, next) {
    try {
      const storeId = Number(req.params.storeId);
      const where = { storeId, deliveryType: 'rental' };
      const range = getPeriodDateRange(String(req.query.period || ''));
      if (range) where.createdAt = { [Op.gte]: range.from, [Op.lte]: range.to };
      const rows = await db.orders.findAll({ where, order: [['id', 'DESC']] });
      const data = rows.map((r) => {
        const j = r.get({ plain: true });
        return {
          orderId: j.id,
          createdAt: j.createdAt,
          rentalStatus: j.rentalStatus,
          totalAmount: j.rentalTotalAmount,
          advanceAmount: j.rentalAdvanceAmount,
          balanceAmount: j.rentalBalanceAmount,
          balancePaidAt: j.rentalBalancePaidAt,
          damageAmount: j.rentalDamageAmount,
        };
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  async reports(req, res, next) {
    try {
      const storeId = Number(req.params.storeId);
      const period = String(req.query.period || 'month');
      const from = req.query.from || null;
      const report = await buildStoreReport(storeId, period, from);
      res.json({ success: true, data: report });
    } catch (e) {
      next(e);
    }
  },

  async adminReports(req, res, next) {
    try {
      const period = String(req.query.period || 'month');
      const from = req.query.from || null;
      const report = await buildAdminReport(period, from);
      res.json({ success: true, data: report });
    } catch (e) {
      next(e);
    }
  },

  async exportReports(req, res, next) {
    try {
      const storeId = Number(req.params.storeId);
      const period = String(req.query.period || 'month');
      const format = String(req.query.format || 'csv');
      const report = await buildStoreReport(storeId, period, req.query.from || null);
      if (format !== 'csv') {
        return res.status(400).json({ success: false, message: 'Only CSV export supported' });
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="rental-store-${storeId}-${period}.csv"`);
      res.send(bookingsToCsv(report.bookings || []));
    } catch (e) {
      next(e);
    }
  },

  async exportAdminReports(req, res, next) {
    try {
      const period = String(req.query.period || 'month');
      const format = String(req.query.format || 'csv');
      const report = await buildAdminReport(period, req.query.from || null);
      if (format !== 'csv') {
        return res.status(400).json({ success: false, message: 'Only CSV export supported' });
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="rental-all-stores-${period}.csv"`);
      res.send(bookingsToCsv(report.bookings || []));
    } catch (e) {
      next(e);
    }
  },
};
