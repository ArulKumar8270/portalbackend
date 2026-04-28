const express = require("express");
const customerController = require("./customer.controller");
const { sanitize } = require("../../../middleware/sanitizer");
const { customerStrategy, jwtStrategy } = require("../../../middleware/strategy");
const { validateBody, schemas } = require("../../../middleware/validator");
const { authRateLimiter, strictRateLimiter } = require("../../../middleware/rateLimiter");
const { requireAdmin } = require("../../../middleware/requireAuth");

const customerRouter = express.Router();

customerRouter.route("/register").post(
  strictRateLimiter, // 3 attempts per hour
  sanitize(), 
  customerController.addUser
);
customerRouter
  .route("/getUserByEmailId")
  .get(sanitize(), customerController.findUser);
customerRouter
  .route("/login")
  .post(
    // authRateLimiter, // 5 attempts per 15 minutes
    sanitize(),
    validateBody(schemas.loginSchema),
    customerStrategy,
    customerController.login
  );

// Get all customers
customerRouter
  .route("/list")
  .get(sanitize(), jwtStrategy, requireAdmin, customerController.getAllCustomer);
customerRouter
  .route("/update")
  .post(sanitize(), jwtStrategy, customerController.getCustomerUpdate);
customerRouter
  .route("/delete")
  .delete(sanitize(), jwtStrategy, requireAdmin, customerController.deleteCustomer);

module.exports = { customerRouter };
