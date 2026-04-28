const express = require("express");
const billingController = require("./billing.controller");
const { sanitize } = require("../../../middleware/sanitizer");
const { jwtStrategy } = require("../../../middleware/strategy");
const { requireAdmin } = require("../../../middleware/requireAuth");

const billingRouter = express.Router();

billingRouter.route("/add").post(jwtStrategy, billingController.addBill);
billingRouter.route("/update").post(sanitize(), jwtStrategy, billingController.updateBill);
billingRouter.route("/getAll").get(jwtStrategy, requireAdmin, billingController.getBills);
billingRouter.route("/getById/:id").get(jwtStrategy, billingController.getBillById);
billingRouter.route("/getByStoreId/:storeId").get(jwtStrategy, billingController.getBillByStoreId);

module.exports = { billingRouter };

