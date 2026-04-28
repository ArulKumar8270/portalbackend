const express = require("express");
const requestStoreController = require("./requestStore.controller");
const { sanitize } = require("../../../middleware/sanitizer");
const { jwtStrategy } = require("../../../middleware/strategy");
const { requireAdmin } = require("../../../middleware/requireAuth");
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

const requestStoreRouter = express.Router();

requestStoreRouter.route("/add").post(
  sanitize(),
  // jwtStrategy,
  upload.single("document"),
  requestStoreController.create
);

requestStoreRouter.route("/getAll").get(jwtStrategy, requireAdmin, requestStoreController.index);

requestStoreRouter
  .route("/update/:id")
  .post(sanitize(), jwtStrategy, upload.single("document"), requestStoreController.update);

requestStoreRouter
  .route("/getById/:id")
  .get(sanitize(), jwtStrategy, requestStoreController.getById);

requestStoreRouter
  .route("/delete/:id")
  .delete(sanitize(), jwtStrategy, requestStoreController.delete);

module.exports = { requestStoreRouter };
