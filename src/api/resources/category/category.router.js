const express = require("express");
const categoryController = require("./category.controller");
const { jwtStrategy } = require("../../../middleware/strategy");
const { sanitize } = require("../../../middleware/sanitizer");
const { validateBody, schemas } = require("../../../middleware/validator");
const { requireAdmin } = require("../../../middleware/requireAuth");

const categoryRouter = express.Router();

categoryRouter
  .route("/getAllCategory")
  .get(sanitize(), categoryController.getCategoryList);
categoryRouter
  .route("/getAllSubCategory")
  .get(sanitize(), categoryController.getSubCategoryList);
categoryRouter
  .route("/getAllSubChildCategory")
  .get(sanitize(), categoryController.getSubChildCategoryList);
categoryRouter.route("/create").post(sanitize(), jwtStrategy, categoryController.addCategory);
categoryRouter.route("/list").get(sanitize(), categoryController.getList);
categoryRouter
  .route("/getCategoryById")
  .get(sanitize(), jwtStrategy, categoryController.getCategoryById);
categoryRouter
  .route("/create-sub")
  .post(sanitize(), jwtStrategy, categoryController.addSubCategory);
categoryRouter
  .route("/create-sub-child")
  .post(sanitize(), jwtStrategy, categoryController.addSubChildCategory);
categoryRouter
  .route("/update")
  .post(sanitize(), jwtStrategy, categoryController.updateCategory);

// Category list
categoryRouter
  .route("/main-list")
  .get(sanitize(), jwtStrategy, categoryController.getMainList);
categoryRouter
  .route("/main-list/update")
  .post(sanitize(), jwtStrategy, categoryController.getMainListUpdate);

// Sub category list
categoryRouter
  .route("/sub-list")
  .get(sanitize(), jwtStrategy, categoryController.getSubCategory);
categoryRouter
  .route("/sub-list/update")
  .post(sanitize(), jwtStrategy, categoryController.getSubCatListUpdate);
categoryRouter
  .route("/sub-list/delete")
  .delete(sanitize(), jwtStrategy, categoryController.getDeletedSubCatList);

// Child category
categoryRouter
  .route("/child/deleteById")
  .delete(sanitize(), jwtStrategy, categoryController.deleteCategory);

// Get all category by slug
categoryRouter
  .route("/cn/list")
  .get(sanitize(), jwtStrategy, categoryController.getAllCategoryBySlug);
categoryRouter
  .route("/c/:slug/:id")
  .get(sanitize(), jwtStrategy, categoryController.filterByCategoryList);

// Searching filter category
categoryRouter
  .route("/catlogsearch/child-category")
  .post(sanitize(), jwtStrategy, categoryController.getFilterbyCategory);
categoryRouter
  .route("/catlogsearch/product")
  .post(sanitize(), jwtStrategy, categoryController.getProductBySubcategory);

// Mobile view
categoryRouter
  .route("/mobile/getAllCategory")
  .get(sanitize(), categoryController.getAllMobileCategory);
categoryRouter
  .route("/mobile/getAllSubCategoryById")
  .post(sanitize(), categoryController.getAllSubCategoryById);

module.exports = { categoryRouter };
