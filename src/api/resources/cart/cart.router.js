const express = require('express');
// const multer = require('multer');
// const path = require('path');
const cartController = require('./cart.controller');
const { sanitize } = require('../../../middleware/sanitizer');
const { jwtStrategy } = require('../../../middleware/strategy');
const { validateBody, schemas } = require('../../../middleware/validator');
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


const cartRouter = express.Router();
cartRouter.route('/create').post(cartController.create);
cartRouter.route('/list/:orderId').get(cartController.index);
cartRouter.route('/list/:orderId/:productId').get(cartController.show);
cartRouter.route('/update/:orderId/:productId').post(cartController.update);
cartRouter.route('/delete/:orderId/:productId').delete(cartController.delete);

module.exports = { cartRouter };
