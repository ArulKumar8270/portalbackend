const db = require("../../../models"); // Ensure correct path to your models

module.exports = {
  // Get all ads
  async getAllAds(req, res, next) {
    try {
      const ads = await db.Ad.findAll({
        include: [
          {
            model: db.user,
          },
          {
            model: db.store,
          },
        ],
      });
      res.status(200).json({ success: true, data: ads });
    } catch (err) {
      next(err);
    }
  },

  // Get ad by ID
  async getAdById(req, res, next) {
    try {
      const { id } = req.params;
      const ad = await db.Ad.findOne({
        where: { storeId: id },
        include: [
          {
            model: db.user,
          },
          {
            model: db.store,
          },
        ],
      });

      if (!ad) {
        return res.status(404).json({ success: false, msg: "Ad not found" });
      }

      res.status(200).json({ success: true, data: ad });
    } catch (err) {
      next(err);
    }
  },

  // Create new ad
  async createAd(req, res, next) {
    try {
      const { customerId, adImage, status, storeId } = req.body;
      const newAd = await db.Ad.create({
        customerId,
        adImage,
        status,
        storeId,
      });

      res.status(201).json({ success: true, data: newAd });
    } catch (err) {
      next(err);
    }
  },

  // Update an ad
  async updateAd(req, res, next) {
    try {
      const {id, customerId, adImage, status, storeId } = req.body;

      const ad = await db.Ad.findOne({ where: { id } });
      if (!ad) {
        return res.status(404).json({ success: false, msg: "Ad not found" });
      }

      await ad.update({ customerId, adImage, status, storeId });

      res.status(200).json({ success: true, msg: "Ad updated successfully" });
    } catch (err) {
      next(err);
    }
  },

  // Delete an ad
  async deleteAd(req, res, next) {
    try {
      const { id } = req.params;
      const ad = await db.Ad.findOne({ where: { id } });

      if (!ad) {
        return res.status(404).json({ success: false, msg: "Ad not found" });
      }

      await ad.destroy();
      res.status(200).json({ success: true, msg: "Ad deleted successfully" });
    } catch (err) {
      next(err);
    }
  },
};
