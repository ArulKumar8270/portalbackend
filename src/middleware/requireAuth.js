/**
 * Global Authentication Middleware
 * Requires valid access token for all API routes except public endpoints
 */

const JWT = require('jsonwebtoken');
const config = require('../config');
const { jwtStrategy } = require('./strategy');

/**
 * Public routes that don't require authentication
 * Add routes here that should be accessible without token
 * Note: Paths are relative to the router mount point (/api)
 */
const PUBLIC_ROUTES = [
  // Auth routes
  '/auth/register',
  '/auth/user/update',
  '/auth/user/:id',
  '/auth/rootLogin',
  '/auth/upload-file',

  // Customer routes
  '/customer/register',
  '/customer/login',
  '/customer/getUserByEmailId',

  // Category routes
  '/category/getAllCategory',
  '/category/getAllSubCategory',
  '/category/getAllSubChildCategory',
  '/category/list',
  '/category/mobile/getAllCategory',
  '/category/mobile/getAllSubCategoryById',

  // Location routes
  '/location/list',
  '/location/area/list',

  // Store routes
  '/store/create',
  '/store/list',
  '/store/service/list',
  '/store/list/:id',
  '/store/product-list',
  '/store/product/getAllProductById/:id',
  '/store/filterByCategory',
  '/store/service/filterByCategory',
  '/store/getAllStoresByFilters',
  '/store/service/getAllStoresByFilters',
  '/store/getOpenStores',
  '/store/visit',
  '/store/visit/reports',

  // Product routes
  '/product/add',
  '/product/getAllproduct',
  '/product/getAllproductList',
  '/product/getProductsByOpenStores',
  '/product/getProductByCategory',
  '/product/getProductById/:id',
  '/product/getWebProductById/:id',
  '/product/getAllProductOffer',
  '/product/getAllPhoto',
  '/product/getAllGroceryStaple',
  '/product/list/:slug',
  '/product/getAllByCategory',
  '/product/getallProductbySubChildCat',
  '/product/gcatalogsearch/result',
  '/product/search_product',
  '/product/aws/delete/photo',

  // Order routes
  '/order/create',
  '/order/list/:id',
  '/order/store/list/:id',

  // Cart routes
  '/cart/create',
  '/cart/list/:orderId',
  '/cart/list/:orderId/:productId',
  '/cart/update/:orderId/:productId',
  '/cart/delete/:orderId/:productId',

  // Address routes
  '/address/create',
  '/address/:id',
  '/address/list/:custId',
  '/address/update/:id',
  '/address/delete/:id',

  // VendorStock routes (all routes)
  '/vendorStock',
  '/vendorStock/:id',

  // ProductFeedback routes
  '/productFeedback/list/:id',

  // RequestStore routes
  '/requestStore/add',

  // Payment routes
  '/payment/orders',

  // Subscription routes
  '/subscription/:id',

  // Ad routes
  '/ads',
  '/ads/:id',

  // App version (update check)
  '/app/version',

  // One-day delivery (public + employee-auth handled on route)
  '/one-day/settings/:storeId',
  '/one-day/products/public/:storeId',
  '/one-day/orders/quote',
  '/one-day/employee/login',
  '/one-day/employee/orders',
  '/one-day/employee/orders/history',
  '/one-day/employee/orders/:id',
  '/one-day/employee/location',
  '/one-day/orders/:id/payment-photo',
  '/one-day/orders/:id/complete',
  '/one-day/orders/:id/track',
  '/one-day/orders/:id/cancel',
  '/one-day/orders/:id/request-refund',
  '/one-day/tracking/order/:orderId',
  '/order/:id/cancel',
  '/order/:id/request-refund',

  // Rental store (public)
  '/rental/settings/:storeId',
  '/rental/catalog/public/:storeId',
  '/rental/bookings/quote',
  '/rental/bookings',
  '/rental/bookings/customer',
  '/rental/booking/:id',
  '/rental/bookings/:id/cancel',
  '/rental/bookings/:id/confirm-handover',
  '/rental/bookings/:id/return-request',
  '/rental/bookings/:id/extend/quote',
  '/rental/bookings/:id/extend',
];

