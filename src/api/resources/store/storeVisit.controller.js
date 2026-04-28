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
 * Query params: period (day|week|month), storeName (optional search).
 */
async function getVisitReports(req, res, next) {
  try {
    const { Op } = db.Sequelize;
    const period = (req.query.period || "").toLowerCase();
    const storeNameSearch = (req.query.storeName || "").trim();

    const dateCondition = period && ["day", "week", "month"].includes(period)
      ? { createdAt: { [Op.gte]: getStartDateForPeriod(period) } }
      : {};

    const baseVisitWhere = { ...dateCondition };

    const siteWhere = { storeId: { [Op.is]: null }, ...dateCondition };
    const siteTotal = await db.storeVisit.count({ where: siteWhere });

    let storeIdsFilter = null;
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
      storeIdsFilter = stores.map((s) => s.id);
      if (storeIdsFilter.length === 0) {
        return res.json({
          success: true,
          data: { siteVisitCount: siteTotal, storeVisits: [] },
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

    return res.json({
      success: true,
      data: {
        siteVisitCount: siteTotal,
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
