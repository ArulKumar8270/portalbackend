const bcrypt = require('bcrypt-nodejs');
const JWT = require('jsonwebtoken');
const { Op } = require('sequelize');
const db = require('../../../models');
const config = require('../../../config');
const {
  quoteDelivery,
  logOrderEvent,
  getActiveDeliveryOtp,
  attachActiveOtpsToOrders,
  estimateEtaMinutes,
  parseJson,
  getStoreOrThrow,
  getPeriodDateRange,
} = require('./one-day.service');
const { buildStoreReport, buildAdminReport, ordersToCsv } = require('./one-day.reports.service');
const { notifyOrderAssigned, notifyOutForDelivery, notifyDeliveryOtp } = require('./one-day.notify');

function employeeToken(employee) {
  return JWT.sign(
    {
      iss: config.app.name,
      sub: Number(employee.id),
      storeId: Number(employee.storeId),
      iam: 'employee',
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    },
    config.app.secret
  );
}

/** Digits-only phone for matching (handles +91 / leading 0). */
function normalizePhoneDigits(phone) {
  let p = String(phone || '').replace(/\D/g, '');
  if (p.startsWith('91') && p.length === 12) p = p.slice(2);
  if (p.startsWith('0') && p.length === 11) p = p.slice(1);
  return p;
}

function phoneMatchVariants(phone) {
  const raw = String(phone || '').trim();
  const digits = normalizePhoneDigits(raw);
  const variants = new Set();
  if (raw) variants.add(raw);
  if (digits) {
    variants.add(digits);
    variants.add(`+91${digits}`);
    variants.add(`91${digits}`);
    variants.add(`0${digits}`);
  }
  return [...variants];
}

function getEmployeeFromReq(req) {
  const raw = req.employee || (String(req.user?.iam) === 'employee' ? req.user : null);
  if (!raw) return null;
  const id = Number(raw.id ?? raw.sub);
  const storeId = Number(raw.storeId);
  if (!Number.isFinite(id) || id <= 0) return null;
  return {
    id,
    storeId: Number.isFinite(storeId) && storeId > 0 ? storeId : null,
  };
}

