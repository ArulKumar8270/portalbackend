const express = require("express");
// const multer = require('multer');
// const path = require('path');
const vendorController = require("./vendor.controller");
const { sanitize } = require("../../../middleware/sanitizer");
const { jwtStrategy } = require("../../../middleware/strategy");
const { validateBody, schemas } = require("../../../middleware/validator");
const { requireAdmin } = require("../../../middleware/requireAuth");
const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage: storage });

const vendorRouter = express.Router();
vendorRouter
  .route("/create")
  .post(jwtStrategy, upload.single("vendorImage"), vendorController.index);
vendorRouter.route("/list").get(sanitize(), jwtStrategy, requireAdmin, vendorController.getAllvendor);
vendorRouter
  .route("/list/:id")
  .get(sanitize(), jwtStrategy, vendorController.getVendorStockById);
vendorRouter
  .route("/product-list")
  .get(sanitize(), jwtStrategy, vendorController.getAllVendorProduct);
vendorRouter
  .route("/product/getAllProductById/:id")
  .get(sanitize(), jwtStrategy, vendorController.getProductByVendor);
vendorRouter
  .route("/update")
  .post(jwtStrategy, requireAdmin, upload.single("vendorImage"), vendorController.vendorUpdate);
vendorRouter
  .route("/delete/:id")
  .delete(sanitize(), jwtStrategy, requireAdmin, vendorController.vendorDelete);
vendorRouter
  .route("/product-delete")
  .post(sanitize(), jwtStrategy, vendorController.vendorProductDelete);
vendorRouter.route("/product-add").post(jwtStrategy, vendorController.vendorAddProduct);
// vendorRouter.route("/wordtojson").post(upload.single("vendorImage"), vendorController.extractClustersFromDocx);

module.exports = { vendorRouter };
