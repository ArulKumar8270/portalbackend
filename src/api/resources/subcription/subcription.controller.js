const db = require("../../../models");
const { Op } = require("sequelize");

module.exports = {
  // Get all subscriptions
  async getAllSubscriptions(req, res, next) {
    try {
      const subscriptions = await db.subscriptions.findAll({
        order: [["createdAt", "DESC"]],
      });
      res.status(200).json({ success: true, data: subscriptions });
    } catch (error) {
      next(error);
    }
  },

  // Get subscription by ID
  async getSubscriptionById(req, res, next) {
    try {
      const { id } = req.params;
      const { subscriptionType } = req.query; // Optional subscriptionType
      
      // Build the "where" condition
      const whereCondition = {
        customerId: id,
        paymentId: {
          [db.Sequelize.Op.ne]: "TEMP_PAYMENT_ID_DEV", // Exclude records with paymentId equal to TEMP_PAYMENT_ID_DEV
        },
      };
  
      if (subscriptionType) {
        whereCondition.subscriptionType = subscriptionType; // Only add if provided
      }
  
      // Query the database
      const subscription = await db.subscriptions.findAll({
        where: whereCondition,
        order: [['createdAt', 'DESC']], // Order by creation date in descending order
        limit: 1, // Limit to only one record
      });
  
      // Check if the subscription exists
      if (!subscription || subscription.length === 0) {
        return res.status(404).json({ success: false, message: "Subscription not found" });
      }
  
      // Return the subscription data (access the first element as limit is 1)
      res.status(200).json({ success: true, data: subscription[0] });
    } catch (error) {
      next(error);
    }
  },
  

  // Add new subscription
  async addSubscription(req, res, next) {
    try {
      const { subscriptionType, subscriptionPlan, subscriptionPrice, customerId, status, subscriptionCount, freeCount, paymentId, expiresAt } = req.body;
      const subscription = await db.subscriptions.create({
        subscriptionType,
        subscriptionPlan,
        subscriptionPrice,
        customerId,
        status,
        subscriptionCount,
        freeCount,
        paymentId,
        expiresAt: expiresAt || null,
      });
      res.status(200).json({ success: true, data: subscription });
    } catch (error) {
      next(error);
    }
  },

  // Update subscription
  async updateSubscription(req, res, next) {
    try {
      const { id, subscriptionType, subscriptionPlan, subscriptionPrice, status, subscriptionCount, freeCount, paymentId, expiresAt } = req.body;
      const subscription = await db.subscriptions.findOne({ where: { id: id } });
      if (!subscription) {
        return res.status(404).json({ success: false, message: "Subscription not found" });
      }
      await subscription.update({
        subscriptionType,
        subscriptionPlan,
        subscriptionPrice,
        status,
        subscriptionCount,
        freeCount,
        paymentId,
        expiresAt,
      });
      res.status(200).json({ success: true, message: "Subscription updated successfully" });
    } catch (error) {
      next(error);
    }
  },

  // Delete subscription
  async deleteSubscription(req, res, next) {
    try {
      const { id } = req.params;
      const subscription = await db.subscriptions.findOne({ where: { id: id } });
      if (!subscription) {
        return res.status(404).json({ success: false, message: "Subscription not found" });
      }
      await subscription.destroy();
      res.status(200).json({ success: true, message: "Subscription deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
};
