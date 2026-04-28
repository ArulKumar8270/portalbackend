const express = require("express");
const { productFeedbackRouter } = require("./resources/feedback/productFeedback.router");
const { subscriptionRouter } = require("./resources/subcription/subcription.router");
const { adRouter } = require("./resources/ad/ad.router");
const { addressRouter } = require("./resources/address");
const authRouter = require("./resources/auth").authRouter;
const productRouter = require("./resources/product").productRouter;
const vendorRouter = require("./resources/vendor").vendorRouter;
const storerRouter = require("./resources/store").storeRouter;
const categoryRouter = require("./resources/category").categoryRouter;
const locationRouter = require("./resources/location").locationRouter;
const customerRouter = require("./resources/customer").customerRouter;
const orderRouter = require("./resources/order").orderRouter;
const paymentRouter = require("./resources/payment").paymentRouter;
const vendorStockRouter = require("./resources/vendorStock").vendorStockRouter;
const cartRouter = require("./resources/cart").cartRouter;
const requestStoreRouter =
  require("./resources/requestStores/index").requestStoreRouter;
const billingRouter = require("./resources/billing").billingRouter;
const inventoryRouter = require("./resources/inventory").inventoryRouter;
const subUserRouter = require("./resources/subUser").subUserRouter;
const invoiceFormatRouter = require("./resources/invoiceFormat").invoiceFormatRouter;
const { appRouter } = require("./resources/app/app.router");
const { shiprocketRouter } = require("./resources/shiprocket");

// Import authentication middleware
const { requireAuth } = require("../middleware/requireAuth");

const restRouter = express.Router();

// Apply global authentication middleware to all routes
// This ensures all APIs require a valid access token except public routes
restRouter.use(requireAuth);

// Define all routes
restRouter.use("/auth", authRouter);
restRouter.use("/customer", customerRouter);
restRouter.use("/location", locationRouter);
restRouter.use("/product", productRouter);
restRouter.use("/vendor", vendorRouter);
restRouter.use("/store", storerRouter);
restRouter.use("/category", categoryRouter);
restRouter.use("/order", orderRouter);
restRouter.use("/payment", paymentRouter);
restRouter.use("/vendorStock", vendorStockRouter);
restRouter.use("/cart", cartRouter);
restRouter.use("/requestStore", requestStoreRouter);
restRouter.use("/billing", billingRouter);
restRouter.use("/productFeedback", productFeedbackRouter);
restRouter.use("/subscription", subscriptionRouter);
restRouter.use("/ads", adRouter);
restRouter.use("/address", addressRouter);
restRouter.use("/inventory", inventoryRouter);
restRouter.use("/auth/sub-users", subUserRouter);
restRouter.use("/invoice-formats", invoiceFormatRouter);
restRouter.use("/shiprocket", shiprocketRouter);
restRouter.use("/app", appRouter);

module.exports = { restRouter };
