const db = require("../../../models");

module.exports = {
  /**
   * POST /store/public/by-ids
   * Body: { ids: number[] }
   * Returns minimal store fields needed for frontend cart/shiprocket calculation.
   */
  async getStoresByIds(req, res, next) {
    try {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      const uniq = [...new Set(ids.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0))];
      if (!uniq.length) {
        return res.status(200).json({ success: true, data: [] });
      }

      const rows = await db.store.findAll({
        where: { id: uniq },
        attributes: [
          "id",
          "storename",
          "phone",
          "deliveryPartner",
          "shiprocketPickupLocation",
          "storeaddress",
          "owneraddress",
          "location",
          "areaId",
          [db.Sequelize.col("area.zipcode"), "areaZipcode"],
        ],
        include: [
          {
            model: db.area,
            attributes: [],
            required: false,
          },
        ],
        raw: true,
      });

      // Keep same order as input ids
      const byId = new Map(rows.map((r) => [Number(r.id), r]));
      const ordered = uniq.map((id) => byId.get(id)).filter(Boolean);
      return res.status(200).json({ success: true, data: ordered });
    } catch (e) {
      next(e);
    }
  },
};

