const express = require("express");
const invoiceFormatController = require("./invoiceFormat.controller");
const { sanitize } = require("../../../middleware/sanitizer");
const { jwtStrategy } = require("../../../middleware/strategy");
const { requireAdmin } = require("../../../middleware/requireAuth");

const invoiceFormatRouter = express.Router();

// ============================================
// IMPORTANT: Route Ordering Rules
// ============================================
// 1. Specific routes (like /list, /create) come FIRST
// 2. Routes with paths (like /store/:storeId, /vendor/:vendorId) come NEXT
// 3. Generic parameter routes (like /:id) come LAST
// ============================================

// Invoice format management routes - Specific routes first
invoiceFormatRouter
  .route("/list")
  .get(sanitize(), jwtStrategy, invoiceFormatController.getAllFormats);

invoiceFormatRouter
  .route("/assignments")
  .get(sanitize(), jwtStrategy, invoiceFormatController.getAssignments);

invoiceFormatRouter
  .route("/create")
  .post(sanitize(['headerTemplate', 'template', 'footerTemplate']), jwtStrategy, requireAdmin, invoiceFormatController.createFormat);

invoiceFormatRouter
  .route("/update/:id")
  .post(sanitize(['headerTemplate', 'template', 'footerTemplate']), jwtStrategy, requireAdmin, invoiceFormatController.updateFormat);

invoiceFormatRouter
  .route("/delete/:id")
  .post(sanitize(), jwtStrategy, requireAdmin, invoiceFormatController.deleteFormat);

// Store invoice format assignment routes - MUST come before /:id route
invoiceFormatRouter
  .route("/store/:storeId")
  .get(sanitize(), jwtStrategy, invoiceFormatController.getStoreFormat);

invoiceFormatRouter
  .route("/store/:storeId/assign")
  .post(sanitize(), jwtStrategy, requireAdmin, invoiceFormatController.assignStoreFormat);

// Vendor invoice format assignment routes - MUST come before /:id route
invoiceFormatRouter
  .route("/vendor/:vendorId")
  .get(sanitize(), jwtStrategy, invoiceFormatController.getVendorFormat);

invoiceFormatRouter
  .route("/vendor/:vendorId/assign")
  .post(sanitize(), jwtStrategy, requireAdmin, invoiceFormatController.assignVendorFormat);

// Get format by ID - MUST be last to avoid catching other routes
invoiceFormatRouter
  .route("/:id")
  .get(sanitize(), jwtStrategy, invoiceFormatController.getFormatById);

module.exports = { invoiceFormatRouter };

