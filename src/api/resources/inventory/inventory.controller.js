const { Op } = require("sequelize");
const db = require("../../../models");

/**
 * Helper function to extract vendor/store ID from authenticated user
 * Priority: vendorId > storeId
 * Returns null if neither is available
 */
const getVendorStoreId = (user) => {
  if (!user) {
    return null;
  }
  
  // Convert to number if it's a string
  const vendorId = user.vendorId ? (isNaN(user.vendorId) ? null : parseInt(user.vendorId)) : null;
  const storeId = user.storeId ? (isNaN(user.storeId) ? null : parseInt(user.storeId)) : null;
  
  // Priority: vendorId first, then storeId
  return vendorId || storeId || null;
};

/**
 * Helper function to verify that a transaction belongs to the authenticated user's vendor/store
 */
const verifyTransactionOwnership = async (transaction, userVendorStoreId) => {
  if (!transaction) {
    return false;
  }
  
  // Check if transaction's vendorId matches user's vendor/store ID
  return transaction.vendorId === userVendorStoreId;
};

module.exports = {
  // Get Inventory Summary
  async getInventorySummary(req, res, next) {
    try {
      const vendorStoreId = getVendorStoreId(req.user);

      if (!vendorStoreId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Vendor or Store ID not found in your account.",
        });
      }

      // Get total inbound transactions
      const totalInbound = await db.inboundTransactions.count({
        where: { vendorId: vendorStoreId },
      });

      // Get total outbound transactions
      const totalOutbound = await db.outboundTransactions.count({
        where: { vendorId: vendorStoreId },
      });

      // Calculate current stock (sum of inbound - sum of outbound)
      const inboundSum = await db.inboundTransactions.sum("quantity", {
        where: { vendorId: vendorStoreId },
      });

      const outboundSum = await db.outboundTransactions.sum("quantity", {
        where: { vendorId: vendorStoreId },
      });

      const currentStock = (inboundSum || 0) - (outboundSum || 0);

      // Get low stock alerts (products with stock below threshold)
      const lowStockAlerts = await db.product.count({
        where: {
          createdId: vendorStoreId,
          qty: {
            [Op.lt]: 10, // Assuming 10 is the low stock threshold
          },
        },
      });

      return res.status(200).json({
        success: true,
        data: {
          totalInbound,
          currentStock,
          lowStockAlerts,
        },
      });
    } catch (error) {
      console.error("Error fetching inventory summary:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch inventory summary",
        error: error.message,
      });
    }
  },

  // Get Inbound Transactions
  async getInboundTransactions(req, res, next) {
    try {
      const vendorStoreId = getVendorStoreId(req.user);
      const { startDate, endDate, productId, clientId } = req.query;

      if (!vendorStoreId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Vendor or Store ID not found in your account.",
        });
      }

      const whereClause = { vendorId: vendorStoreId };

      // Add date filter
      if (startDate || endDate) {
        whereClause.date = {};
        if (startDate) {
          whereClause.date[Op.gte] = startDate;
        }
        if (endDate) {
          whereClause.date[Op.lte] = endDate;
        }
      }

      // Add product filter
      if (productId) {
        whereClause.productId = parseInt(productId);
      }

      // Add client filter
      if (clientId) {
        whereClause.clientId = parseInt(clientId);
      }

      const transactions = await db.inboundTransactions.findAll({
        where: whereClause,
        include: [
          {
            model: db.user,
            as: "client",
            attributes: ["id", "firstName", "lastName", "email", "phone", "address"],
            required: false,
          },
          {
            model: db.product,
            as: "product",
            attributes: [
              "id",
              "name",
              "slug",
              "brand",
              "unitSize",
              "price",
              "buyerPrice",
              "qty",
              "discountPer",
              "discount",
              "total",
              "netPrice",
              "photo",
              "sortDesc",
              "desc",
              "status",
              "categoryId",
              "subCategoryId",
              "childCategoryId",
              "paymentMode",
              "createdId",
              "createdType",
              "isEnableEcommerce",
              "isEnableCustomize",
              "isBooking",
              "serviceType",
              "grandTotal",
              "size",
              "weight",
              "sizeUnitSizeMap",
            ],
            required: false,
          },
          {
            model: db.category,
            as: "category",
            attributes: ["id", "name"],
            required: false,
          },
        ],
        order: [["date", "DESC"], ["createdAt", "DESC"]],
      });

      return res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      console.error("Error fetching inbound transactions:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch inbound transactions",
        error: error.message,
      });
    }
  },

  // Add Inbound Transaction
  async addInboundTransaction(req, res, next) {
    try {
      const vendorStoreId = getVendorStoreId(req.user);

      if (!vendorStoreId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Vendor or Store ID not found in your account.",
        });
      }

      const {
        clientId,
        productId,
        categoryId,
        quantity,
        invoiceNumber,
        invoice,
        date,
        referenceNumber,
        notes,
      } = req.body;

      // Validation
      if (!productId || !quantity || !invoiceNumber || !invoice || !date) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
          errors: {
            productId: !productId ? "Product ID is required" : undefined,
            quantity: !quantity ? "Quantity is required" : undefined,
            invoiceNumber: !invoiceNumber ? "Invoice number is required" : undefined,
            invoice: !invoice ? "Invoice file is required" : undefined,
            date: !date ? "Date is required" : undefined,
          },
        });
      }

      // Validate date (cannot be future, cannot be before 2000)
      const transactionDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const year2000 = new Date("2000-01-01");

      if (transactionDate > today) {
        return res.status(400).json({
          success: false,
          message: "Date cannot be in the future",
        });
      }

      if (transactionDate < year2000) {
        return res.status(400).json({
          success: false,
          message: "Date cannot be before 2000",
        });
      }

      // Validate quantity
      const quantityNum = parseInt(quantity);
      if (isNaN(quantityNum) || quantityNum < 1 || quantityNum > 999999) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be between 1 and 999999",
        });
      }

      // Validate invoice number format
      const invoiceNumberRegex = /^[a-zA-Z0-9\-_\/]+$/;
      if (!invoiceNumberRegex.test(invoiceNumber) || invoiceNumber.length < 3 || invoiceNumber.length > 50) {
        return res.status(400).json({
          success: false,
          message: "Invoice number must be 3-50 characters and contain only alphanumeric characters, hyphens, underscores, and slashes",
        });
      }

      // Validate reference number if provided
      if (referenceNumber && referenceNumber.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Reference number must not exceed 100 characters",
        });
      }

      // Validate notes if provided
      if (notes && notes.length > 500) {
        return res.status(400).json({
          success: false,
          message: "Notes must not exceed 500 characters",
        });
      }

      const transaction = await db.inboundTransactions.create({
        vendorId: vendorStoreId,
        clientId: clientId ? parseInt(clientId) : null,
        productId: parseInt(productId),
        categoryId: categoryId ? parseInt(categoryId) : null,
        quantity: quantityNum,
        invoiceNumber,
        invoice,
        date,
        referenceNumber: referenceNumber || null,
        notes: notes || null,
      });

      return res.status(200).json({
        success: true,
        message: "Inbound transaction added successfully",
        data: transaction,
      });
    } catch (error) {
      console.error("Error adding inbound transaction:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to add inbound transaction",
        error: error.message,
      });
    }
  },

  // Update Inbound Transaction
  async updateInboundTransaction(req, res, next) {
    try {
      const vendorStoreId = getVendorStoreId(req.user);

      if (!vendorStoreId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Vendor or Store ID not found in your account.",
        });
      }

      const {
        id,
        clientId,
        productId,
        categoryId,
        quantity,
        invoiceNumber,
        invoice,
        date,
        referenceNumber,
        notes,
      } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Transaction ID is required",
        });
      }

      // Find transaction and verify ownership
      const transaction = await db.inboundTransactions.findOne({
        where: { id },
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }

      // Security check: Verify transaction belongs to user's vendor/store
      if (!(await verifyTransactionOwnership(transaction, vendorStoreId))) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only modify transactions belonging to your store/vendor.",
        });
      }

      // Validate date if provided
      if (date) {
        const transactionDate = new Date(date);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const year2000 = new Date("2000-01-01");

        if (transactionDate > today) {
          return res.status(400).json({
            success: false,
            message: "Date cannot be in the future",
          });
        }

        if (transactionDate < year2000) {
          return res.status(400).json({
            success: false,
            message: "Date cannot be before 2000",
          });
        }
      }

      // Validate quantity if provided
      if (quantity !== undefined) {
        const quantityNum = parseInt(quantity);
        if (isNaN(quantityNum) || quantityNum < 1 || quantityNum > 999999) {
          return res.status(400).json({
            success: false,
            message: "Quantity must be between 1 and 999999",
          });
        }
      }

      // Validate invoice number if provided
      if (invoiceNumber) {
        const invoiceNumberRegex = /^[a-zA-Z0-9\-_\/]+$/;
        if (!invoiceNumberRegex.test(invoiceNumber) || invoiceNumber.length < 3 || invoiceNumber.length > 50) {
          return res.status(400).json({
            success: false,
            message: "Invoice number must be 3-50 characters and contain only alphanumeric characters, hyphens, underscores, and slashes",
          });
        }
      }

      // Validate reference number if provided
      if (referenceNumber && referenceNumber.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Reference number must not exceed 100 characters",
        });
      }

      // Validate notes if provided
      if (notes && notes.length > 500) {
        return res.status(400).json({
          success: false,
          message: "Notes must not exceed 500 characters",
        });
      }

      // Update transaction (vendorId cannot be changed)
      await db.inboundTransactions.update(
        {
          clientId: clientId !== undefined ? (clientId ? parseInt(clientId) : null) : transaction.clientId,
          productId: productId ? parseInt(productId) : transaction.productId,
          categoryId: categoryId !== undefined ? (categoryId ? parseInt(categoryId) : null) : transaction.categoryId,
          quantity: quantity !== undefined ? parseInt(quantity) : transaction.quantity,
          invoiceNumber: invoiceNumber || transaction.invoiceNumber,
          invoice: invoice || transaction.invoice,
          date: date || transaction.date,
          referenceNumber: referenceNumber !== undefined ? referenceNumber : transaction.referenceNumber,
          notes: notes !== undefined ? notes : transaction.notes,
        },
        {
          where: { id },
        }
      );

      const updatedTransaction = await db.inboundTransactions.findOne({
        where: { id },
      });

      return res.status(200).json({
        success: true,
        message: "Inbound transaction updated successfully",
        data: updatedTransaction,
      });
    } catch (error) {
      console.error("Error updating inbound transaction:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update inbound transaction",
        error: error.message,
      });
    }
  },

  // Delete Inbound Transaction
  async deleteInboundTransaction(req, res, next) {
    try {
      const vendorStoreId = getVendorStoreId(req.user);

      if (!vendorStoreId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Vendor or Store ID not found in your account.",
        });
      }

      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Transaction ID is required",
        });
      }

      // Find transaction and verify ownership
      const transaction = await db.inboundTransactions.findOne({
        where: { id },
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }

      // Security check: Verify transaction belongs to user's vendor/store
      if (!(await verifyTransactionOwnership(transaction, vendorStoreId))) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only delete transactions belonging to your store/vendor.",
        });
      }

      await db.inboundTransactions.destroy({
        where: { id },
      });

      return res.status(200).json({
        success: true,
        message: "Transaction deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting inbound transaction:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete transaction",
        error: error.message,
      });
    }
  },

  // Get Outbound Transactions
  async getOutboundTransactions(req, res, next) {
    try {
      const vendorStoreId = getVendorStoreId(req.user);
      const { startDate, endDate, productId, orderId } = req.query;

      if (!vendorStoreId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Vendor or Store ID not found in your account.",
        });
      }

      const whereClause = { vendorId: vendorStoreId };

      // Add date filter
      if (startDate || endDate) {
        whereClause.date = {};
        if (startDate) {
          whereClause.date[Op.gte] = startDate;
        }
        if (endDate) {
          whereClause.date[Op.lte] = endDate;
        }
      }

      // Add product filter
      if (productId) {
        whereClause.productId = parseInt(productId);
      }

      // Add order filter
      if (orderId) {
        whereClause.orderId = parseInt(orderId);
      }

      const transactions = await db.outboundTransactions.findAll({
        where: whereClause,
        include: [
          {
            model: db.product,
            as: "product",
            attributes: [
              "id",
              "name",
              "slug",
              "brand",
              "unitSize",
              "price",
              "buyerPrice",
              "qty",
              "netPrice",
              "photo",
              "sortDesc",
              "desc",
              "status",
            ],
            required: false,
          },
          {
            model: db.orders,
            as: "order",
            attributes: ["id", "number", "status"],
            required: false,
          },
        ],
        order: [["date", "DESC"], ["createdAt", "DESC"]],
      });

      return res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      console.error("Error fetching outbound transactions:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch outbound transactions",
        error: error.message,
      });
    }
  },

  // Add Outbound Transaction
  async addOutboundTransaction(req, res, next) {
    try {
      const vendorStoreId = getVendorStoreId(req.user);

      if (!vendorStoreId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Vendor or Store ID not found in your account.",
        });
      }

      const { productId, quantity, orderId, date, notes } = req.body;

      // Validation
      if (!productId || !quantity || !date) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
          errors: {
            productId: !productId ? "Product ID is required" : undefined,
            quantity: !quantity ? "Quantity is required" : undefined,
            date: !date ? "Date is required" : undefined,
          },
        });
      }

      // Validate date
      const transactionDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const year2000 = new Date("2000-01-01");

      if (transactionDate > today) {
        return res.status(400).json({
          success: false,
          message: "Date cannot be in the future",
        });
      }

      if (transactionDate < year2000) {
        return res.status(400).json({
          success: false,
          message: "Date cannot be before 2000",
        });
      }

      // Validate quantity
      const quantityNum = parseInt(quantity);
      if (isNaN(quantityNum) || quantityNum < 1 || quantityNum > 999999) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be between 1 and 999999",
        });
      }

      // Validate notes if provided
      if (notes && notes.length > 500) {
        return res.status(400).json({
          success: false,
          message: "Notes must not exceed 500 characters",
        });
      }

      const transaction = await db.outboundTransactions.create({
        vendorId: vendorStoreId,
        productId: parseInt(productId),
        quantity: quantityNum,
        orderId: orderId ? parseInt(orderId) : null,
        date,
        notes: notes || null,
      });

      return res.status(200).json({
        success: true,
        message: "Outbound transaction added successfully",
        data: transaction,
      });
    } catch (error) {
      console.error("Error adding outbound transaction:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to add outbound transaction",
        error: error.message,
      });
    }
  },

  // Update Outbound Transaction
  async updateOutboundTransaction(req, res, next) {
    try {
      const vendorStoreId = getVendorStoreId(req.user);

      if (!vendorStoreId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Vendor or Store ID not found in your account.",
        });
      }

      const { id, productId, quantity, orderId, date, notes } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Transaction ID is required",
        });
      }

      // Find transaction and verify ownership
      const transaction = await db.outboundTransactions.findOne({
        where: { id },
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }

      // Security check: Verify transaction belongs to user's vendor/store
      if (!(await verifyTransactionOwnership(transaction, vendorStoreId))) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only modify transactions belonging to your store/vendor.",
        });
      }

      // Validate date if provided
      if (date) {
        const transactionDate = new Date(date);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const year2000 = new Date("2000-01-01");

        if (transactionDate > today) {
          return res.status(400).json({
            success: false,
            message: "Date cannot be in the future",
          });
        }

        if (transactionDate < year2000) {
          return res.status(400).json({
            success: false,
            message: "Date cannot be before 2000",
          });
        }
      }

      // Validate quantity if provided
      if (quantity !== undefined) {
        const quantityNum = parseInt(quantity);
        if (isNaN(quantityNum) || quantityNum < 1 || quantityNum > 999999) {
          return res.status(400).json({
            success: false,
            message: "Quantity must be between 1 and 999999",
          });
        }
      }

      // Validate notes if provided
      if (notes && notes.length > 500) {
        return res.status(400).json({
          success: false,
          message: "Notes must not exceed 500 characters",
        });
      }

      // Update transaction (vendorId cannot be changed)
      await db.outboundTransactions.update(
        {
          productId: productId ? parseInt(productId) : transaction.productId,
          quantity: quantity !== undefined ? parseInt(quantity) : transaction.quantity,
          orderId: orderId !== undefined ? (orderId ? parseInt(orderId) : null) : transaction.orderId,
          date: date || transaction.date,
          notes: notes !== undefined ? notes : transaction.notes,
        },
        {
          where: { id },
        }
      );

      const updatedTransaction = await db.outboundTransactions.findOne({
        where: { id },
      });

      return res.status(200).json({
        success: true,
        message: "Outbound transaction updated successfully",
        data: updatedTransaction,
      });
    } catch (error) {
      console.error("Error updating outbound transaction:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update outbound transaction",
        error: error.message,
      });
    }
  },

  // Delete Outbound Transaction
  async deleteOutboundTransaction(req, res, next) {
    try {
      const vendorStoreId = getVendorStoreId(req.user);

      if (!vendorStoreId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Vendor or Store ID not found in your account.",
        });
      }

      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Transaction ID is required",
        });
      }

      // Find transaction and verify ownership
      const transaction = await db.outboundTransactions.findOne({
        where: { id },
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }

      // Security check: Verify transaction belongs to user's vendor/store
      if (!(await verifyTransactionOwnership(transaction, vendorStoreId))) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only delete transactions belonging to your store/vendor.",
        });
      }

      await db.outboundTransactions.destroy({
        where: { id },
      });

      return res.status(200).json({
        success: true,
        message: "Outbound transaction deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting outbound transaction:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete transaction",
        error: error.message,
      });
    }
  },

  // Get Vendor Inventory Statistics
  async getVendorInventoryStats(req, res, next) {
    try {
      const vendorStoreId = getVendorStoreId(req.user);

      if (!vendorStoreId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Vendor or Store ID not found in your account.",
        });
      }

      // Get total products
      const totalProducts = await db.product.count({
        where: { createdId: vendorStoreId },
      });

      // Get total inbound
      const totalInbound = await db.inboundTransactions.count({
        where: { vendorId: vendorStoreId },
      });

      // Get total outbound
      const totalOutbound = await db.outboundTransactions.count({
        where: { vendorId: vendorStoreId },
      });

      // Calculate current stock
      const inboundSum = await db.inboundTransactions.sum("quantity", {
        where: { vendorId: vendorStoreId },
      });

      const outboundSum = await db.outboundTransactions.sum("quantity", {
        where: { vendorId: vendorStoreId },
      });

      const currentStock = (inboundSum || 0) - (outboundSum || 0);

      // Get low stock products
      const lowStockProducts = await db.product.findAll({
        where: {
          createdId: vendorStoreId,
          qty: {
            [Op.lt]: 10, // Assuming 10 is the threshold
          },
        },
        attributes: ["id", "name", "qty"],
        limit: 50,
      });

      return res.status(200).json({
        success: true,
        data: {
          vendorId: vendorStoreId,
          totalProducts,
          totalInbound,
          totalOutbound,
          currentStock,
          lowStockProducts: lowStockProducts.map((product) => ({
            productId: product.id,
            productName: product.name,
            currentStock: product.qty || 0,
            minThreshold: 10, // You may want to make this configurable
          })),
        },
      });
    } catch (error) {
      console.error("Error fetching vendor inventory stats:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch vendor inventory statistics",
        error: error.message,
      });
    }
  },

  // ========== CLIENT MANAGEMENT APIs ==========

  // Get All Clients
  async getClients(req, res, next) {
    try {
      const vendorStoreId = getVendorStoreId(req.user);
      const { search, page = 1, limit = 50 } = req.query;

      if (!vendorStoreId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Vendor or Store ID not found in your account.",
        });
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const whereClause = {};

      // Filter by vendorId or storeId
      const vendorIdStr = String(vendorStoreId);
      whereClause[Op.or] = [
        { vendorId: vendorIdStr },
        { storeId: vendorIdStr },
      ];

      // Add search filter
      if (search) {
        whereClause[Op.and] = [
          {
            [Op.or]: [
              { firstName: { [Op.like]: `%${search}%` } },
              { lastName: { [Op.like]: `%${search}%` } },
              { email: { [Op.like]: `%${search}%` } },
              { phone: { [Op.like]: `%${search}%` } },
            ],
          },
        ];
      }

      const { count, rows } = await db.user.findAndCountAll({
        where: whereClause,
        attributes: [
          "id",
          "firstName",
          "lastName",
          "email",
          "phone",
          "address",
          "city",
          "gstNumber",
          "logo",
          "branches",
          "vendorId",
          "storeId",
          "role",
          "plan",
          "createdAt",
          "updatedAt",
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [["createdAt", "DESC"]],
      });

      return res.status(200).json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Error fetching clients:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch clients",
        error: error.message,
      });
    }
  },

  // Get Client by ID
  async getClientById(req, res, next) {
    try {
      const vendorStoreId = getVendorStoreId(req.user);
      const { id } = req.params;

      if (!vendorStoreId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Vendor or Store ID not found in your account.",
        });
      }

      const vendorIdStr = String(vendorStoreId);
      const client = await db.user.findOne({
        where: {
          id,
          [Op.or]: [
            { vendorId: vendorIdStr },
            { storeId: vendorIdStr },
          ],
        },
        attributes: [
          "id",
          "firstName",
          "lastName",
          "email",
          "phone",
          "address",
          "city",
          "gstNumber",
          "logo",
          "branches",
          "vendorId",
          "storeId",
          "role",
          "plan",
          "createdAt",
          "updatedAt",
        ],
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          message: "Client not found or does not belong to your store",
        });
      }

      return res.status(200).json({
        success: true,
        data: client,
      });
    } catch (error) {
      console.error("Error fetching client:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch client",
        error: error.message,
      });
    }
  },

  // Create Client
  async createClient(req, res, next) {
    console.log("========== createClient METHOD CALLED ==========");
    console.log("Request received at:", new Date().toISOString());
    console.log("req.method:", req.method);
    console.log("req.path:", req.path);
    console.log("req.body exists:", !!req.body);
    console.log("req.user exists:", !!req.user);
    
    try {
      const vendorStoreId = getVendorStoreId(req.user);
      console.log("vendorStoreId extracted:", vendorStoreId);

      if (!vendorStoreId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Vendor or Store ID not found in your account.",
        });
      }

      // Ensure req.body exists
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({
          success: false,
          message: "Invalid request body",
        });
      }

      console.log("req.body received:", JSON.stringify(req.body, null, 2));
      console.log("req.user:", req.user ? { id: req.user.id, vendorId: req.user.vendorId, storeId: req.user.storeId } : 'No user');

      // Safely extract fields from req.body with defaults - handle null/undefined explicitly
      const firstName = (req.body.firstName != null) ? String(req.body.firstName) : '';
      const lastName = (req.body.lastName != null) ? String(req.body.lastName) : '';
      const email = (req.body.email != null) ? String(req.body.email) : '';
      const phone = (req.body.phone != null) ? String(req.body.phone) : '';
      const address = (req.body.address != null) ? String(req.body.address) : '';
      const city = (req.body.city != null) ? String(req.body.city) : '';
      const gstNumber = (req.body.gstNumber != null) ? String(req.body.gstNumber) : '';
      const logo = (req.body.logo != null) ? String(req.body.logo) : '';
      const branches = req.body.branches; // Keep as is, will validate and stringify

      // Validation - ensure fields are strings and not empty after trimming
      const firstNameTrimmed = firstName.trim();
      if (!firstNameTrimmed || firstNameTrimmed.length < 2) {
        return res.status(400).json({
          success: false,
          message: "First name is required and must be at least 2 characters",
          errors: {
            firstName: "First name is required and must be at least 2 characters",
          },
        });
      }

      const emailTrimmed = email.trim();
      if (!emailTrimmed || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(emailTrimmed)) {
        return res.status(400).json({
          success: false,
          message: "Valid email is required",
          errors: {
            email: "Valid email is required",
          },
        });
      }

      const phoneTrimmed = phone.trim();
      if (!phoneTrimmed || !/^[6-9]\d{9}$/.test(phoneTrimmed)) {
        return res.status(400).json({
          success: false,
          message: "Valid 10-digit phone number starting with 6-9 is required",
          errors: {
            phone: "Valid 10-digit phone number starting with 6-9 is required",
          },
        });
      }

      // Check if email already exists for this vendor/store
      const vendorIdStr = String(vendorStoreId);
      const emailLower = emailTrimmed.toLowerCase();
      const existingClient = await db.user.findOne({
        where: {
          email: emailLower,
          [Op.or]: [
            { vendorId: vendorIdStr },
            { storeId: vendorIdStr },
          ],
        },
      });

      if (existingClient) {
        return res.status(400).json({
          success: false,
          message: "Client with this email already exists",
          errors: {
            email: "Client with this email already exists",
          },
        });
      }

      // Determine if user has vendorId or storeId
      const hasVendorId = req.user.vendorId && String(req.user.vendorId) !== "";

      // Validate and process branches
      let branchesData = null;
      if (branches) {
        try {
          // If branches is already a string (JSON), parse it; otherwise use as-is
          const parsedBranches = typeof branches === 'string' ? JSON.parse(branches) : branches;
          if (Array.isArray(parsedBranches)) {
            branchesData = JSON.stringify(parsedBranches);
          } else {
            return res.status(400).json({
              success: false,
              message: "Branches must be a valid JSON array",
              errors: {
                branches: "Branches must be a valid JSON array",
              },
            });
          }
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: "Invalid branches JSON format",
            errors: {
              branches: "Invalid branches JSON format: " + e.message,
            },
          });
        }
      }

      // Validate GST number format if provided
      if (gstNumber && gstNumber.trim()) {
        const gstTrimmed = gstNumber.trim();
        if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstTrimmed)) {
          return res.status(400).json({
            success: false,
            message: "Invalid GST number format",
            errors: {
              gstNumber: "GST number must be in format: 22AAAAA0000A1Z5",
            },
          });
        }
      }

      // Create client - use trimmed values from validation
      const lastNameTrimmed = lastName.trim();
      const addressTrimmed = address.trim();
      const cityTrimmed = city.trim();
      const gstNumberTrimmed = gstNumber.trim();
      const logoTrimmed = logo.trim();

      const clientData = {
        firstName: firstNameTrimmed,
        lastName: lastNameTrimmed || null,
        email: emailLower,
        phone: phoneTrimmed,
        address: addressTrimmed || null,
        city: cityTrimmed || null,
        gstNumber: gstNumberTrimmed || null,
        logo: logoTrimmed || null,
        branches: branchesData,
        role: "5", // Role 5 for clients
        verify: true,
      };

      // Set vendorId or storeId based on what user has
      if (hasVendorId) {
        clientData.vendorId = String(vendorStoreId);
        clientData.storeId = null; // Clear storeId if using vendorId
      } else {
        clientData.storeId = String(vendorStoreId);
        clientData.vendorId = null; // Clear vendorId if using storeId
      }

      console.log("Creating client with data:", JSON.stringify(clientData, null, 2));
      console.log("VendorStoreId:", vendorStoreId, "hasVendorId:", hasVendorId);
      
      try {
        const client = await db.user.create(clientData);
        console.log("Client created successfully:", client.id);
        return res.status(201).json({
          success: true,
          message: "Client created successfully",
          data: client,
        });
      } catch (dbError) {
        console.error("Database error creating client:", dbError);
        console.error("Database error details:", {
          name: dbError.name,
          message: dbError.message,
          parent: dbError.parent?.message,
          sql: dbError.parent?.sql,
        });
        
        // Handle specific database errors
        if (dbError.name === 'SequelizeUniqueConstraintError') {
          return res.status(400).json({
            success: false,
            message: "A client with this email already exists",
            error: dbError.parent?.message || dbError.message,
          });
        }
        
        if (dbError.name === 'SequelizeValidationError') {
          return res.status(400).json({
            success: false,
            message: "Validation error",
            errors: dbError.errors?.map(e => e.message) || [dbError.message],
          });
        }
        
        throw dbError; // Re-throw to be caught by outer catch
      }

    } catch (error) {
      console.error("Error creating client - Full error:", error);
      console.error("Error stack:", error.stack);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      
      // Return detailed error for debugging
      return res.status(500).json({
        success: false,
        message: "Failed to create client",
        error: error.message || "Unknown error",
        details: process.env.NODE_ENV === 'development' ? {
          name: error.name,
          stack: error.stack
        } : undefined
      });
    }
  },

  // Update Client
  async updateClient(req, res, next) {
    try {
      const vendorStoreId = getVendorStoreId(req.user);
      const clientId = req.params.id || req.body.id;

      if (!vendorStoreId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Vendor or Store ID not found in your account.",
        });
      }

      if (!clientId) {
        return res.status(400).json({
          success: false,
          message: "Client ID is required",
        });
      }

      // Find and verify ownership
      const vendorIdStr = String(vendorStoreId);
      const client = await db.user.findOne({
        where: {
          id: clientId,
          [Op.or]: [
            { vendorId: vendorIdStr },
            { storeId: vendorIdStr },
          ],
        },
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          message: "Client not found or does not belong to your store",
        });
      }

      // Safely extract fields from req.body with defaults - handle null/undefined explicitly
      const firstName = (req.body.firstName != null) ? String(req.body.firstName) : '';
      const lastName = (req.body.lastName != null) ? String(req.body.lastName) : '';
      const email = (req.body.email != null) ? String(req.body.email) : '';
      const phone = (req.body.phone != null) ? String(req.body.phone) : '';
      const address = (req.body.address != null) ? String(req.body.address) : '';
      const city = (req.body.city != null) ? String(req.body.city) : '';
      const gstNumber = (req.body.gstNumber != null) ? String(req.body.gstNumber) : '';
      const logo = (req.body.logo != null) ? String(req.body.logo) : '';
      const branches = req.body.branches; // Keep as is, will validate and stringify

      // Validate and process branches if provided
      let branchesData = client.branches; // Keep existing if not provided
      if (branches !== undefined && branches !== null) {
        try {
          // If branches is already a string (JSON), parse it; otherwise use as-is
          const parsedBranches = typeof branches === 'string' ? JSON.parse(branches) : branches;
          if (Array.isArray(parsedBranches)) {
            branchesData = JSON.stringify(parsedBranches);
          } else if (parsedBranches === null || parsedBranches === '') {
            branchesData = null;
          } else {
            return res.status(400).json({
              success: false,
              message: "Branches must be a valid JSON array",
              errors: {
                branches: "Branches must be a valid JSON array",
              },
            });
          }
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: "Invalid branches JSON format",
            errors: {
              branches: "Invalid branches JSON format: " + e.message,
            },
          });
        }
      }

      // Validate GST number format if provided
      if (gstNumber && gstNumber.trim()) {
        const gstTrimmed = gstNumber.trim();
        if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstTrimmed)) {
          return res.status(400).json({
            success: false,
            message: "Invalid GST number format",
            errors: {
              gstNumber: "GST number must be in format: 22AAAAA0000A1Z5",
            },
          });
        }
      }

      // Validate email if changed
      if (email && typeof email === 'string' && email.trim() !== client.email) {
        const emailLower = email.trim().toLowerCase();
        const existingClient = await db.user.findOne({
          where: {
            email: emailLower,
            [Op.or]: [
              { vendorId: vendorIdStr },
              { storeId: vendorIdStr },
            ],
            id: { [Op.ne]: clientId },
          },
        });

        if (existingClient) {
          return res.status(400).json({
            success: false,
            message: "Email already exists for another client",
            errors: {
              email: "Email already exists for another client",
            },
          });
        }
      }

      // Prepare update data
      const updateData = {};
      if (firstName !== undefined && firstName !== null) {
        updateData.firstName = typeof firstName === 'string' ? firstName.trim() : firstName;
      }
      if (lastName !== undefined) {
        updateData.lastName = lastName && typeof lastName === 'string' ? lastName.trim() : lastName;
      }
      if (email !== undefined && email !== null) {
        updateData.email = typeof email === 'string' ? email.trim().toLowerCase() : email;
      }
      if (phone !== undefined && phone !== null) {
        updateData.phone = typeof phone === 'string' ? phone.trim() : phone;
      }
      if (address !== undefined) {
        updateData.address = address && typeof address === 'string' ? address.trim() : address;
      }
      if (city !== undefined) {
        updateData.city = city && typeof city === 'string' ? city.trim() : city;
      }
      if (gstNumber !== undefined) {
        updateData.gstNumber = gstNumber && typeof gstNumber === 'string' ? gstNumber.trim() : gstNumber;
      }
      if (logo !== undefined) {
        updateData.logo = logo && typeof logo === 'string' ? logo.trim() : logo;
      }
      if (branchesData !== undefined) {
        updateData.branches = branchesData;
      }

      // Update client
      await client.update(updateData);

      return res.status(200).json({
        success: true,
        message: "Client updated successfully",
        data: client,
      });
    } catch (error) {
      console.error("Error updating client:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update client",
        error: error.message,
      });
    }
  },

  // Delete Client
  async deleteClient(req, res, next) {
    try {
      const vendorStoreId = getVendorStoreId(req.user);
      const { id } = req.params;

      if (!vendorStoreId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Vendor or Store ID not found in your account.",
        });
      }

      // Find and verify ownership
      const vendorIdStr = String(vendorStoreId);
      const client = await db.user.findOne({
        where: {
          id,
          [Op.or]: [
            { vendorId: vendorIdStr },
            { storeId: vendorIdStr },
          ],
        },
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          message: "Client not found or does not belong to your store",
        });
      }

      // Check if client has associated transactions
      const hasTransactions = await db.inboundTransactions.count({
        where: { clientId: id, vendorId: vendorStoreId },
      });

      if (hasTransactions > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot delete client with associated transactions. Please remove transactions first.",
        });
      }

      // Delete client
      await client.destroy();

      return res.status(200).json({
        success: true,
        message: "Client deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting client:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete client",
        error: error.message,
      });
    }
  },

  // ========== INVENTORY PRODUCTS APIs ==========

  // Get All Inventory Products
  async getInventoryProducts(req, res, next) {
    try {
      const vendorStoreId = getVendorStoreId(req.user);

      if (!vendorStoreId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Vendor or Store ID not found in your account.",
        });
      }

      const { page = 1, limit = 10, search, categoryId, status } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const whereClause = {
        [Op.or]: [
          { vendorId: String(vendorStoreId) },
          { storeId: String(vendorStoreId) },
        ],
      };

      // Add search filter
      if (search) {
        whereClause[Op.or] = [
          ...whereClause[Op.or],
          { name: { [Op.like]: `%${search}%` } },
          { sku: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
        ];
      }

      // Add category filter
      if (categoryId) {
        whereClause.categoryId = parseInt(categoryId);
      }

      // Add status filter
      if (status) {
        whereClause.status = status;
      }

      const { count, rows } = await db.inventoryProduct.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: db.category,
            as: "category",
            attributes: ["id", "name"],
            required: false,
          },
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [["createdAt", "DESC"]],
      });

      return res.status(200).json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Error fetching inventory products:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch inventory products",
        error: error.message,
      });
    }
  },

  // Get Inventory Product by ID
  async getInventoryProductById(req, res, next) {
    try {
      const vendorStoreId = getVendorStoreId(req.user);
      const { id } = req.params;

      if (!vendorStoreId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Vendor or Store ID not found in your account.",
        });
      }

      const product = await db.inventoryProduct.findOne({
        where: {
          id: id,
          [Op.or]: [
            { vendorId: String(vendorStoreId) },
            { storeId: String(vendorStoreId) },
          ],
        },
        include: [
          {
            model: db.category,
            as: "category",
            attributes: ["id", "name"],
            required: false,
          },
        ],
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Inventory product not found or does not belong to your store",
        });
      }

      return res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error("Error fetching inventory product:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch inventory product",
        error: error.message,
      });
    }
  },

  // Create Inventory Product
  async createInventoryProduct(req, res, next) {
    try {
      const vendorStoreId = getVendorStoreId(req.user);

      if (!vendorStoreId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Vendor or Store ID not found in your account.",
        });
      }

      const {
        name,
        sku,
        description,
        categoryId,
        brand,
        unit,
        currentStock,
        reorderLevel,
        costPrice,
        sellingPrice,
        photo,
        status,
        notes,
      } = req.body;

      // Validation
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: "Product name is required and must be at least 2 characters",
        });
      }

      // Check if SKU already exists for this vendor/store
      if (sku) {
        const existingProduct = await db.inventoryProduct.findOne({
          where: {
            sku: sku.trim(),
            [Op.or]: [
              { vendorId: String(vendorStoreId) },
              { storeId: String(vendorStoreId) },
            ],
          },
        });

        if (existingProduct) {
          return res.status(400).json({
            success: false,
            message: "Product with this SKU already exists",
            errors: {
              sku: "SKU must be unique for your store",
            },
          });
        }
      }

      // Determine if user has vendorId or storeId
      const hasVendorId = req.user.vendorId && String(req.user.vendorId) !== "";

      const productData = {
        name: name.trim(),
        sku: sku ? sku.trim() : null,
        description: description ? description.trim() : null,
        categoryId: categoryId ? parseInt(categoryId) : null,
        brand: brand ? brand.trim() : null,
        unit: unit ? unit.trim() : null,
        currentStock: currentStock ? parseInt(currentStock) : 0,
        reorderLevel: reorderLevel ? parseInt(reorderLevel) : 0,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null,
        photo: photo ? photo.trim() : null,
        status: status || "active",
        notes: notes ? notes.trim() : null,
      };

      // Set vendorId or storeId based on what user has
      if (hasVendorId) {
        productData.vendorId = String(vendorStoreId);
        productData.storeId = null;
      } else {
        productData.storeId = String(vendorStoreId);
        productData.vendorId = null;
      }

      const product = await db.inventoryProduct.create(productData);

      return res.status(201).json({
        success: true,
        message: "Inventory product created successfully",
        data: product,
      });
    } catch (error) {
      console.error("Error creating inventory product:", error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: "Product with this SKU already exists",
          error: error.message,
        });
      }
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors?.map(e => e.message) || [error.message],
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to create inventory product",
        error: error.message,
      });
    }
  },

  // Update Inventory Product
  async updateInventoryProduct(req, res, next) {
    try {
      const vendorStoreId = getVendorStoreId(req.user);
      const productId = req.params.id || req.body.id;

      if (!vendorStoreId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Vendor or Store ID not found in your account.",
        });
      }

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: "Product ID is required",
        });
      }

      // Find and verify ownership
      const vendorIdStr = String(vendorStoreId);
      const product = await db.inventoryProduct.findOne({
        where: {
          id: productId,
          [Op.or]: [
            { vendorId: vendorIdStr },
            { storeId: vendorIdStr },
          ],
        },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Inventory product not found or does not belong to your store",
        });
      }

      const {
        name,
        sku,
        description,
        categoryId,
        brand,
        unit,
        currentStock,
        reorderLevel,
        costPrice,
        sellingPrice,
        photo,
        status,
        notes,
      } = req.body;

      // Check if SKU already exists for another product
      if (sku && sku.trim() !== product.sku) {
        const existingProduct = await db.inventoryProduct.findOne({
          where: {
            sku: sku.trim(),
            [Op.or]: [
              { vendorId: vendorIdStr },
              { storeId: vendorIdStr },
            ],
            id: { [Op.ne]: productId },
          },
        });

        if (existingProduct) {
          return res.status(400).json({
            success: false,
            message: "Product with this SKU already exists",
            errors: {
              sku: "SKU must be unique for your store",
            },
          });
        }
      }

      // Prepare update data
      const updateData = {};
      if (name !== undefined && name !== null) {
        updateData.name = typeof name === 'string' ? name.trim() : name;
      }
      if (sku !== undefined) {
        updateData.sku = sku && typeof sku === 'string' ? sku.trim() : sku;
      }
      if (description !== undefined) {
        updateData.description = description && typeof description === 'string' ? description.trim() : description;
      }
      if (categoryId !== undefined) {
        updateData.categoryId = categoryId ? parseInt(categoryId) : null;
      }
      if (brand !== undefined) {
        updateData.brand = brand && typeof brand === 'string' ? brand.trim() : brand;
      }
      if (unit !== undefined) {
        updateData.unit = unit && typeof unit === 'string' ? unit.trim() : unit;
      }
      if (currentStock !== undefined) {
        updateData.currentStock = currentStock ? parseInt(currentStock) : 0;
      }
      if (reorderLevel !== undefined) {
        updateData.reorderLevel = reorderLevel ? parseInt(reorderLevel) : 0;
      }
      if (costPrice !== undefined) {
        updateData.costPrice = costPrice ? parseFloat(costPrice) : null;
      }
      if (sellingPrice !== undefined) {
        updateData.sellingPrice = sellingPrice ? parseFloat(sellingPrice) : null;
      }
      if (photo !== undefined) {
        updateData.photo = photo && typeof photo === 'string' ? photo.trim() : photo;
      }
      if (status !== undefined) {
        updateData.status = status;
      }
      if (notes !== undefined) {
        updateData.notes = notes && typeof notes === 'string' ? notes.trim() : notes;
      }

      await product.update(updateData);

      return res.status(200).json({
        success: true,
        message: "Inventory product updated successfully",
        data: product,
      });
    } catch (error) {
      console.error("Error updating inventory product:", error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: "Product with this SKU already exists",
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to update inventory product",
        error: error.message,
      });
    }
  },

  // Delete Inventory Product
  async deleteInventoryProduct(req, res, next) {
    try {
      const vendorStoreId = getVendorStoreId(req.user);
      const { id } = req.params;

      if (!vendorStoreId) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Vendor or Store ID not found in your account.",
        });
      }

      const vendorIdStr = String(vendorStoreId);
      const product = await db.inventoryProduct.findOne({
        where: {
          id: id,
          [Op.or]: [
            { vendorId: vendorIdStr },
            { storeId: vendorIdStr },
          ],
        },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Inventory product not found or does not belong to your store",
        });
      }

      // Check if product is used in any transactions
      const inboundCount = await db.inboundTransactions.count({
        where: { productId: id },
      });

      const outboundCount = await db.outboundTransactions.count({
        where: { productId: id },
      });

      if (inboundCount > 0 || outboundCount > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete product. It is associated with inventory transactions.",
          details: {
            inboundTransactions: inboundCount,
            outboundTransactions: outboundCount,
          },
        });
      }

      await product.destroy();

      return res.status(200).json({
        success: true,
        message: "Inventory product deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting inventory product:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete inventory product",
        error: error.message,
      });
    }
  },
};
