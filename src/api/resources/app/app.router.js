const express = require("express");
const appController = require("./app.controller");

const appRouter = express.Router();

// Public: app version for update check (no auth)
appRouter.get("/version", appController.getVersion);

module.exports = { appRouter };
