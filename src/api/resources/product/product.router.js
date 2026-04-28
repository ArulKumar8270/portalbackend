const express = require("express");
const productController = require("./product.controller");
const { sanitize } = require("../../../middleware/sanitizer");
const { jwtStrategy } = require("../../../middleware/strategy");
const { requireAdmin } = require("../../../middleware/requireAuth");
// const upload = require('../../../awsbucket');
const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage: storage });

const productRouter = express.Router();
productRouter
  .route("/add")
  .post(
    // Optional file upload - multer will not error if no file is provided
    upload.single("photo"),
    // sanitize(),
    // jwtStrategy,
    productController.addProduct
  );
productRouter.route("/getAllproduct").get(productController.index);
productRouter
  .route("/getAllproductList")
  .get(productController.getAllProductList);
productRouter
  .route("/getProductsByOpenStores")
  .get(productController.getProductsByOpenStores);
productRouter
  .route("/update")
  .post(jwtStrategy, productController.update);
productRouter
  .route("/getProductByCategory")
  .get(productController.getProductListByCategory);
productRouter
  .route("/getProductById/:id")
  .get(productController.getProductListById);
productRouter
  .route("/getWebProductById/:id")
  .get(productController.getWebProductListById);
productRouter
  .route("/product-offer")
  .post(jwtStrategy, requireAdmin, productController.addProductOffer);
productRouter
  .route("/getAllProductOffer")
  .get(productController.getProductOffer);
productRouter
  .route("/delete")
  .delete(jwtStrategy, requireAdmin, productController.productDelete);
productRouter
  .route("/deleteOfferById/:id")
  .get(jwtStrategy, requireAdmin, productController.productOfferDelete);
productRouter
  .route("/getAllPhoto")
  .get(productController.getAllPhoto);
productRouter
  .route("/slider-photo/delete")
  .delete(jwtStrategy, requireAdmin, productController.deleteSliderPhoto);

//Category by product
productRouter
  .route("/getAllGroceryStaple")
  .get(productController.getAllGrocerryStaples);
productRouter
  .route("/list/:slug")
  .get(productController.getAllProductBySlug);
productRouter
  .route("/getAllByCategory")
  .get(productController.GetAllByCategories);
productRouter
  .route("/getallProductbySubChildCat")
  .post(productController.getProductSubChildCat);

// Filter product
productRouter
  .route("/gcatalogsearch/result")
  .get(productController.getFilterbyProduct);

//new api
productRouter
  .route("/search_product")
  .post(productController.searchProductBySubCat);

//aws image delete
productRouter
  .route("/aws/delete/photo")
  .post(productController.awsProductPhotoDelete);

// Upload product photos from URLs
productRouter
  .route("/upload-photos")
  .post(sanitize(), jwtStrategy, productController.uploadProductPhotos);

module.exports = { productRouter };
