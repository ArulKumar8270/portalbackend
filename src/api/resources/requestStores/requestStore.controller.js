// controllers/requestStoreController.js
const db = require("../../../models");

module.exports = {
  async index(req, res, next) {
    try {
      const requests = await db.RequestStore.findAll();
      res.status(200).json({ success: true, data: requests });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const requestData = req.body;
      const newRequest = await db.RequestStore.create(requestData);
      res.status(201).json({ success: true, data: newRequest });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const request = await db.RequestStore.findOne({ where: { id } });
      if (request) {
        await db.RequestStore.update(updateData, { where: { id } });
        const updatedRequest = await db.RequestStore.findOne({ where: { id } });
        res.status(200).json({ success: true, data: updatedRequest });
      } else {
        res.status(404).json({ success: false, message: "Request not found" });
      }
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const request = await db.RequestStore.findOne({ where: { id } });
      if (request) {
        await db.RequestStore.destroy({ where: { id } });
        res.status(204).json({ success: true, message: "Request deleted" });
      } else {
        res.status(404).json({ success: false, message: "Request not found" });
      }
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const request = await db.RequestStore.findOne({ where: { id } });

      if (request) {
        res.status(200).json({ success: true, data: request });
      } else {
        res.status(404).json({ success: false, message: "Request not found" });
      }
    } catch (err) {
      console.log(err);
      next(err);
    }
  },
};