function getCustomerUserId(req) {
  const u = req.user || {};
  const id = Number(u.sub ?? u.id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function assertCustomerOwnsOrder(order, req) {
  const userId = getCustomerUserId(req);
  if (!userId) {
    return { ok: false, status: 401, message: 'Login required' };
  }
  if (Number(order.custId) !== userId) {
    return { ok: false, status: 403, message: 'Not your order' };
  }
  return { ok: true, userId };
}

function sanitizeEmployee(row) {
  if (!row) return null;
  const o = row.get ? row.get({ plain: true }) : row;
  delete o.password;
  return o;
}

function parseDeliveryAddress(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(String(raw));
  } catch {
    return { shipping: String(raw) };
  }
}

function randomOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const REFUND_STATUSES = ['none', 'requested', 'processing', 'refunded', 'rejected'];

function formatPaymentMethod(method) {
  const m = String(method || '').trim();
  if (m === '3' || m === '1') return 'COD';
  if (m === '2') return 'Online';
  if (m === '4') return 'UPI / Wallet';
  return m || '—';
}

function isCodPayment(method) {
  const m = String(method || '').trim();
  return m === '3' || m === '1';
}

function derivePaymentStatus(order, paymentRow, proof) {
  if (paymentRow?.status) return String(paymentRow.status);
  if (isCodPayment(order.paymentmethod)) {
    if (order.oneDayStatus === 'delivered') {
      return proof?.paymentPhotoUrl ? 'collected' : 'delivered';
    }
    if (order.oneDayStatus === 'cancelled') return 'cancelled';
    return 'pending';
  }
  if (order.oneDayStatus === 'cancelled') return 'cancelled';
  return 'pending';
}

module.exports = {
  /** GET /one-day/settings/:storeId */
  async getSettings(req, res, next) {
    try {
      const store = await getStoreOrThrow(req.params.storeId);
      res.json({
        success: true,
        data: {
          oneDayDeliveryEnabled: !!store.oneDayDeliveryEnabled,
          maxDeliveryRadiusKm: store.maxDeliveryRadiusKm,
          workingHours: parseJson(store.workingHours, null),
          holidayDates: parseJson(store.holidayDates, []),
          cutoffTime: store.cutoffTime || '14:00',
          deliveryChargeSlabs: parseJson(store.deliveryChargeSlabs, [
            { fromKm: 0, toKm: 3, charge: 30 },
            { fromKm: 3, toKm: 5, charge: 50 },
            { fromKm: 5, toKm: 10, charge: 80 },
          ]),
          storeLatitude: store.storeLatitude,
          storeLongitude: store.storeLongitude,
          sameDayPromiseText: store.sameDayPromiseText,
          nextDayPromiseText: store.nextDayPromiseText,
          requireDeliveryOtp: store.requireDeliveryOtp !== false,
          requireDeliveryPhoto: store.requireDeliveryPhoto === true || store.requireDeliveryPhoto === 1,
          requireDeliverySignature: !!store.requireDeliverySignature,
          oneDayPaymentQrUrl: store.oneDayPaymentQrUrl || null,
          oneDayUpiId: store.oneDayUpiId || null,
          oneDayReturnPolicyUrl: store.oneDayReturnPolicyUrl || null,
          oneDayReturnPolicyText: store.oneDayReturnPolicyText || null,
          oneDayPaymentReturnNote: store.oneDayPaymentReturnNote || null,
          accountHolderName: store.accountHolderName || null,
          bankName: store.bankName || null,
          accountNo: store.accountNo || null,
          IFSC: store.IFSC || null,
          branch: store.branch || null,
        },
      });
    } catch (e) {
      next(e);
    }
  },

  /** PUT /one-day/settings/:storeId */
  async updateSettings(req, res, next) {
    try {
      const storeId = req.params.storeId;
      const store = await db.store.findByPk(storeId);
      if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

      const b = req.body || {};
      const fields = [
        'oneDayDeliveryEnabled', 'maxDeliveryRadiusKm', 'workingHours', 'holidayDates',
        'cutoffTime', 'deliveryChargeSlabs', 'storeLatitude', 'storeLongitude',
        'sameDayPromiseText', 'nextDayPromiseText', 'requireDeliveryOtp',
        'requireDeliveryPhoto', 'requireDeliverySignature',
        'oneDayPaymentQrUrl', 'oneDayUpiId', 'oneDayReturnPolicyUrl',
        'oneDayReturnPolicyText', 'oneDayPaymentReturnNote',
        'accountHolderName', 'bankName', 'accountNo', 'IFSC', 'branch',
      ];
      const patch = {};
      for (const f of fields) {
        if (b[f] !== undefined) patch[f] = b[f];
      }
      await store.update(patch);
      res.json({ success: true, message: 'Settings updated' });
    } catch (e) {
      next(e);
    }
  },

  /** GET /one-day/products/:storeId */
  async listProducts(req, res, next) {
    try {
      const storeId = Number(req.params.storeId);
      const publicOnly = String(req.path).includes('/public/');
      const where = {
        createdId: storeId,
        isOneDayEnabled: true,
        status: { [Op.in]: ['1', 'active', 1] },
      };
      const rows = await db.product.findAll({ where, order: [['id', 'DESC']] });
      const data = rows.map((p) => {
        const plain = p.get({ plain: true });
        if (publicOnly) {
          plain.displayPrice = plain.oneDayPrice != null ? plain.oneDayPrice : plain.price;
        }
        return plain;
      });
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** POST /one-day/orders/quote */
  async quote(req, res, next) {
    try {
      const { storeId, customerLat, customerLng, address } = req.body || {};
      const result = await quoteDelivery({ storeId, customerLat, customerLng, address });
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  },

  /** POST /one-day/employees */
  async createEmployee(req, res, next) {
    try {
      const b = req.body || {};
      if (!b.storeId || !b.name || !b.phone || !b.password) {
        return res.status(400).json({ success: false, message: 'storeId, name, phone, password required' });
      }
      const hash = bcrypt.hashSync(String(b.password));
      const phoneDigits = normalizePhoneDigits(b.phone);
      const row = await db.store_employees.create({
        storeId: b.storeId,
        name: b.name,
        phone: phoneDigits || String(b.phone).trim(),
        email: b.email || null,
        password: hash,
        role: b.role || 'rider',
        status: b.status === 'inactive' ? 'inactive' : 'active',
        isOnDuty: !!b.isOnDuty,
        maxActiveOrders: b.maxActiveOrders || 3,
        vehicleType: b.vehicleType || null,
        payType: b.payType || 'per_order',
        payRate: b.payRate != null && b.payRate !== '' ? Number(b.payRate) : null,
        petrolPrice:
          b.payType === 'per_km' && b.petrolPrice != null && b.petrolPrice !== ''
            ? Number(b.petrolPrice)
            : null,
      });
      res.status(201).json({ success: true, data: sanitizeEmployee(row) });
    } catch (e) {
      next(e);
    }
  },

  /** PUT /one-day/employees/:id */
  async updateEmployee(req, res, next) {
    try {
      const row = await db.store_employees.findByPk(req.params.id);
      if (!row) return res.status(404).json({ success: false, message: 'Employee not found' });
      const b = req.body || {};
      const patch = {};
      ['name', 'phone', 'email', 'role', 'status', 'isOnDuty', 'maxActiveOrders', 'vehicleType', 'payType', 'payRate', 'petrolPrice'].forEach((f) => {
        if (b[f] !== undefined) patch[f] = b[f];
      });
      if (patch.phone != null) {
        const digits = normalizePhoneDigits(patch.phone);
        patch.phone = digits || String(patch.phone).trim();
      }
      if (b.payRate !== undefined) {
        patch.payRate = b.payRate != null && b.payRate !== '' ? Number(b.payRate) : null;
      }
      if (b.petrolPrice !== undefined || b.payType === 'per_km') {
        patch.petrolPrice =
          (b.payType || row.payType) === 'per_km' &&
          b.petrolPrice != null &&
          b.petrolPrice !== ''
            ? Number(b.petrolPrice)
            : b.payType && b.payType !== 'per_km'
              ? null
              : patch.petrolPrice;
      }
      if (b.password) patch.password = bcrypt.hashSync(String(b.password));
      await row.update(patch);
      res.json({ success: true, data: sanitizeEmployee(row) });
    } catch (e) {
      next(e);
    }
  },

  /** GET /one-day/employees/:storeId */
  async listEmployees(req, res, next) {
    try {
      const storeId = Number(req.params.storeId);
      const includeTrashed = String(req.query.trashed) === '1';
      const where = { storeId };
      if (!includeTrashed) where.status = { [Op.ne]: 'trashed' };
      const rows = await db.store_employees.findAll({ where, order: [['id', 'DESC']] });
      res.json({ success: true, data: rows.map(sanitizeEmployee) });
    } catch (e) {
      next(e);
    }
  },

  /** DELETE /one-day/employees/:id */
  async trashEmployee(req, res, next) {
    try {
      const row = await db.store_employees.findByPk(req.params.id);
      if (!row) return res.status(404).json({ success: false, message: 'Not found' });
      await row.update({ status: 'trashed', isOnDuty: false });
      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  },

  /** PATCH /one-day/employees/:id/duty */
  async toggleDuty(req, res, next) {
    try {
      const row = await db.store_employees.findByPk(req.params.id);
      if (!row) return res.status(404).json({ success: false, message: 'Not found' });
      const isOnDuty = req.body?.isOnDuty !== undefined ? !!req.body.isOnDuty : !row.isOnDuty;
      await row.update({ isOnDuty });
      res.json({ success: true, data: sanitizeEmployee(row) });
    } catch (e) {
      next(e);
    }
  },

  /** POST /one-day/employee/login */
  async employeeLogin(req, res, next) {
    try {
      const { phone, password, storeId } = req.body || {};
      if (!phone || password == null || String(password) === '') {
        return res.status(400).json({ success: false, message: 'Phone and password required' });
      }

      const phoneVariants = phoneMatchVariants(phone);
      const where = {
        status: 'active',
        phone: { [Op.in]: phoneVariants },
      };
      const sid = Number(storeId);
      if (Number.isFinite(sid) && sid > 0) where.storeId = sid;

      const candidates = await db.store_employees.findAll({ where, order: [['id', 'DESC']] });
      const matched = candidates.filter((row) => {
        try {
          return bcrypt.compareSync(String(password), row.password);
        } catch {
          return false;
        }
      });

      if (!matched.length) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      // Prefer the employee who currently has active assigned orders (avoids wrong
      // store when the same phone exists on multiple active employee rows).
      let row = matched[0];
      if (matched.length > 1) {
        for (const candidate of matched) {
          const activeCount = await db.orders.count({
            where: {
              deliveryType: 'one_day',
              assignedEmployeeId: Number(candidate.id),
              oneDayStatus: { [Op.notIn]: ['delivered', 'cancelled', 'failed'] },
            },
          });
          if (activeCount > 0) {
            row = candidate;
            break;
          }
        }
      }

      const token = employeeToken(row);
      res.json({ success: true, token, data: sanitizeEmployee(row) });
    } catch (e) {
      next(e);
    }
  },

  /** GET /one-day/employee/orders */
  async employeeOrders(req, res, next) {
    try {
      const emp = getEmployeeFromReq(req);
      if (!emp) return res.status(401).json({ success: false, message: 'Employee auth required' });

      const employeeId = Number(emp.id);
      const rows = await db.orders.findAll({
        where: {
          deliveryType: 'one_day',
          assignedEmployeeId: employeeId,
          oneDayStatus: { [Op.notIn]: ['delivered', 'cancelled', 'failed'] },
        },
        order: [['id', 'DESC']],
      });
      res.json({ success: true, data: rows });
    } catch (e) {
      next(e);
    }
  },

  /**
   * GET /one-day/employee/orders/history
   * Delivered / cancelled / failed report for the logged-in employee.
   * Query: status=delivered|cancelled|failed|all  period=day|week|month|all
   */
  async employeeOrderHistory(req, res, next) {
    try {
      const emp = getEmployeeFromReq(req);
      if (!emp) return res.status(401).json({ success: false, message: 'Employee auth required' });

      const employeeId = Number(emp.id);
      const statusRaw = String(req.query.status || 'delivered').toLowerCase();
      const allowed = ['delivered', 'cancelled', 'failed', 'all'];
      const status = allowed.includes(statusRaw) ? statusRaw : 'delivered';
      const period = String(req.query.period || 'month').toLowerCase();

      const where = {
        deliveryType: 'one_day',
        assignedEmployeeId: employeeId,
      };
      if (status === 'all') {
        where.oneDayStatus = { [Op.in]: ['delivered', 'cancelled', 'failed'] };
      } else {
        where.oneDayStatus = status;
      }

      const range = getPeriodDateRange(period);
      if (range) {
        // Prefer delivery time for delivered; fall back to createdAt for others.
        if (status === 'delivered') {
          where.deliveredAt = { [Op.gte]: range.from, [Op.lte]: range.to };
        } else if (status === 'all') {
          where[Op.or] = [
            { deliveredAt: { [Op.gte]: range.from, [Op.lte]: range.to } },
            {
              deliveredAt: null,
              createdAt: { [Op.gte]: range.from, [Op.lte]: range.to },
            },
          ];
        } else {
          where.createdAt = { [Op.gte]: range.from, [Op.lte]: range.to };
        }
      }

      const rows = await db.orders.findAll({
        where,
        order: [
          ['deliveredAt', 'DESC'],
          ['id', 'DESC'],
        ],
        limit: 300,
      });

      let deliveredCount = 0;
      let cancelledCount = 0;
      let failedCount = 0;
      let totalCollected = 0;

      const data = rows.map((row) => {
        const json = row.get({ plain: true });
        const st = String(json.oneDayStatus || '');
        if (st === 'delivered') {
          deliveredCount += 1;
          totalCollected += Number(json.grandtotal || 0);
        } else if (st === 'cancelled') {
          cancelledCount += 1;
        } else if (st === 'failed') {
          failedCount += 1;
        }
        return {
          ...json,
          parsedAddress: parseDeliveryAddress(json.deliveryAddress),
        };
      });

      res.json({
        success: true,
        data,
        summary: {
          total: data.length,
          delivered: deliveredCount,
          cancelled: cancelledCount,
          failed: failedCount,
          totalCollected,
        },
        filters: { status, period },
      });
    } catch (e) {
      next(e);
    }
  },

  /** GET /one-day/employee/orders/:id */
  async employeeOrderDetail(req, res, next) {
    try {
      const emp = getEmployeeFromReq(req);
      if (!emp) return res.status(401).json({ success: false, message: 'Employee auth required' });
      const order = await db.orders.findOne({
        where: {
          id: Number(req.params.id),
          assignedEmployeeId: Number(emp.id),
          deliveryType: 'one_day',
        },
      });
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      const addr = parseDeliveryAddress(order.deliveryAddress);
      const proof = await db.one_day_delivery_proofs.findOne({ where: { orderId: order.id } });
      const activeOtp = await getActiveDeliveryOtp(order.id);
      const product = order.productIds
        ? await db.product.findByPk(order.productIds, { raw: true }).catch(() => null)
        : null;
      res.json({
        success: true,
        data: {
          ...order.get({ plain: true }),
          parsedAddress: addr,
          productName: product?.name || product?.productname || null,
          deliveryProof: proof
            ? {
                paymentPhotoUrl: proof.paymentPhotoUrl || null,
                photoUrl: proof.photoUrl || null,
              }
            : null,
          otpSent: !!activeOtp,
        },
      });
    } catch (e) {
      next(e);
    }
  },

  /** POST /one-day/employee/location */
  async employeeLocation(req, res, next) {
    try {
      const emp = getEmployeeFromReq(req);
      if (!emp) return res.status(401).json({ success: false, message: 'Employee auth required' });
      const { latitude, longitude, orderId } = req.body || {};
      const employee = await db.store_employees.findByPk(emp.id);
      if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
      await employee.update({
        lastLatitude: latitude,
        lastLongitude: longitude,
        lastLocationAt: new Date(),
      });
      await db.one_day_location_pings.create({
        employeeId: emp.id,
        orderId: orderId || null,
        latitude,
        longitude,
      });
      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  },

  /** GET /one-day/orders/:storeId */
  async listOrders(req, res, next) {
    try {
      const storeId = Number(req.params.storeId);
      const where = { storeId, deliveryType: 'one_day' };
      if (req.query.status) where.oneDayStatus = req.query.status;
      const range = getPeriodDateRange(String(req.query.period || ''));
      if (range) {
        where.createdAt = { [Op.gte]: range.from, [Op.lte]: range.to };
      }
      const rows = await db.orders.findAll({
        where,
        order: [['id', 'DESC']],
        include: [{ model: db.store_employees, as: 'assignedEmployee', required: false }],
      });
      const prodIds = [
        ...new Set(
          rows
            .map((r) => Number(r.productIds))
            .filter((n) => Number.isFinite(n) && n > 0)
        ),
      ];
      const products = prodIds.length
        ? await db.product.findAll({ where: { id: prodIds }, raw: true })
        : [];
      const byPid = new Map(products.map((p) => [Number(p.id), p]));
      const plain = rows.map((row) => {
        const json = row.get({ plain: true });
        const product = byPid.get(Number(json.productIds));
        const parsedAddress = parseDeliveryAddress(json.deliveryAddress);
        const deliveryCharge = Number(json.deliveryCharge || 0);
        const grandTotal = Number(json.grandtotal || 0);
        return {
          ...json,
          product,
          parsedAddress,
          itemTotal: grandTotal - deliveryCharge,
        };
      });
      const withOtps = await attachActiveOtpsToOrders(plain);
      res.json({ success: true, data: withOtps });
    } catch (e) {
      next(e);
    }
  },

  /** GET /one-day/overview/:storeId */
  async overview(req, res, next) {
    try {
      const storeId = Number(req.params.storeId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const base = { storeId, deliveryType: 'one_day' };
      const [todayCount, pendingAssign, activeRiders, revenue] = await Promise.all([
        db.orders.count({ where: { ...base, createdAt: { [Op.gte]: today } } }),
        db.orders.count({ where: { ...base, oneDayStatus: 'placed' } }),
        db.store_employees.count({ where: { storeId, isOnDuty: true, status: 'active' } }),
        db.orders.sum('grandtotal', { where: { ...base, createdAt: { [Op.gte]: today } } }),
      ]);
      res.json({
        success: true,
        data: {
          todayOrders: todayCount,
          pendingAssignment: pendingAssign,
          activeRiders: activeRiders,
          todayRevenue: revenue || 0,
        },
      });
    } catch (e) {
      next(e);
    }
  },

  /** PATCH /one-day/orders/:id/assign */
  async assignOrder(req, res, next) {
    try {
      const order = await db.orders.findByPk(req.params.id);
      if (!order || order.deliveryType !== 'one_day') {
        return res.status(404).json({ success: false, message: 'One-day order not found' });
      }
      const employeeId = Number(req.body?.employeeId);
      const employee = await db.store_employees.findOne({
        where: { id: employeeId, storeId: order.storeId, status: 'active', isOnDuty: true },
      });
      if (!employee) {
        return res.status(400).json({ success: false, message: 'Employee not available' });
      }
      await order.update({ assignedEmployeeId: employeeId, oneDayStatus: 'assigned' });
      await logOrderEvent(order.id, 'assigned', { employeeId, note: `Assigned to ${employee.name}` });
      notifyOrderAssigned(order, employee).catch(() => {});
      res.json({ success: true, data: order });
    } catch (e) {
      next(e);
    }
  },

  /** PATCH /one-day/orders/:id/status */
  async updateStatus(req, res, next) {
    try {
      const order = await db.orders.findByPk(req.params.id);
      if (!order || order.deliveryType !== 'one_day') {
        return res.status(404).json({ success: false, message: 'One-day order not found' });
      }
      const status = String(req.body?.status || '').toLowerCase();
      const allowed = ['placed', 'assigned', 'picked_up', 'out_for_delivery', 'failed', 'cancelled', 'rescheduled'];
      if (!allowed.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      const emp = getEmployeeFromReq(req);
      await order.update({ oneDayStatus: status });
      await logOrderEvent(order.id, status, {
        employeeId: emp?.id || order.assignedEmployeeId,
        latitude: req.body?.latitude,
        longitude: req.body?.longitude,
        note: req.body?.note,
      });
      if (status === 'out_for_delivery') {
        let employeeName = '';
        if (order.assignedEmployeeId) {
          const empRow = await db.store_employees.findByPk(order.assignedEmployeeId, { raw: true }).catch(() => null);
          employeeName = empRow?.name || '';
        }
        notifyOutForDelivery(order, employeeName).catch(() => {});
      }
      res.json({ success: true, data: order });
    } catch (e) {
      next(e);
    }
  },

  /** POST /one-day/orders/:id/send-otp */
  async sendOtp(req, res, next) {
    try {
      const order = await db.orders.findByPk(req.params.id);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      if (order.deliveryType !== 'one_day') {
        return res.status(400).json({ success: false, message: 'Not a one-day order' });
      }
      if (String(order.oneDayStatus || '') !== 'out_for_delivery') {
        return res.status(400).json({
          success: false,
          message: 'Order must be out for delivery before sending OTP',
        });
      }
      const emp = getEmployeeFromReq(req);
      if (emp && Number(order.assignedEmployeeId) !== Number(emp.id)) {
        return res.status(403).json({ success: false, message: 'Not assigned to this order' });
      }
      const proof = await db.one_day_delivery_proofs.findOne({ where: { orderId: order.id } });
      if (emp && !proof?.paymentPhotoUrl) {
        return res.status(400).json({
          success: false,
          message: 'Upload payment photo before sending OTP',
        });
      }
      const addr = parseDeliveryAddress(order.deliveryAddress);
      const otp = randomOtp();
      const expiryMin = Number(process.env.ONE_DAY_OTP_EXPIRY_MINUTES || 10);
      const expiresAt = new Date(Date.now() + expiryMin * 60 * 1000);
      await db.one_day_otps.create({ orderId: order.id, otp, expiresAt });
      notifyDeliveryOtp(order, otp, expiresAt).catch(() => {});
      const devMode = process.env.NODE_ENV !== 'production';
      res.json({
        success: true,
        message: 'OTP sent to customer app',
        expiresAt,
        ...(devMode ? { devOtp: otp, phone: addr?.phone } : {}),
      });
    } catch (e) {
      next(e);
    }
  },

  /** POST /one-day/orders/:id/payment-photo */
  async savePaymentPhoto(req, res, next) {
    try {
      const order = await db.orders.findByPk(req.params.id);
      if (!order || order.deliveryType !== 'one_day') {
        return res.status(404).json({ success: false, message: 'One-day order not found' });
      }
      const emp = getEmployeeFromReq(req);
      if (!emp) return res.status(401).json({ success: false, message: 'Employee auth required' });
      if (Number(order.assignedEmployeeId) !== Number(emp.id)) {
        return res.status(403).json({ success: false, message: 'Not assigned to this order' });
      }
      if (String(order.oneDayStatus || '') !== 'out_for_delivery') {
        return res.status(400).json({
          success: false,
          message: 'Order must be out for delivery',
        });
      }
      const paymentPhotoUrl = String(req.body?.paymentPhotoUrl || '').trim();
      if (!paymentPhotoUrl) {
        return res.status(400).json({ success: false, message: 'Payment photo URL required' });
      }
      const [proof, created] = await db.one_day_delivery_proofs.findOrCreate({
        where: { orderId: order.id },
        defaults: {
          employeeId: emp.id,
          paymentPhotoUrl,
        },
      });
      if (!created) {
        await proof.update({ paymentPhotoUrl, employeeId: emp.id });
      }
      await proof.reload();
      if (!proof.paymentPhotoUrl) {
        return res.status(500).json({
          success: false,
          message: 'Payment photo could not be saved. Please try again.',
        });
      }
      res.json({
        success: true,
        message: 'Payment photo saved',
        data: { paymentPhotoUrl: proof.paymentPhotoUrl },
      });
    } catch (e) {
      next(e);
    }
  },

  /** POST /one-day/orders/:id/complete */
  async completeOrder(req, res, next) {
    try {
      const order = await db.orders.findByPk(req.params.id);
      if (!order || order.deliveryType !== 'one_day') {
        return res.status(404).json({ success: false, message: 'One-day order not found' });
      }
      const store = await getStoreOrThrow(order.storeId);
      const { photoUrl, signatureUrl, otp, paymentPhotoUrl } = req.body || {};
      const emp = getEmployeeFromReq(req);

      if (store.requireDeliveryOtp) {
        const record = await db.one_day_otps.findOne({
          where: { orderId: order.id, verifiedAt: null },
          order: [['id', 'DESC']],
        });
        if (!record || record.otp !== String(otp) || new Date(record.expiresAt) < new Date()) {
          return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }
        await record.update({ verifiedAt: new Date() });
      }
      if (store.requireDeliverySignature && !signatureUrl) {
        return res.status(400).json({ success: false, message: 'Signature required' });
      }

      await db.one_day_delivery_proofs.findOrCreate({
        where: { orderId: order.id },
        defaults: {
          employeeId: emp?.id || order.assignedEmployeeId,
          photoUrl: photoUrl || null,
          paymentPhotoUrl: paymentPhotoUrl || null,
          signatureUrl: signatureUrl || null,
          otpVerifiedAt: store.requireDeliveryOtp ? new Date() : null,
        },
      }).then(async ([proof, created]) => {
        if (!created) {
          await proof.update({
            employeeId: emp?.id || order.assignedEmployeeId,
            photoUrl: photoUrl || proof.photoUrl,
            paymentPhotoUrl: paymentPhotoUrl || proof.paymentPhotoUrl,
            signatureUrl: signatureUrl || proof.signatureUrl,
            otpVerifiedAt: store.requireDeliveryOtp ? new Date() : proof.otpVerifiedAt,
          });
        }
      });

      await order.update({
        oneDayStatus: 'delivered',
        status: 'delieverd',
        deliveredAt: new Date(),
      });
      await logOrderEvent(order.id, 'delivered', { employeeId: emp?.id || order.assignedEmployeeId });
      res.json({ success: true, data: order });
    } catch (e) {
      next(e);
    }
  },

  /** GET /one-day/orders/:id/delivery-otp — customer in-app OTP */
  async getCustomerDeliveryOtp(req, res, next) {
    try {
      const order = await db.orders.findByPk(req.params.id);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      const userId = Number(req.user?.sub ?? req.user?.id);
      if (userId && Number(order.custId) !== userId) {
        return res.status(403).json({ success: false, message: 'Not your order' });
      }
      if (String(order.oneDayStatus || '') !== 'out_for_delivery') {
        return res.json({ success: true, data: null });
      }
      const otpRow = await getActiveDeliveryOtp(order.id);
      res.json({
        success: true,
        data: otpRow
          ? { otp: otpRow.otp, expiresAt: otpRow.expiresAt, orderId: order.id }
          : null,
      });
    } catch (e) {
      next(e);
    }
  },

  /** GET /one-day/orders/:id/track */
  async trackOrder(req, res, next) {
    try {
      const order = await db.orders.findByPk(req.params.id, {
        include: [{ model: db.store_employees, as: 'assignedEmployee', required: false }],
      });
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      const orderJson = order.get({ plain: true });
      const parsedAddress = parseDeliveryAddress(orderJson.deliveryAddress);
      const product = orderJson.productIds
        ? await db.product.findByPk(orderJson.productIds, { raw: true }).catch(() => null)
        : null;
      const deliveryCharge = Number(orderJson.deliveryCharge || 0);
      const grandTotal = Number(orderJson.grandtotal || 0);
      const events = await db.one_day_order_events.findAll({
        where: { orderId: order.id },
        order: [['createdAt', 'ASC']],
      });
      const proof = await db.one_day_delivery_proofs.findOne({ where: { orderId: order.id } });
      const etaMinutes = orderJson.distanceKm ? estimateEtaMinutes(orderJson.distanceKm) : null;
      const otpRow =
        String(orderJson.oneDayStatus || '') === 'out_for_delivery'
          ? await getActiveDeliveryOtp(order.id)
          : null;
      res.json({
        success: true,
        data: {
          order: orderJson,
          parsedAddress,
          product,
          itemTotal: grandTotal - deliveryCharge,
          activeDeliveryOtp: otpRow
            ? { otp: otpRow.otp, expiresAt: otpRow.expiresAt }
            : null,
          events,
          proof,
          etaMinutes,
          estimatedArrival: etaMinutes ? new Date(Date.now() + etaMinutes * 60000) : null,
          refundStatus: orderJson.refundStatus || 'none',
          refundNote: orderJson.refundNote || null,
          refundedAt: orderJson.refundedAt || null,
        },
      });
    } catch (e) {
      next(e);
    }
  },

  /** GET /one-day/tracking/:storeId/live */
  async liveTracking(req, res, next) {
    try {
      const storeId = Number(req.params.storeId);
      const employees = await db.store_employees.findAll({
        where: { storeId, status: 'active', isOnDuty: true },
      });
      const orders = await db.orders.findAll({
        where: {
          storeId,
          deliveryType: 'one_day',
          oneDayStatus: { [Op.in]: ['assigned', 'picked_up', 'out_for_delivery'] },
        },
        include: [{ model: db.store_employees, as: 'assignedEmployee', required: false }],
      });
      const store = await getStoreOrThrow(storeId);
      res.json({
        success: true,
        data: {
          store: {
            latitude: store.storeLatitude,
            longitude: store.storeLongitude,
            name: store.storename,
          },
          employees: employees.map(sanitizeEmployee),
          activeOrders: orders,
        },
      });
    } catch (e) {
      next(e);
    }
  },

  /** GET /one-day/tracking/order/:orderId */
  async trackOrderLive(req, res, next) {
    try {
      return module.exports.trackOrder(req, res, next);
    } catch (e) {
      next(e);
    }
  },

  /** GET /one-day/reports/:storeId */
  async reports(req, res, next) {
    try {
      const storeId = Number(req.params.storeId);
      const period = String(req.query.period || 'month');
      const data = await buildStoreReport(storeId, period, req.query.from);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** GET /one-day/reports/admin/all — admin cross-store */
  async adminReports(req, res, next) {
    try {
      const period = String(req.query.period || 'month');
      const data = await buildAdminReport(period, req.query.from);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** GET /one-day/reports/:storeId/export?format=csv */
  async exportStoreReport(req, res, next) {
    try {
      const storeId = Number(req.params.storeId);
      const period = String(req.query.period || 'month');
      const format = String(req.query.format || 'csv').toLowerCase();
      const data = await buildStoreReport(storeId, period, req.query.from);

      if (format === 'csv') {
        const csv = ordersToCsv(data.orders || []);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="one-day-store-${storeId}-${period}.csv"`);
        return res.send(csv);
      }
      return res.status(400).json({ success: false, message: 'Unsupported format. Use csv.' });
    } catch (e) {
      next(e);
    }
  },

  /** GET /one-day/reports/admin/export?format=csv */
  async exportAdminReport(req, res, next) {
    try {
      const period = String(req.query.period || 'month');
      const format = String(req.query.format || 'csv').toLowerCase();
      const data = await buildAdminReport(period, req.query.from);

      if (format === 'csv') {
        const csv = ordersToCsv(data.orders || []);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="one-day-admin-${period}.csv"`);
        return res.send(csv);
      }
      return res.status(400).json({ success: false, message: 'Unsupported format. Use csv.' });
    } catch (e) {
      next(e);
    }
  },

  /** GET /one-day/payments/:storeId */
  async listPaymentHistory(req, res, next) {
    try {
      const storeId = Number(req.params.storeId);
      const where = { storeId, deliveryType: 'one_day' };
      if (req.query.refundStatus) where.refundStatus = String(req.query.refundStatus);
      const range = getPeriodDateRange(String(req.query.period || ''));
      if (range) {
        where.createdAt = { [Op.gte]: range.from, [Op.lte]: range.to };
      }
      const rows = await db.orders.findAll({
        where,
        order: [['id', 'DESC']],
        limit: Math.min(Number(req.query.limit) || 200, 500),
      });
      const orderIds = rows.map((r) => r.id);
      const custIds = [...new Set(rows.map((r) => Number(r.custId)).filter((n) => n > 0))];

      const proofs = orderIds.length
        ? await db.one_day_delivery_proofs.findAll({ where: { orderId: orderIds } })
        : [];
      const proofByOrder = new Map(proofs.map((p) => [Number(p.orderId), p.get({ plain: true })]));

      let paymentRows = [];
      if (orderIds.length) {
        const [payments] = await db.sequelize.query(
          `SELECT * FROM payments WHERE orderCreationId IN (:ids) ORDER BY id DESC`,
          { replacements: { ids: orderIds.map(String) } }
        );
        paymentRows = payments || [];
      }
      const paymentByOrder = new Map();
      for (const p of paymentRows) {
        const key = Number(p.orderCreationId);
        if (!paymentByOrder.has(key)) paymentByOrder.set(key, p);
      }

      let customers = [];
      if (custIds.length) {
        const [custRows] = await db.sequelize.query(
          `SELECT id, firstName, lastName, phone, email FROM customers WHERE id IN (:ids)`,
          { replacements: { ids: custIds } }
        );
        customers = custRows || [];
      }
      const customerById = new Map(customers.map((c) => [Number(c.id), c]));

      const data = rows.map((row) => {
        const json = row.get({ plain: true });
        const proof = proofByOrder.get(Number(json.id));
        const payment = paymentByOrder.get(Number(json.id));
        const customer = customerById.get(Number(json.custId));
        const parsedAddress = parseDeliveryAddress(json.deliveryAddress);
        const deliveryCharge = Number(json.deliveryCharge || 0);
        const grandTotal = Number(json.grandtotal || 0);
        return {
          orderId: json.id,
          createdAt: json.createdAt,
          deliveredAt: json.deliveredAt,
          customerName: customer
            ? [customer.firstName, customer.lastName].filter(Boolean).join(' ')
            : parsedAddress?.fullname || '—',
          customerPhone: customer?.phone || parsedAddress?.phone || null,
          customerEmail: customer?.email || null,
          paymentMethod: formatPaymentMethod(json.paymentmethod),
          paymentMethodCode: json.paymentmethod,
          amount: grandTotal,
          itemTotal: grandTotal - deliveryCharge,
          deliveryCharge,
          paymentStatus: derivePaymentStatus(json, payment, proof),
          orderStatus: json.oneDayStatus,
          refundStatus: json.refundStatus || 'none',
          refundNote: json.refundNote || null,
          refundedAt: json.refundedAt || null,
          razorpayPaymentId: payment?.razorpayPaymentId || null,
          razorpayOrderId: payment?.razorpayOrderId || null,
          paymentPhotoUrl: proof?.paymentPhotoUrl || null,
          deliveryPhotoUrl: proof?.photoUrl || null,
        };
      });

      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  /** PATCH /one-day/orders/:id/cancel — customer */
  async cancelOrder(req, res, next) {
    try {
      const order = await db.orders.findByPk(req.params.id);
      if (!order || order.deliveryType !== 'one_day') {
        return res.status(404).json({ success: false, message: 'One-day order not found' });
      }
      const auth = assertCustomerOwnsOrder(order, req);
      if (!auth.ok) {
        return res.status(auth.status).json({ success: false, message: auth.message });
      }
      const status = String(order.oneDayStatus || '').toLowerCase();
      if (!['placed', 'assigned'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Order can only be cancelled before pickup',
        });
      }
      const reason = String(req.body?.reason || req.body?.note || '').trim();
      await order.update({ oneDayStatus: 'cancelled', status: 'cancelled' });
      await logOrderEvent(order.id, 'cancelled', {
        note: reason || 'Cancelled by customer',
      });
      res.json({ success: true, message: 'Order cancelled', data: order });
    } catch (e) {
      next(e);
    }
  },

  /** POST /one-day/orders/:id/request-refund — customer */
  async requestRefund(req, res, next) {
    try {
      const order = await db.orders.findByPk(req.params.id);
      if (!order || order.deliveryType !== 'one_day') {
        return res.status(404).json({ success: false, message: 'One-day order not found' });
      }
      const auth = assertCustomerOwnsOrder(order, req);
      if (!auth.ok) {
        return res.status(auth.status).json({ success: false, message: auth.message });
      }
      if (String(order.oneDayStatus || '').toLowerCase() !== 'delivered') {
        return res.status(400).json({
          success: false,
          message: 'Refund can only be requested after delivery',
        });
      }
      const current = String(order.refundStatus || 'none').toLowerCase();
      if (!['none', 'rejected'].includes(current)) {
        return res.status(400).json({
          success: false,
          message: `Refund request already ${current}`,
        });
      }
      const refundNote = String(req.body?.reason || req.body?.refundNote || '').trim();
      await order.update({
        refundStatus: 'requested',
        refundNote: refundNote || order.refundNote || null,
      });
      res.json({
        success: true,
        message: 'Refund request submitted to store',
        data: {
          orderId: order.id,
          refundStatus: order.refundStatus,
          refundNote: order.refundNote,
        },
      });
    } catch (e) {
      next(e);
    }
  },

  /** PATCH /one-day/payments/:orderId/refund */
  async updateRefundStatus(req, res, next) {
    try {
      const order = await db.orders.findByPk(req.params.orderId);
      if (!order || order.deliveryType !== 'one_day') {
        return res.status(404).json({ success: false, message: 'One-day order not found' });
      }
      const refundStatus = String(req.body?.refundStatus || '').toLowerCase();
      if (!REFUND_STATUSES.includes(refundStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid refund status. Use: ${REFUND_STATUSES.join(', ')}`,
        });
      }
      const refundNote = req.body?.refundNote != null ? String(req.body.refundNote) : order.refundNote;
      const patch = {
        refundStatus,
        refundNote: refundNote || null,
        refundedAt: refundStatus === 'refunded' ? new Date() : order.refundedAt,
      };
      if (refundStatus !== 'refunded') {
        patch.refundedAt = refundStatus === 'none' ? null : order.refundedAt;
      }
      await order.update(patch);
      res.json({
        success: true,
        message: 'Refund status updated',
        data: {
          orderId: order.id,
          refundStatus: order.refundStatus,
          refundNote: order.refundNote,
          refundedAt: order.refundedAt,
        },
      });
    } catch (e) {
      next(e);
    }
  },
};
