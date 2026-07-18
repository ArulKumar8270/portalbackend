const express = require('express');
const controller = require('./order.controller');
const { jwtStrategy } = require('../../../middleware/strategy');

const orderRouter = express.Router();

orderRouter.post('/create', controller.index);
orderRouter.post('/status/update', jwtStrategy, controller.statusUpdate);
orderRouter.get('/list/:id', controller.getAllOrderListById);
orderRouter.get('/store/list/:id', controller.getStoreOrderList);
orderRouter.patch('/:id/cancel', controller.cancelOrder);
orderRouter.post('/:id/request-refund', controller.requestRefund);

module.exports = orderRouter;
