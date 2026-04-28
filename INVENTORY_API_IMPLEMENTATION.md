# Inventory Management API Implementation

## Overview

This document describes the implementation of the Inventory Management System APIs based on the provided API documentation.

## Files Created

### 1. Database Models
- **`src/models/inboundTransaction.js`** - Model for inbound (purchase) transactions
- **`src/models/outboundTransaction.js`** - Model for outbound (sales) transactions

### 2. Controllers
- **`src/api/resources/inventory/inventory.controller.js`** - Contains all business logic for inventory operations

### 3. Routers
- **`src/api/resources/inventory/inventory.router.js`** - Defines all inventory API routes
- **`src/api/resources/inventory/index.js`** - Exports the router

### 4. Database Migrations
- **`src/migrations/20250115000000-create-inbound-transactions.js`** - Creates inboundTransactions table
- **`src/migrations/20250115000001-create-outbound-transactions.js`** - Creates outboundTransactions table

## Database Setup

### ✅ Migrations Completed

The database tables have been successfully created:

```bash
✅ 20250115000000-create-inbound-transactions.js - migrated
✅ 20250115000001-create-outbound-transactions.js - migrated
```

### Tables Created

1. **inboundTransactions** - Stores purchase/inbound transactions
   - Fields: id, vendorId, clientId, productId, categoryId, quantity, invoiceNumber, invoice, date, referenceNumber, notes, createdAt, updatedAt
   - Indexes: vendorId, productId, clientId, date
   - Foreign Keys: Defined in Sequelize models (vendor, user, product, category)

2. **outboundTransactions** - Stores sales/outbound transactions
   - Fields: id, vendorId, productId, quantity, orderId, date, notes, createdAt, updatedAt
   - Indexes: vendorId, productId, orderId, date
   - Foreign Keys: Defined in Sequelize models (vendor, product, orders)

**Note:** Foreign key relationships are handled at the Sequelize model level rather than database constraints. This allows for more flexibility and avoids constraint conflicts during migration.

## API Endpoints

All endpoints are prefixed with `/api/inventory` and require authentication via JWT token.

**Important:** The backend automatically extracts the **vendor/store ID** from the authenticated user's session. The frontend should **NOT** pass `vendorId` or `storeId` in URLs or request bodies. All inventory operations are automatically scoped to the logged-in user's store/vendor.

### Inventory Summary
- **GET** `/api/inventory/summary` - Get inventory summary statistics (vendor/store ID from authenticated user)

### Inbound Transactions
- **GET** `/api/inventory/inbound` - Get all inbound transactions (with optional filters, vendor/store ID from authenticated user)
- **POST** `/api/inventory/inbound` - Create new inbound transaction (vendor/store ID from authenticated user)
- **POST** `/api/inventory/inbound/update` - Update existing inbound transaction (with ownership verification)
- **DELETE** `/api/inventory/inbound/:id` - Delete inbound transaction (with ownership verification)

### Outbound Transactions
- **GET** `/api/inventory/outbound` - Get all outbound transactions (with optional filters, vendor/store ID from authenticated user)
- **POST** `/api/inventory/outbound` - Create new outbound transaction (vendor/store ID from authenticated user)
- **POST** `/api/inventory/outbound/update` - Update existing outbound transaction (with ownership verification)
- **DELETE** `/api/inventory/outbound/:id` - Delete outbound transaction (with ownership verification)

### Vendor Statistics
- **GET** `/api/inventory/vendor-stats` - Get detailed vendor inventory statistics (vendor/store ID from authenticated user)

## Features Implemented

### Security
- **Automatic Vendor/Store ID Extraction**: Vendor/store ID is automatically extracted from the authenticated user's JWT token
- **Ownership Verification**: Users can only access/modify transactions belonging to their own store/vendor
- **Access Control**: Returns 403 Forbidden if user tries to access data outside their scope
- **Priority Logic**: Uses `vendorId` first, then falls back to `storeId` if vendorId is not available

### Validation
- Date validation (cannot be future, cannot be before 2000)
- Quantity validation (1-999999)
- Invoice number format validation (alphanumeric, hyphens, underscores, slashes, 3-50 chars)
- Reference number length validation (max 100 chars)
- Notes length validation (max 500 chars)
- Required field validation

### Filtering
- Date range filtering (startDate, endDate)
- Product filtering
- Client filtering (for inbound)
- Order filtering (for outbound)

### Associations
- Inbound transactions include: vendor, client (user), product, category
- Outbound transactions include: vendor, product, order

### Statistics
- Total inbound/outbound counts
- Current stock calculation (inbound - outbound)
- Low stock alerts
- Vendor-specific statistics

## Usage Examples

### Get Inventory Summary
```bash
GET /api/inventory/summary
Authorization: Bearer <token>
```
**Note:** Vendor/store ID is automatically extracted from the authenticated user's token.

### Add Inbound Transaction
```bash
POST /api/inventory/inbound
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": 789,
  "quantity": 50,
  "invoiceNumber": "INV-2024-001",
  "invoice": "uploads/invoices/inv-2024-001.pdf",
  "date": "2024-01-15",
  "clientId": 456,
  "referenceNumber": "REF-001",
  "notes": "Initial stock purchase"
}
```
**Note:** `vendorId` is NOT required in the request body. It is automatically extracted from the authenticated user's token.

### Get Inbound Transactions with Filters
```bash
GET /api/inventory/inbound?startDate=2024-01-01&endDate=2024-12-31&productId=789
Authorization: Bearer <token>
```
**Note:** Vendor/store ID is automatically extracted from the authenticated user's token. Only transactions belonging to the user's store/vendor are returned.

## Notes

1. **Authentication**: All endpoints require JWT authentication via `jwtStrategy` middleware
2. **Vendor/Store ID**: The backend automatically extracts vendor/store ID from `req.user.vendorId` or `req.user.storeId` (priority: vendorId first)
3. **Security**: Users can only access/modify transactions belonging to their own store/vendor. Ownership is verified before update/delete operations.
4. **Sanitization**: All endpoints use `sanitize()` middleware for input sanitization
5. **Error Handling**: All endpoints return consistent error responses
6. **Date Format**: Dates should be in YYYY-MM-DD format (DATEONLY)
7. **File Uploads**: Invoice files must be uploaded first using `/api/auth/upload-file` endpoint
8. **Stock Calculation**: Current stock is calculated as sum of inbound - sum of outbound transactions
9. **Model Names**: Uses `inboundTransactions` and `outboundTransactions` (plural) consistently

## Testing

After running migrations, you can test the APIs using:

1. Postman
2. cURL commands
3. Frontend application

## Next Steps

1. Run database migrations to create tables
2. Test all endpoints
3. Integrate with frontend
4. Add additional validations if needed
5. Add pagination if required for large datasets

## Troubleshooting

### Model Not Found Errors
- Ensure models are properly loaded in `src/models/index.js`
- Check that model names match (inboundTransactions, outboundTransactions)

### Association Errors
- Verify that related models (vendor, user, product, category, orders) exist
- Check foreign key constraints in migrations

### Route Not Found
- Verify that inventory router is registered in `src/api/index.js`
- Check that route path matches: `/api/inventory/*`

