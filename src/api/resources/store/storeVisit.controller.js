const db = require("../../../models");

/**
 * Record a site or store visit (public - no auth).
 * Body: { storeId?: number } - omit or null for site visit, set for store page visit.
 */
async function recordVisit(req, res, next) {
  try {
    const { storeId } = req.body || {};
    await db.storeVisit.create({
      storeId: storeId ? Number(storeId) : null,
    });
    return res.status(201).json({ success: true, message: "Visit recorded" });
  } catch (err) {
    next(err);
  }
}

/**
 * Get start date for period: day (last 24h), week (last 7 days), month (last 30 days).
 */
function getStartDateForPeriod(period) {
  const now = new Date();
  const start = new Date(now);
  switch (period) {
    case "day":
      start.setDate(start.getDate() - 1);
      break;
    case "week": 
      start.setDate(start.getDate() - 7);
      break;
    case "month":
      start.setDate(start.getDate() - 30);
      break;
    default:
      return null;
  }
  return start;
}

/**
 * Get visitor reports: total site visits + per-store visit counts (auth required).
 * Query params:
 * - period (day|week|month)
 * - storeName (optional search)
 * - storeId (optional exact match; useful for seller statistics)
 */
async function getVisitReports(req, res, next) {
  try {
    const { Op } = db.Sequelize;
    const period = (req.query.period || "").toLowerCase();
    const storeNameSearch = (req.query.storeName || "").trim();
    const storeIdRaw = req.query.storeId ?? req.query.store_id ?? null;
    const storeId = storeIdRaw != null && String(storeIdRaw).trim() !== ""
      ? Number(storeIdRaw)
      : null;

    const startDate = period && ["day", "week", "month"].includes(period)
      ? getStartDateForPeriod(period)
      : null;

    const dateCondition = startDate ? { createdAt: { [Op.gte]: startDate } } : {};

    const baseVisitWhere = { ...dateCondition };

    const siteWhere = { storeId: { [Op.is]: null }, ...dateCondition };
    const siteTotal = await db.storeVisit.count({ where: siteWhere });

    let storeIdsFilter = null;
    if (storeId != null && Number.isFinite(storeId) && storeId > 0) {
      storeIdsFilter = [storeId];
    }

    if (storeNameSearch) {
      const escaped = String(storeNameSearch)
        .replace(/\\/g, "\\\\")
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_")
        .replace(/'/g, "''");
      const stores = await db.store.findAll({
        where: {
          storename: { [Op.like]: `%${escaped}%` },
        },
        attributes: ["id"],
        raw: true,
      });
      const nameMatches = stores.map((s) => s.id);
      storeIdsFilter = storeIdsFilter ? storeIdsFilter.filter((id) => nameMatches.includes(id)) : nameMatches;
      if (storeIdsFilter.length === 0) {
        return res.json({
          success: true,
          data: { siteVisitCount: siteTotal, storeVisitCount: 0, storeVisits: [] },
        });
      }
    }

    const storeVisitWhere = {
      storeId: { [Op.ne]: null },
      ...baseVisitWhere,
    };
    if (storeIdsFilter) {
      storeVisitWhere.storeId = { [Op.in]: storeIdsFilter };
    }

    const storeCountRows = await db.storeVisit.findAll({
      attributes: [
        "storeId",
        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "visitCount"],
      ],
      where: storeVisitWhere,
      group: ["storeId"],
      raw: true,
    });

    const storeIds = storeCountRows.map((r) => r.storeId).filter(Boolean);
    const stores = storeIds.length
      ? await db.store.findAll({
          where: { id: { [Op.in]: storeIds } },
          attributes: ["id", "storename"],
          raw: true,
        })
      : [];
    const storeNameMap = stores.reduce((acc, s) => {
      acc[s.id] = s.storename;
      return acc;
    }, {});

    let storeVisits = storeCountRows.map((row) => ({
      storeId: row.storeId,
      storeName: storeNameMap[row.storeId] || "Unknown",
      visitCount: Number(row.visitCount || 0),
    }));

    if (storeNameSearch && storeVisits.length) {
      const q = storeNameSearch.toLowerCase();
      storeVisits = storeVisits.filter((row) =>
        (row.storeName || "").toLowerCase().includes(q)
      );
    }

    let storeVisitCount = null;
    if (storeId != null && Number.isFinite(storeId) && storeId > 0) {
      const row = storeVisits.find((r) => Number(r.storeId) === Number(storeId));
      storeVisitCount = row ? Number(row.visitCount || 0) : 0;
    }

    // Extra seller-friendly summary fields (only when a single storeId is requested)
    let orderCount = null;
    let productCount = null;
    let dailyVisits = null;
    if (storeId != null && Number.isFinite(storeId) && storeId > 0) {
      const ordersWhere = {
        storeId: Number(storeId),
        ...(startDate ? { createdAt: { [Op.gte]: startDate } } : {}),
      };
      orderCount = await db.orders.count({ where: ordersWhere }).catch(() => 0);

      // Count distinct products mapped to this store
      const prodRow = await db.store_product.findOne({
        attributes: [
          [db.sequelize.fn("COUNT", db.sequelize.fn("DISTINCT", db.sequelize.col("productId"))), "cnt"],
        ],
        where: { supplierId: Number(storeId) },
        raw: true,
      }).catch(() => null);
      productCount = Number(prodRow?.cnt || 0);

      // Daily visit counts (for chart)
      const dayExpr = db.sequelize.fn("DATE", db.sequelize.col("createdAt"));
      const dailyWhere = {
        storeId: Number(storeId),
        ...(startDate ? { createdAt: { [Op.gte]: startDate } } : {}),
      };
      const dailyRows = await db.storeVisit.findAll({
        attributes: [
          [dayExpr, "day"],
          [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
        ],
        where: dailyWhere,
        group: [dayExpr],
        order: [[dayExpr, "ASC"]],
        raw: true,
      }).catch(() => []);

      dailyVisits = (dailyRows || []).map((r) => ({
        day: r.day ? String(r.day).slice(0, 10) : null,
        count: Number(r.count || 0),
      })).filter((r) => r.day);
    }

    return res.json({
      success: true,
      data: {
        siteVisitCount: siteTotal,
        storeVisitCount,
        orderCount,
        productCount,
        dailyVisits,
        storeVisits,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  recordVisit,
  getVisitReports,
};
