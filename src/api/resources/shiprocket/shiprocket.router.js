const express = require("express");
const { sanitize } = require("../../../middleware/sanitizer");
const { jwtStrategy } = require("../../../middleware/strategy");
const shiprocketController = require("./shiprocket.controller");

const shiprocketRouter = express.Router();

// All routes already sit under global requireAuth. We still run jwtStrategy for consistency.
shiprocketRouter.route("/courier/serviceability").get(sanitize(), jwtStrategy, shiprocketController.serviceability);

shiprocketRouter.route("/orders/create/adhoc").post(sanitize(), jwtStrategy, shiprocketController.createOrder);
shiprocketRouter
  .route("/orders/create/from-order/:orderId")
  .post(sanitize(), jwtStrategy, shiprocketController.createOrderFromOrder);
shiprocketRouter.route("/courier/assign/awb").post(sanitize(), jwtStrategy, shiprocketController.assignAwb);
shiprocketRouter.route("/courier/generate/pickup").post(sanitize(), jwtStrategy, shiprocketController.generatePickup);

shiprocketRouter.route("/manifests/generate").post(sanitize(), jwtStrategy, shiprocketController.generateManifest);
shiprocketRouter.route("/manifests/print").post(sanitize(), jwtStrategy, shiprocketController.printManifest);

shiprocketRouter.route("/courier/generate/label").post(sanitize(), jwtStrategy, shiprocketController.generateLabel);
shiprocketRouter.route("/orders/print/invoice").post(sanitize(), jwtStrategy, shiprocketController.printInvoice);

shiprocketRouter.route("/courier/track/awb/:awb").get(sanitize(), jwtStrategy, shiprocketController.trackAwb);

module.exports = { shiprocketRouter };

