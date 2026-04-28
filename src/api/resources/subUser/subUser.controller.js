const { Op } = require("sequelize");
const db = require("../../../models");
const bcrypt = require("bcrypt-nodejs");

/**
 * Helper function to extract vendor/store ID from authenticated user
 */
const getVendorStoreId = (user) => {
  if (!user) {
    return null;
  }
  const vendorId = user.vendorId ? (isNaN(user.vendorId) ? null : String(user.vendorId)) : null;
  const storeId = user.storeId ? (isNaN(user.storeId) ? null : String(user.storeId)) : null;
  return vendorId || storeId || null;
};

module.exports = {
  // Get all sub-users for current vendor/store
  async getSubUsers(req, res, next) {
    try {
      const userId = req.user.id;
      const role = req.user.role;
      const vendorStoreId = getVendorStoreId(req.user);

      if (!vendorStoreId && role !== '0') {
        return res.status(403).json({
          success: false,
          message: "Access denied. Vendor or Store ID not found in your account.",
        });
      }

      const where = {};
      if (role === '2') {
        where.vendorId = String(vendorStoreId);
      } else if (role === '3') {
        where.storeId = String(vendorStoreId);
      }

      const subUsers = await db.subUser.findAll({
        where,
        attributes: { exclude: ['password'] },
        include: [
          {
            model: db.user,
            as: "creator",
            attributes: ["id", "firstName", "lastName", "email"],
            required: false,
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      return res.status(200).json({
        success: true,
        data: subUsers,
        count: subUsers.length,
      });
    } catch (error) {
      console.error("Error fetching sub-users:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch sub-users",
        error: error.message,
      });
    }
  },

  // Get sub-user by ID
  async getSubUserById(req, res, next) {
    try {
      const { id } = req.params;
      const role = req.user.role;
      const vendorStoreId = getVendorStoreId(req.user);

      const where = { id };
      if (role === '2') {
        where.vendorId = String(vendorStoreId);
      } else if (role === '3') {
        where.storeId = String(vendorStoreId);
      }

      const subUser = await db.subUser.findOne({
        where,
        attributes: { exclude: ['password'] },
        include: [
          {
            model: db.user,
            as: "creator",
            attributes: ["id", "firstName", "lastName", "email"],
            required: false,
          },
          {
            model: db.user,
            as: "approver",
            attributes: ["id", "firstName", "lastName", "email"],
            required: false,
          },
          {
            model: db.user,
            as: "rejector",
            attributes: ["id", "firstName", "lastName", "email"],
            required: false,
          },
        ],
      });

      if (!subUser) {
        return res.status(404).json({
          success: false,
          message: "Sub-user not found or does not belong to your store",
        });
      }

      return res.status(200).json({
        success: true,
        data: subUser,
      });
    } catch (error) {
      console.error("Error fetching sub-user:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch sub-user",
        error: error.message,
      });
    }
  },

  // Create sub-user
  async createSubUser(req, res, next) {
    try {
      const { firstName, lastName, email, phone, password } = req.body;
      const userId = req.user.id;
      const role = req.user.role;
      const vendorStoreId = getVendorStoreId(req.user);

      if (!vendorStoreId && role !== '0') {
        return res.status(403).json({
          success: false,
          message: "Access denied. Vendor or Store ID not found in your account.",
        });
      }

      // Validate required fields
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: firstName, lastName, email, password",
        });
      }

      // Check if email already exists in users or subUsers
      const existingUser = await db.user.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email already registered",
        });
      }

      const existingSubUser = await db.subUser.findOne({ where: { email } });
      if (existingSubUser) {
        return res.status(409).json({
          success: false,
          message: "Email already registered",
        });
      }

      // Hash password
      const hashedPassword = bcrypt.hashSync(password);

      // Create sub-user
      const subUserData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        password: hashedPassword,
        status: 'pending',
        createdBy: userId,
      };

      if (role === '2') {
        subUserData.vendorId = String(vendorStoreId);
        subUserData.storeId = null;
      } else if (role === '3') {
        subUserData.storeId = String(vendorStoreId);
        subUserData.vendorId = null;
      }

      const subUser = await db.subUser.create(subUserData);

      // Create default permissions (all enabled)
      const { VALID_MENU_KEYS } = require("../../../constants/menuKeys");
      const menuKeys = VALID_MENU_KEYS;
      
      const permissions = menuKeys.map(menuKey => ({
        subUserId: subUser.id,
        menuKey,
        enabled: true,
      }));

      await db.subUserMenuPermission.bulkCreate(permissions);

      // Remove password from response
      const subUserDataResponse = subUser.toJSON();
      delete subUserDataResponse.password;

      return res.status(201).json({
        success: true,
        message: "Sub-user created successfully. Waiting for admin approval.",
        data: subUserDataResponse,
      });
    } catch (error) {
      console.error("Error creating sub-user:", error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          message: "Email already registered",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to create sub-user",
        error: error.message,
      });
    }
  },

  // Update sub-user
  async updateSubUser(req, res, next) {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, phone } = req.body;
      const role = req.user.role;
      const vendorStoreId = getVendorStoreId(req.user);

      const where = { id };
      if (role === '2') {
        where.vendorId = String(vendorStoreId);
      } else if (role === '3') {
        where.storeId = String(vendorStoreId);
      }

      const subUser = await db.subUser.findOne({ where });

      if (!subUser) {
        return res.status(404).json({
          success: false,
          message: "Sub-user not found or does not belong to your store",
        });
      }

      // Check email uniqueness if changed
      if (email && email !== subUser.email) {
        const existingUser = await db.user.findOne({ where: { email } });
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: "Email already registered",
          });
        }

        const existingSubUser = await db.subUser.findOne({ 
          where: { email, id: { [Op.ne]: id } } 
        });
        if (existingSubUser) {
          return res.status(409).json({
            success: false,
            message: "Email already registered",
          });
        }
      }

      // Update fields
      if (firstName) subUser.firstName = firstName.trim();
      if (lastName) subUser.lastName = lastName.trim();
      if (email) subUser.email = email.trim().toLowerCase();
      if (phone !== undefined) subUser.phone = phone ? phone.trim() : null;

      await subUser.save();

      const subUserData = subUser.toJSON();
      delete subUserData.password;

      return res.status(200).json({
        success: true,
        message: "Sub-user updated successfully",
        data: subUserData,
      });
    } catch (error) {
      console.error("Error updating sub-user:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update sub-user",
        error: error.message,
      });
    }
  },

  // Delete sub-user
  async deleteSubUser(req, res, next) {
    try {
      const { id } = req.params;
      const role = req.user.role;
      const vendorStoreId = getVendorStoreId(req.user);

      const where = { id };
      if (role === '2') {
        where.vendorId = String(vendorStoreId);
      } else if (role === '3') {
        where.storeId = String(vendorStoreId);
      }

      const subUser = await db.subUser.findOne({ where });

      if (!subUser) {
        return res.status(404).json({
          success: false,
          message: "Sub-user not found or does not belong to your store",
        });
      }

      // Delete menu permissions first
      await db.subUserMenuPermission.destroy({ where: { subUserId: id } });

      // Delete sub-user
      await subUser.destroy();

      return res.status(200).json({
        success: true,
        message: "Sub-user deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting sub-user:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete sub-user",
        error: error.message,
      });
    }
  },

  // Get pending sub-users (Admin only)
  async getPendingSubUsers(req, res, next) {
    try {
      const pendingUsers = await db.subUser.findAll({
        where: { status: 'pending' },
        attributes: { exclude: ['password'] },
        include: [
          {
            model: db.user,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email'],
            required: false,
          },
          {
            model: db.vendor,
            as: 'vendor',
            attributes: ['id', 'storename'],
            required: false,
          },
          {
            model: db.store,
            as: 'store',
            attributes: ['id', 'storename'],
            required: false,
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      const formattedData = pendingUsers.map(user => {
        const userData = user.toJSON();
        userData.vendorName = userData.vendor?.storename || null;
        userData.storeName = userData.store?.storename || null;
        return userData;
      });

      return res.status(200).json({
        success: true,
        data: formattedData,
        count: formattedData.length,
      });
    } catch (error) {
      console.error("Error fetching pending sub-users:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch pending sub-users",
        error: error.message,
      });
    }
  },

  // Approve sub-user (Admin only)
  async approveSubUser(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const subUser = await db.subUser.findByPk(id);
      if (!subUser) {
        return res.status(404).json({
          success: false,
          message: "Sub-user not found",
        });
      }

      if (subUser.status === 'approved') {
        return res.status(400).json({
          success: false,
          message: "Sub-user is already approved",
        });
      }

      if (subUser.status === 'rejected') {
        return res.status(400).json({
          success: false,
          message: "Cannot approve a rejected sub-user",
        });
      }

      subUser.status = 'approved';
      subUser.approvedBy = adminId;
      subUser.approvedAt = new Date();
      await subUser.save();

      const subUserData = subUser.toJSON();
      delete subUserData.password;

      return res.status(200).json({
        success: true,
        message: "Sub-user approved successfully",
        data: {
          ...subUserData,
          approvedBy: {
            id: req.user.id,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            email: req.user.email,
          },
        },
      });
    } catch (error) {
      console.error("Error approving sub-user:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to approve sub-user",
        error: error.message,
      });
    }
  },

  // Reject sub-user (Admin only)
  async rejectSubUser(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: "Rejection reason is required",
        });
      }

      const subUser = await db.subUser.findByPk(id);
      if (!subUser) {
        return res.status(404).json({
          success: false,
          message: "Sub-user not found",
        });
      }

      if (subUser.status === 'rejected') {
        return res.status(400).json({
          success: false,
          message: "Sub-user is already rejected",
        });
      }

      subUser.status = 'rejected';
      subUser.rejectedBy = adminId;
      subUser.rejectionReason = reason;
      subUser.rejectedAt = new Date();
      await subUser.save();

      const subUserData = subUser.toJSON();
      delete subUserData.password;

      return res.status(200).json({
        success: true,
        message: "Sub-user rejected",
        data: {
          ...subUserData,
          rejectedBy: {
            id: req.user.id,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            email: req.user.email,
          },
        },
      });
    } catch (error) {
      console.error("Error rejecting sub-user:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to reject sub-user",
        error: error.message,
      });
    }
  },

  // Get approved sub-users
  async getApprovedSubUsers(req, res, next) {
    try {
      const role = req.user.role;
      const vendorStoreId = getVendorStoreId(req.user);
      const { status } = req.query; // Optional status filter

      const where = {};
      
      // Filter by status if provided, otherwise default to 'approved'
      if (status) {
        where.status = status;
      } else {
        where.status = 'approved';
      }

      // Apply vendor/store filter for non-admin users
      if (role === '2') {
        where.vendorId = String(vendorStoreId);
      } else if (role === '3') {
        where.storeId = String(vendorStoreId);
      } else if (role !== '0') {
        return res.status(403).json({
          success: false,
          message: "Access denied. Vendor or Store ID not found in your account.",
        });
      }

      const approvedUsers = await db.subUser.findAll({
        where,
        attributes: { exclude: ['password'] },
        include: [
          {
            model: db.user,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email'],
            required: false,
          },
          {
            model: db.user,
            as: 'approver',
            attributes: ['id', 'firstName', 'lastName', 'email'],
            required: false,
          },
          {
            model: db.vendor,
            as: 'vendor',
            attributes: ['id', 'storename'],
            required: false,
          },
          {
            model: db.store,
            as: 'store',
            attributes: ['id', 'storename'],
            required: false,
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      const formattedData = approvedUsers.map(user => {
        const userData = user.toJSON();
        userData.vendorName = userData.vendor?.storename || null;
        userData.storeName = userData.store?.storename || null;
        return userData;
      });

      return res.status(200).json({
        success: true,
        data: formattedData,
        count: formattedData.length,
      });
    } catch (error) {
      console.error("Error fetching approved sub-users:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch approved sub-users",
        error: error.message,
      });
    }
  },

  // Get sub-users summary/statistics
  async getSubUsersSummary(req, res, next) {
    try {
      const role = req.user.role;
      const vendorStoreId = getVendorStoreId(req.user);
      const { storeId, vendorId } = req.query; // Query parameters for filtering

      const where = {};
      
      // If storeId is provided in query, use it (admin only or verify ownership)
      if (storeId) {
        if (role === '0') {
          // Admin can filter by any storeId
          where.storeId = String(storeId);
        } else if (role === '3' && String(storeId) === String(vendorStoreId)) {
          // Store users can only filter by their own storeId
          where.storeId = String(storeId);
        } else {
          return res.status(403).json({
            success: false,
            message: "Access denied. You can only view summary for your own store.",
          });
        }
      } else if (vendorId) {
        // If vendorId is provided in query, use it (admin only or verify ownership)
        if (role === '0') {
          // Admin can filter by any vendorId
          where.vendorId = String(vendorId);
        } else if (role === '2' && String(vendorId) === String(vendorStoreId)) {
          // Vendor users can only filter by their own vendorId
          where.vendorId = String(vendorId);
        } else {
          return res.status(403).json({
            success: false,
            message: "Access denied. You can only view summary for your own vendor.",
          });
        }
      } else {
        // Apply vendor/store filter for non-admin users (use authenticated user's ID)
        if (role === '2') {
          where.vendorId = String(vendorStoreId);
        } else if (role === '3') {
          where.storeId = String(vendorStoreId);
        } else if (role !== '0') {
          return res.status(403).json({
            success: false,
            message: "Access denied. Vendor or Store ID not found in your account.",
          });
        }
      }

      // Get counts by status
      const total = await db.subUser.count({ where });
      const pending = await db.subUser.count({ 
        where: { ...where, status: 'pending' } 
      });
      const approved = await db.subUser.count({ 
        where: { ...where, status: 'approved' } 
      });
      const rejected = await db.subUser.count({ 
        where: { ...where, status: 'rejected' } 
      });

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentCreated = await db.subUser.count({
        where: {
          ...where,
          createdAt: {
            [Op.gte]: sevenDaysAgo,
          },
        },
      });

      const recentApproved = await db.subUser.count({
        where: {
          ...where,
          status: 'approved',
          approvedAt: {
            [Op.gte]: sevenDaysAgo,
          },
        },
      });

      return res.status(200).json({
        success: true,
        data: {
          total,
          pending,
          approved,
          rejected,
          recent: {
            created: recentCreated,
            approved: recentApproved,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching sub-users summary:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch sub-users summary",
        error: error.message,
      });
    }
  },
};

