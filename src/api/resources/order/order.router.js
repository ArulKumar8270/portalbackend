const express = require('express');
const controller = require('./order.controller');

const orderRouter = express.Router();

orderRouter.patch('/:id/cancel', controller.cancelOrder);
orderRouter.post('/:id/request-refund', controller.requestRefund);

module.exports = orderRouter;
