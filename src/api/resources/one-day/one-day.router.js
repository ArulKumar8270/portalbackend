const express = require('express');
const { jwtStrategy } = require('../../../middleware/strategy');
const { requireAdmin } = require('../../../middleware/requireAuth');
const JWT = require('jsonwebtoken');
const config = require('../../../config');
const controller = require('./one-day.controller');

const oneDayRouter = express.Router();

/** Employee JWT from Authorization header */
function employeeAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'Token required' });
  try {
    const decoded = JWT.verify(token, config.app.secret);
    if (String(decoded.iam) !== 'employee') {
      return res.status(403).json({ success: false, message: 'Employee token required' });
    }
    req.employee = { id: decoded.sub, storeId: decoded.storeId };
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

// Settings
oneDayRouter.get('/settings/:storeId', controller.getSettings);
oneDayRouter.put('/settings/:storeId', jwtStrategy, controller.updateSettings);

// Products
oneDayRouter.get('/products/public/:storeId', controller.listProducts);
oneDayRouter.get('/products/:storeId', jwtStrategy, controller.listProducts);

// Quote
oneDayRouter.post('/orders/quote', controller.quote);

// Employees
oneDayRouter.post('/employees', jwtStrategy, controller.createEmployee);
oneDayRouter.put('/employees/:id', jwtStrategy, controller.updateEmployee);
oneDayRouter.get('/employees/:storeId', jwtStrategy, controller.listEmployees);
oneDayRouter.delete('/employees/:id', jwtStrategy, controller.trashEmployee);
oneDayRouter.patch('/employees/:id/duty', jwtStrategy, controller.toggleDuty);

// Employee mobile
oneDayRouter.post('/employee/login', controller.employeeLogin);
oneDayRouter.get('/employee/orders', employeeAuth, controller.employeeOrders);
oneDayRouter.get('/employee/orders/:id', employeeAuth, controller.employeeOrderDetail);
oneDayRouter.post('/employee/location', employeeAuth, controller.employeeLocation);

// Orders (store)
oneDayRouter.get('/overview/:storeId', jwtStrategy, controller.overview);
oneDayRouter.get('/orders/:storeId', jwtStrategy, controller.listOrders);
oneDayRouter.patch('/orders/:id/assign', jwtStrategy, controller.assignOrder);
function storeOrEmployeeAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) {
    try {
      const decoded = JWT.verify(auth.slice(7), config.app.secret);
      if (String(decoded.iam) === 'employee') {
        req.employee = { id: decoded.sub, storeId: decoded.storeId };
        return next();
      }
    } catch {
      /* fall through to store JWT */
    }
  }
  return jwtStrategy(req, res, next);
}

oneDayRouter.patch('/orders/:id/status', storeOrEmployeeAuth, controller.updateStatus);
oneDayRouter.post('/orders/:id/payment-photo', employeeAuth, controller.savePaymentPhoto);
oneDayRouter.post('/orders/:id/send-otp', storeOrEmployeeAuth, controller.sendOtp);
oneDayRouter.get('/orders/:id/delivery-otp', jwtStrategy, controller.getCustomerDeliveryOtp);
oneDayRouter.post('/orders/:id/complete', employeeAuth, controller.completeOrder);
oneDayRouter.post('/orders/:id/complete-store', jwtStrategy, controller.completeOrder);
oneDayRouter.patch('/orders/:id/cancel', jwtStrategy, controller.cancelOrder);
oneDayRouter.post('/orders/:id/request-refund', jwtStrategy, controller.requestRefund);
oneDayRouter.get('/orders/:id/track', controller.trackOrder);

// Tracking
oneDayRouter.get('/tracking/:storeId/live', jwtStrategy, controller.liveTracking);
oneDayRouter.get('/tracking/order/:orderId', controller.trackOrderLive);

// Reports (admin routes before :storeId)
oneDayRouter.get('/reports/admin/all', jwtStrategy, requireAdmin, controller.adminReports);
oneDayRouter.get('/reports/admin/export', jwtStrategy, requireAdmin, controller.exportAdminReport);
oneDayRouter.get('/reports/:storeId/export', jwtStrategy, controller.exportStoreReport);
oneDayRouter.get('/reports/:storeId', jwtStrategy, controller.reports);

// Payments
oneDayRouter.get('/payments/:storeId', jwtStrategy, controller.listPaymentHistory);
oneDayRouter.patch('/payments/:orderId/refund', jwtStrategy, controller.updateRefundStatus);

module.exports = { oneDayRouter };
