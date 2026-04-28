const express = require("express");
const subscriptionController = require("./subcription.controller");
const { sanitize } = require("../../../middleware/sanitizer");
const { jwtStrategy } = require("../../../middleware/strategy");
const { requireAdmin } = require("../../../middleware/requireAuth");

const subscriptionRouter = express.Router();

// Get all subscriptions
subscriptionRouter.route("/").get(sanitize(), jwtStrategy, requireAdmin, subscriptionController.getAllSubscriptions);

// Get subscription by ID
subscriptionRouter.route("/:id").get(sanitize(), subscriptionController.getSubscriptionById);

// Add new subscription
subscriptionRouter.route("/create").post(sanitize(), jwtStrategy, subscriptionController.addSubscription);

// Update subscription
subscriptionRouter.route("/update").post(sanitize(), jwtStrategy, subscriptionController.updateSubscription);

// Delete subscription
subscriptionRouter.route("/delete/:id").delete(sanitize(), jwtStrategy, requireAdmin, subscriptionController.deleteSubscription);

module.exports = { subscriptionRouter };
