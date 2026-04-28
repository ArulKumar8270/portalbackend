const db = require("../../../models");

module.exports = {
  // Get all vendorStock entries
  async getVendorStock(req, res, next) {
    try {
      db.vendorStock
        .findAll({
          order: [["createdAt", "DESC"]],
          include: [
            {
              model: db.category,
              attributes: ["id", "name"],
            },
            {
              model: db.vendor,
              attributes: ["id", "storename", "ownername", "email"],
            },
          ],
        })
        .then((list) => {
          res.status(200).json({ success: true, data: list });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  //Add category
  async addVendorStock(req, res, next) {
    try {
      const { categoryId, stock, vendorId } = req.body;
      db.vendorStock
        .findOne({ where: { categoryId: vendorId } })
        .then((data) => {
          if (data) {
            return db.vendorStock.update(
              { stock: stock },
              { where: { id: data.id } }
            );
          }
          return db.vendorStock.create({
            categoryId: categoryId,
            vendorId: vendorId,
            stock: stock,
          });
        })
        .then((vendorStock) => {
          res
            .status(200)
            .json({ success: true, msg: "Successfully inserted stock" });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  //Get by Id
  async getVendorStockById(req, res, next) {
    try {
      const { id } = req.params;
      db.vendorStock
        .findAll({
          where: { vendorId: id },
          include: [
            {
              model: db.category,
              attributes: ["id", "name"],
            },
            {
              model: db.vendor,
              attributes: ["id", "storename", "ownername", "email"],
            },
          ],
        })
        .then((list) => {
          res.status(200).json({ success: true, data: list });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  //update
  async updateVendorStock(req, res, next) {
    try {
      const { categoryId, stock, vendorId, id } = req.body;
      db.vendorStock
        .findOne({ where: { id: id } })
        .then((data) => {
          if (data) {
            return db.vendorStock.update(
              { categoryId: categoryId, stock: stock, vendorId: vendorId },
              { where: { id: id } }
            );
          }
          throw new RequestError("vendor Not Found", 409);
        })
        .then((category) => {
          res.status(200).json({ success: true, msg: "Successfully Updated" });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  //Delete
  async vendorStockDelete(req, res, next) {
    const { id } = req.params;
    try {
      db.vendorStock
        .findOne({ where: { id: id } })
        .then((data) => {
          if (data) {
            return db.vendorStock.destroy({ where: { id: id } });
          }
          throw new RequestError("Vendor is not found");
        })
        .then((re) => {
          return res.status(200).json({
            success: true,
            status: "deleted Vendor Stock Successfully",
          });
        })
        .catch((err) => {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },
};
