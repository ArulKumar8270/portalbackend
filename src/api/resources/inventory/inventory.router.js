const express = require("express");
const inventoryController = require("./inventory.controller");
const { sanitize } = require("../../../middleware/sanitizer");
const { jwtStrategy } = require("../../../middleware/strategy");

const inventoryRouter = express.Router();

// Inventory Summary
// Note: vendorId is automatically extracted from authenticated user's session
inventoryRouter
  .route("/summary")
  .get(sanitize(), jwtStrategy, inventoryController.getInventorySummary);

// Inbound Transactions
// Note: vendorId is automatically extracted from authenticated user's session
inventoryRouter
  .route("/inbound")
  .get(sanitize(), jwtStrategy, inventoryController.getInboundTransactions)
  .post(sanitize(), jwtStrategy, inventoryController.addInboundTransaction);

inventoryRouter
  .route("/inbound/update")
  .post(sanitize(), jwtStrategy, inventoryController.updateInboundTransaction);

inventoryRouter
  .route("/inbound/:id")
  .delete(sanitize(), jwtStrategy, inventoryController.deleteInboundTransaction);

// Outbound Transactions
// Note: vendorId is automatically extracted from authenticated user's session
inventoryRouter
  .route("/outbound")
  .get(sanitize(), jwtStrategy, inventoryController.getOutboundTransactions)
  .post(sanitize(), jwtStrategy, inventoryController.addOutboundTransaction);

inventoryRouter
  .route("/outbound/update")
  .post(sanitize(), jwtStrategy, inventoryController.updateOutboundTransaction);

inventoryRouter
  .route("/outbound/:id")
  .delete(sanitize(), jwtStrategy, inventoryController.deleteOutboundTransaction);

// Vendor Inventory Statistics
// Note: vendorId is automatically extracted from authenticated user's session
inventoryRouter
  .route("/vendor-stats")
  .get(sanitize(), jwtStrategy, inventoryController.getVendorInventoryStats);

// ========== CLIENT MANAGEMENT APIs ==========
// Get all clients and create client
inventoryRouter
  .route("/clients")
  .get(sanitize(), jwtStrategy, inventoryController.getClients)
  .post(
    (req, res, next) => {
      console.log("========== POST /clients ROUTE HIT ==========");
      console.log("Route middleware executing...");
      next();
    },
    sanitize(), 
    jwtStrategy, 
    (req, res, next) => {
      console.log("========== BEFORE createClient CONTROLLER ==========");
      console.log("jwtStrategy passed, calling createClient...");
      next();
    },
    inventoryController.createClient
  );

// Update client (alternative route)
inventoryRouter
  .route("/clients/update")
  .post(sanitize(), jwtStrategy, inventoryController.updateClient);

// Get, update, or delete client by ID
inventoryRouter
  .route("/clients/:id")
  .get(sanitize(), jwtStrategy, inventoryController.getClientById)
  .put(sanitize(), jwtStrategy, inventoryController.updateClient)
  .delete(sanitize(), jwtStrategy, inventoryController.deleteClient);

// ========== INVENTORY PRODUCTS APIs ==========
// Note: vendorId/storeId is automatically extracted from authenticated user's session
inventoryRouter
  .route("/products")
  .get(sanitize(), jwtStrategy, inventoryController.getInventoryProducts)
  .post(sanitize(), jwtStrategy, inventoryController.createInventoryProduct);

inventoryRouter
  .route("/products/update")
  .post(sanitize(), jwtStrategy, inventoryController.updateInventoryProduct);

inventoryRouter
  .route("/products/:id")
  .get(sanitize(), jwtStrategy, inventoryController.getInventoryProductById)
  .put(sanitize(), jwtStrategy, inventoryController.updateInventoryProduct)
  .delete(sanitize(), jwtStrategy, inventoryController.deleteInventoryProduct);

module.exports = { inventoryRouter };

