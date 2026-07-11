const express = require('express');
const { jwtStrategy, optionalJwtStrategy } = require('../../../middleware/strategy');
const controller = require('./rental.controller');

const rentalRouter = express.Router();

rentalRouter.get('/settings/:storeId', controller.getSettings);
rentalRouter.put('/settings/:storeId', jwtStrategy, controller.updateSettings);

rentalRouter.get('/catalog/public/:storeId', controller.listPublicCatalog);
rentalRouter.get('/products/:storeId', jwtStrategy, controller.listProducts);
rentalRouter.post('/products/link', jwtStrategy, controller.linkProduct);
rentalRouter.post('/products/unlink', jwtStrategy, controller.unlinkProduct);
rentalRouter.post('/catalog-items', jwtStrategy, controller.createCatalogItem);
rentalRouter.put('/catalog-items/:id', jwtStrategy, controller.updateCatalogItem);
rentalRouter.delete('/catalog-items/:id', jwtStrategy, controller.deleteCatalogItem);

rentalRouter.post('/bookings/quote', controller.quote);
rentalRouter.post('/bookings/:id/extend/quote', controller.quoteExtension);
rentalRouter.patch('/bookings/:id/extend', controller.extendBooking);
rentalRouter.post('/bookings', controller.createBooking);
rentalRouter.get('/bookings/customer', controller.listCustomerBookings);
rentalRouter.get('/bookings/:storeId', jwtStrategy, controller.listStoreBookings);
rentalRouter.get('/booking/:id', optionalJwtStrategy, controller.getBooking);

rentalRouter.patch('/bookings/:id/approve', jwtStrategy, controller.approveBooking);
rentalRouter.patch('/bookings/:id/reject', jwtStrategy, controller.rejectBooking);
rentalRouter.patch('/bookings/:id/cancel', controller.cancelBooking);
rentalRouter.patch('/bookings/:id/active', jwtStrategy, controller.markActive);
rentalRouter.patch('/bookings/:id/confirm-handover', controller.confirmHandover);
rentalRouter.patch('/bookings/:id/return-request', controller.requestReturn);
rentalRouter.patch('/bookings/:id/return-pickup', jwtStrategy, controller.markReturnPickup);
rentalRouter.patch('/bookings/:id/returned', jwtStrategy, controller.markReturned);
rentalRouter.patch('/bookings/:id/balance-payment', jwtStrategy, controller.recordBalancePayment);
rentalRouter.patch('/bookings/:id/damage-payment', jwtStrategy, controller.recordDamagePayment);
rentalRouter.patch('/bookings/:id/complete', jwtStrategy, controller.markCompleted);

rentalRouter.get('/overview/:storeId', jwtStrategy, controller.overview);
rentalRouter.get('/payments/:storeId', jwtStrategy, controller.listPayments);
rentalRouter.get('/reports/:storeId', jwtStrategy, controller.reports);
rentalRouter.get('/reports/:storeId/export', jwtStrategy, controller.exportReports);
rentalRouter.get('/reports/admin/all', jwtStrategy, controller.adminReports);
rentalRouter.get('/reports/admin/export', jwtStrategy, controller.exportAdminReports);

module.exports = { rentalRouter };
