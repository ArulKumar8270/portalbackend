const express = require("express");
const orderController = require("./order.controller");
const { sanitize } = require("../../../middleware/sanitizer");
const { jwtStrategy } = require("../../../middleware/strategy");
const { requireAdmin } = require("../../../middleware/requireAuth");

const orderRouter = express.Router();

orderRouter.route("/create").post(orderController.index);
orderRouter.route("/list").get(jwtStrategy, requireAdmin, orderController.getAllOrderList);
orderRouter
  .route("/status/update")
  .post(jwtStrategy, orderController.statusUpdate);
orderRouter
  .route("/list/:id")
  .get(orderController.getAllOrderListById); 
  orderRouter
  .route("/store/list/:id")
  .get(orderController.getAllOrderListBySoreId); 
orderRouter
  .route("/status")
  .post(jwtStrategy, orderController.getAllOrderStatus);
orderRouter.route("/count").get(jwtStrategy, orderController.getAllOrderCount);
orderRouter
  .route("/delete/:id")
  .delete(sanitize(), jwtStrategy, orderController.deleteOrder);
module.exports = { orderRouter };
