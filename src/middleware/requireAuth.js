/**
 * Global Authentication Middleware
 * Requires valid access token for all API routes except public endpoints
 */

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
];

/**
 * Check if a route is public (doesn't require authentication)
 */
const isPublicRoute = (path, method) => {
  // Normalize path (remove query params, trailing slashes)
  const normalizedPath = path.split('?')[0].replace(/\/$/, '');
  
  // Check exact match
  if (PUBLIC_ROUTES.includes(normalizedPath)) {
    return true;
  }
  
  // Check pattern matches (for routes with parameters)
  // Example: /api/auth/user/:id should match /api/auth/user/123
  for (const publicRoute of PUBLIC_ROUTES) {
    // Convert route pattern to regex
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
  // Check cookie
  if (req.cookies && req.cookies['XSRF-token']) {
    return true;
  }
  
  // Check Authorization header
  if (req.headers && req.headers['authorization']) {
    return true;
  }
  
  return false;
};

/**
 * Global authentication middleware
 * Requires valid JWT token for all routes except public ones
 */
exports.requireAuth = (req, res, next) => {
  // Check if route is public
  if (isPublicRoute(req.path, req.method)) {
    return next(); // Skip authentication for public routes
  }

  // Check if token is provided
  if (!hasToken(req)) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please provide a valid access token in cookie (XSRF-token) or Authorization header.',
      error: 'UNAUTHORIZED',
    });
  }

  // For all other routes, require authentication
  // Use the existing jwtStrategy which validates tokens from cookies or Authorization header
  jwtStrategy(req, res, (err) => {
    // jwtStrategy handles errors and sends responses for expired/invalid tokens
    // If there's an error, jwtStrategy already sent a response, so we don't need to do anything
    if (err) {
      return; // Error response already sent by jwtStrategy
    }
    
    // If no user is set after jwtStrategy, token is invalid
    if (!req.user) {
      // Check if response was already sent (jwtStrategy might have sent it)
      if (res.headersSent) {
        return;
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired access token. Please login again.',
        error: 'UNAUTHORIZED',
      });
    }
    
    // User is authenticated, proceed
    next();
  });
};

/**
 * Optional authentication middleware
 * Sets req.user if token is valid, but doesn't block if token is missing
 */
exports.optionalAuth = (req, res, next) => {
  jwtStrategy(req, res, () => {
    // Continue even if authentication fails
    next();
  });
};

/**
 * Admin authorization middleware
 * Requires user to be authenticated and have admin role (role === '0' or role === 0)
 * Must be used after authentication middleware (jwtStrategy or requireAuth)
 */
exports.requireAdmin = (req, res, next) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please login first.',
      error: 'UNAUTHORIZED',
    });
  }

  // Check if user has admin role
  // Role can be string '0' or number 0
  const userRole = req.user.role;
  if (userRole !== '0' && userRole !== 0) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
      error: 'FORBIDDEN',
    });
  }

  // User is authenticated and is an admin, proceed
  next();
};
