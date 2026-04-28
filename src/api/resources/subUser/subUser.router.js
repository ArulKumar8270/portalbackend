const express = require("express");
const subUserController = require("./subUser.controller");
const permissionController = require("./subUserMenuPermission.controller");
const { sanitize } = require("../../../middleware/sanitizer");
const { jwtStrategy } = require("../../../middleware/strategy");
const { requireAdmin } = require("../../../middleware/requireAuth");

const subUserRouter = express.Router();

// ============================================
// IMPORTANT: Route Ordering Rules
// ============================================
// 1. Specific routes (like /list, /create, /pending) come FIRST
// 2. Parameterized routes with paths (like /:subUserId/menu-permissions) come NEXT
// 3. Generic parameter routes (like /:id) come LAST
// ============================================

// Sub-user management routes (Vendor/Store only) - Specific routes first
subUserRouter
  .route("/list")
  .get(sanitize(), jwtStrategy, subUserController.getSubUsers);

subUserRouter
  .route("/create")
  .post(sanitize(), jwtStrategy, subUserController.createSubUser);

subUserRouter
  .route("/update/:id")
  .post(sanitize(), jwtStrategy, subUserController.updateSubUser);

subUserRouter
  .route("/delete/:id")
  .post(sanitize(), jwtStrategy, subUserController.deleteSubUser);

// Admin approval routes - MUST come before /:id route
// Otherwise /pending will match /:id with id="pending"
subUserRouter
  .route("/pending")
  .get(sanitize(), jwtStrategy, requireAdmin, subUserController.getPendingSubUsers);

subUserRouter
  .route("/approved")
  .get(sanitize(), jwtStrategy, subUserController.getApprovedSubUsers);

subUserRouter
  .route("/summary")
  .get(sanitize(), jwtStrategy, subUserController.getSubUsersSummary);

subUserRouter
  .route("/approve/:id")
  .post(sanitize(), jwtStrategy, requireAdmin, subUserController.approveSubUser);

subUserRouter
  .route("/reject/:id")
  .post(sanitize(), jwtStrategy, requireAdmin, subUserController.rejectSubUser);

// Menu permissions routes - MUST come before /:id route
// Otherwise /123/menu-permissions will match /:id first
subUserRouter
  .route("/:subUserId/menu-permissions")
  .get(
    (req, res, next) => {
      next();
    },
    sanitize(), 
    jwtStrategy, 
    permissionController.getSubUserMenuPermissions
  )
  .post(sanitize(), jwtStrategy, permissionController.updateSubUserMenuPermission);

subUserRouter
  .route("/:subUserId/menu-permissions/bulk")
  .post(sanitize(), jwtStrategy, permissionController.bulkUpdateSubUserMenuPermissions);

// Generic /:id route - MUST be last to avoid catching other routes
subUserRouter
  .route("/:id")
  .get(sanitize(), jwtStrategy, subUserController.getSubUserById);

module.exports = { subUserRouter };