/**
 * Check if a route is public (doesn't require authentication)
 */
const isPublicRoute = (path, method) => {
  // Normalize path (remove query params, trailing slashes, /api prefix)
  let normalizedPath = path.split('?')[0].replace(/\/$/, '');
  if (normalizedPath.startsWith('/api/')) {
    normalizedPath = normalizedPath.slice(4);
  } else if (normalizedPath === '/api') {
    normalizedPath = '/';
  }

  // Check exact match
  if (PUBLIC_ROUTES.includes(normalizedPath)) {
    return true;
  }

  // Check pattern matches (for routes with parameters)
  for (const publicRoute of PUBLIC_ROUTES) {
    const routePattern = publicRoute.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${routePattern}$`);
    if (regex.test(normalizedPath)) {
      return true;
    }
  }

  return false;
};

/**
 * Check if token exists in request
 */
const hasToken = (req) => {
  if (req.cookies && req.cookies['XSRF-token']) {
    return true;
  }

  if (req.headers && req.headers['authorization']) {
    return true;
  }

  return false;
};

/**
 * Employee JWTs use standard Unix-second `exp` and `iam: 'employee'`.
 * The store/user passport strategy mis-reads that as expired and blocks riders.
 * Let route-level employeeAuth / storeOrEmployeeAuth validate instead.
 */
function tryAttachEmployee(req) {
  const auth = req.headers.authorization || '';
  if (!auth.toLowerCase().startsWith('bearer ')) return false;
  try {
    const decoded = JWT.verify(auth.slice(7).trim(), config.app.secret);
    if (String(decoded.iam) !== 'employee') return false;
    const id = Number(decoded.sub);
    const storeId = Number(decoded.storeId);
    if (!Number.isFinite(id) || id <= 0) return false;
    req.employee = {
      id,
      storeId: Number.isFinite(storeId) && storeId > 0 ? storeId : null,
    };
    return true;
  } catch {
    return false;
  }
}

/**
 * Global authentication middleware
 * Requires valid JWT token for all routes except public ones
 */
exports.requireAuth = (req, res, next) => {
  // Check if route is public
  if (isPublicRoute(req.path, req.method)) {
    return next();
  }

  // Employee bearer tokens skip user-jwt passport (validated on the route)
  if (tryAttachEmployee(req)) {
    return next();
  }

  // Check if token is provided
  if (!hasToken(req)) {
    return res.status(401).json({
      success: false,
      message:
        'Authentication required. Please provide a valid access token in cookie (XSRF-token) or Authorization header.',
      error: 'UNAUTHORIZED',
    });
  }

  // For all other routes, require authentication
  jwtStrategy(req, res, (err) => {
    if (err) {
      return;
    }

    if (!req.user) {
      if (res.headersSent) {
        return;
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid or expired access token. Please login again.',
        error: 'UNAUTHORIZED',
      });
    }

    next();
  });
};

/**
 * Optional authentication middleware
 * Sets req.user if token is valid, but doesn't block if token is missing
 */
exports.optionalAuth = (req, res, next) => {
  if (tryAttachEmployee(req)) {
    return next();
  }
  jwtStrategy(req, res, () => {
    next();
  });
};

/**
 * Admin authorization middleware
 * Requires user to be authenticated and have admin role (role === '0' or role === 0)
 * Must be used after authentication middleware (jwtStrategy or requireAuth)
 */
exports.requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please login first.',
      error: 'UNAUTHORIZED',
    });
  }

  const userRole = req.user.role;
  if (userRole !== '0' && userRole !== 0) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
      error: 'FORBIDDEN',
    });
  }

  next();
};
