const express = require("express");
const productFeedbackController = require("./productFeedback.controller");
const { sanitize } = require("../../../middleware/sanitizer");
const { jwtStrategy } = require("../../../middleware/strategy");
const { requireAdmin } = require("../../../middleware/requireAuth");

const productFeedbackRouter = express.Router();

// Create new product feedback
productFeedbackRouter
  .route("/create")
  .post(jwtStrategy, productFeedbackController.addProductFeedback);

// Get all product feedback
productFeedbackRouter
  .route("/list")
  .get(jwtStrategy, requireAdmin, productFeedbackController.getProductFeedback);

// Get product feedback by productId
productFeedbackRouter
  .route("/list/:id")
  .get(productFeedbackController.getProductFeedbackById);

// Update product feedback
productFeedbackRouter
  .route("/update")
  .post(jwtStrategy, productFeedbackController.updateProductFeedback);

// Delete product feedback
productFeedbackRouter
  .route("/delete/:id")
  .delete(jwtStrategy, requireAdmin, productFeedbackController.deleteProductFeedback);

module.exports = { productFeedbackRouter };
