const express = require("express");
const paymentController = require("./payment.controller");
const { sanitize } = require("../../../middleware/sanitizer");
const { jwtStrategy } = require("../../../middleware/strategy");
const { requireAdmin } = require("../../../middleware/requireAuth");

const paymentRouter = express.Router();
paymentRouter.route("/orders").post(paymentController.orderDetails);
paymentRouter
  .route("/orderlist")
  .post(jwtStrategy, paymentController.findOrderList);
paymentRouter
  .route("/getAllPayment")
  .get(jwtStrategy, requireAdmin, paymentController.getAllPayment);

module.exports = { paymentRouter };
