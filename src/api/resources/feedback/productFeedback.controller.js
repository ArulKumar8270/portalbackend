const db = require("../../../models");

module.exports = {
  // Get all productFeedback entries
  async getProductFeedback(req, res, next) {
    try {
      db.productFeedback
        .findAll({
          order: [["createdAt", "DESC"]],
          include: [
            {
              model: db.user,
            },
            {
              model: db.product,
            },
            {
              model: db.vendor,
            },
            {
              model: db.store,
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
      throw new RequestError("Error fetching product feedback");
    }
  },

  // Add product feedback
  async addProductFeedback(req, res, next) {
    try {
      const { customerId, productId, vendorId, storeId, feedBack, rating, customizedMessage } = req.body;
      db.productFeedback
        .create({
          customerId: customerId,
          productId: productId,
          vendorId: '0',
          storeId: storeId,
          feedBack: feedBack,
          rating: rating,
          customizedMessage: customizedMessage,
        })
        .then((productFeedback) => {
          res
            .status(200)
            .json({ success: true, msg: "Successfully added product feedback" });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error adding product feedback");
    }
  },

  // Get feedback by productId
  async getProductFeedbackById(req, res, next) {
    try {
      const { id } = req.params;
      db.productFeedback
        .findAll({
          where: { productId: id },
          include: [
            {
              model: db.user,
              attributes: ["id", "name", "email"],
            },
            {
              model: db.product,
              attributes: ["id", "name", "price"],
            },
            {
              model: db.vendor,
              attributes: ["id", "storename", "ownername", "email"],
            },
            {
              model: db.store,
              attributes: ["id", "storename"],
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
      throw new RequestError("Error fetching product feedback by product ID");
    }
  },

  // Update product feedback
  async updateProductFeedback(req, res, next) {
    try {
      const { id, userId, productId, vendorId, storeId, feedBack, rating, customizedMessage } = req.body;
      db.productFeedback
        .findOne({ where: { id: id } })
        .then((data) => {
          if (data) {
            return db.productFeedback.update(
              {
                customerId: userId,
                productId: productId,
                vendorId: vendorId,
                storeId: storeId,
                feedBack: feedBack,
                rating: rating,
                customizedMessage: customizedMessage,
              },
              { where: { id: id } }
            );
          }
          throw new RequestError("Feedback not found", 409);
        })
        .then(() => {
          res.status(200).json({ success: true, msg: "Successfully updated feedback" });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error updating feedback");
    }
  },

  // Delete product feedback
  async deleteProductFeedback(req, res, next) {
    const { id } = req.params;
    try {
      db.productFeedback
        .findOne({ where: { id: id } })
        .then((data) => {
          if (data) {
            return db.productFeedback.destroy({ where: { id: id } });
          }
          throw new RequestError("Feedback not found");
        })
        .then(() => {
          return res.status(200).json({
            success: true,
            msg: "Successfully deleted feedback",
          });
        })
        .catch((err) => {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error deleting feedback");
    }
  },
};
