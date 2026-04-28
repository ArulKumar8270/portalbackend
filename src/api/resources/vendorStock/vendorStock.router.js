const express = require("express");
const vendorStockController = require("./vendorStock.controller");

const vendorStockRouter = express.Router();
vendorStockRouter.post("/", vendorStockController.addVendorStock);
vendorStockRouter.get("/", vendorStockController.getVendorStock);
vendorStockRouter.get("/:id", vendorStockController.getVendorStockById);
vendorStockRouter.put("/", vendorStockController.updateVendorStock);
vendorStockRouter.delete("/:id", vendorStockController.vendorStockDelete);

module.exports = { vendorStockRouter };
