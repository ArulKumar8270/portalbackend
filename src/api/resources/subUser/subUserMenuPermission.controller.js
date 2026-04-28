const { Op } = require("sequelize");
const db = require("../../../models");
const { VALID_MENU_KEYS } = require("../../../constants/menuKeys");

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
  // Get menu permissions for sub-user
  async getSubUserMenuPermissions(req, res, next) {
    try {
      const { subUserId } = req.params;
      const userId = req.user.id;
      const role = req.user.role;
      const vendorId = req.user.vendorId;
      const storeId = req.user.storeId;

      // Find sub-user
      const subUser = await db.subUser.findByPk(subUserId, {
        attributes: ['id', 'vendorId', 'storeId', 'status']
      });

      if (!subUser) {
        return res.status(404).json({
          success: false,
          message: "Sub-user not found",
        });
      }

      // Authorization check: Only vendor/store owner can view their sub-user permissions
      if (role === '2') { // Vendor
        if (subUser.vendorId !== String(vendorId)) {
          return res.status(403).json({
            success: false,
            message: "Access denied: You can only view permissions for your own sub-users",
          });
        }
      } else if (role === '3') { // Store
        if (subUser.storeId !== String(storeId)) {
          return res.status(403).json({
            success: false,
            message: "Access denied: You can only view permissions for your own sub-users",
          });
        }
      }
      

      // Get all permissions for this sub-user
      const permissions = await db.subUserMenuPermission.findAll({
        where: { subUserId },
        attributes: ['menuKey', 'enabled'],
        order: [['menuKey', 'ASC']],
      });

      // Convert to object format expected by frontend
      // Include all valid menu keys, defaulting to false if not found
      const permissionsObject = {};
      VALID_MENU_KEYS.forEach(key => {
        const permission = permissions.find(p => p.menuKey === key);
        permissionsObject[key] = permission ? permission.enabled : false;
      });

      return res.status(200).json({
        success: true,
        data: permissionsObject,
      });
    } catch (error) {
      console.error("Error fetching sub-user menu permissions:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch menu permissions",
        error: error.message,
      });
    }
  },

  // Update menu permission
  async updateSubUserMenuPermission(req, res, next) {
    try {
      const { subUserId } = req.params;
      const { menuKey, enabled } = req.body;
      const userId = req.user.id;
      const role = req.user.role;
      const vendorId = req.user.vendorId;
      const storeId = req.user.storeId;

      // Validation
      if (!menuKey || typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: "Invalid request: menuKey and enabled (boolean) are required",
        });
      }

      // Validate menu key
      if (!VALID_MENU_KEYS.includes(menuKey)) {
        return res.status(400).json({
          success: false,
          message: `Invalid menu key. Valid keys are: ${VALID_MENU_KEYS.join(', ')}`,
        });
      }

      // Find sub-user
      const subUser = await db.subUser.findByPk(subUserId, {
        attributes: ['id', 'vendorId', 'storeId', 'status']
      });

      if (!subUser) {
        return res.status(404).json({
          success: false,
          message: "Sub-user not found",
        });
      }

      // Authorization check
      if (role === '2') { // Vendor
        if (subUser.vendorId !== String(vendorId)) {
          return res.status(403).json({
            success: false,
            message: "Access denied: You can only update permissions for your own sub-users",
          });
        }
      } else if (role === '3') { // Store
        if (subUser.storeId !== String(storeId)) {
          return res.status(403).json({
            success: false,
            message: "Access denied: You can only update permissions for your own sub-users",
          });
        }
      } else if (role !== '0') {
        return res.status(403).json({
          success: false,
          message: "Access denied: Only vendors and stores can update sub-user permissions",
        });
      }

      // Update or create permission
      // Check if permission exists
      let permission = await db.subUserMenuPermission.findOne({
        where: { subUserId, menuKey },
      });

      let created = false;
      if (permission) {
        // Update existing permission
        permission.enabled = Boolean(enabled);
        await permission.save();
      } else {
        // Create new permission
        permission = await db.subUserMenuPermission.create({
          subUserId,
          menuKey,
          enabled: Boolean(enabled),
        });
        created = true;
      }

      return res.status(200).json({
        success: true,
        message: created ? "Permission created successfully" : "Permission updated successfully",
        data: {
          menuKey: permission.menuKey,
          enabled: permission.enabled,
        },
      });
    } catch (error) {
      console.error("Error updating sub-user menu permission:", error);
      
      // Handle unique constraint violation
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          message: "Permission already exists for this sub-user and menu key",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to update menu permission",
        error: error.message,
      });
    }
  },

  // Bulk update permissions
  async bulkUpdateSubUserMenuPermissions(req, res, next) {
    try {
      const { subUserId } = req.params;
      const { permissions } = req.body;
      const userId = req.user.id;
      const role = req.user.role;
      const vendorId = req.user.vendorId;
      const storeId = req.user.storeId;

      // Validation
      if (!permissions || typeof permissions !== 'object') {
        return res.status(400).json({
          success: false,
          message: "Invalid request: permissions object is required",
        });
      }

      // Validate all menu keys
      const invalidKeys = Object.keys(permissions).filter(
        key => !VALID_MENU_KEYS.includes(key)
      );

      if (invalidKeys.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid menu keys: ${invalidKeys.join(', ')}. Valid keys are: ${VALID_MENU_KEYS.join(', ')}`,
        });
      }

      // Validate all values are boolean
      const invalidValues = Object.entries(permissions).filter(
        ([key, value]) => typeof value !== 'boolean'
      );

      if (invalidValues.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid permission values. All values must be boolean. Invalid keys: ${invalidValues.map(([key]) => key).join(', ')}`,
        });
      }

      // Find sub-user
      const subUser = await db.subUser.findByPk(subUserId, {
        attributes: ['id', 'vendorId', 'storeId', 'status']
      });

      if (!subUser) {
        return res.status(404).json({
          success: false,
          message: "Sub-user not found",
        });
      }

      // Authorization check
      if (role === '2') { // Vendor
        if (subUser.vendorId !== String(vendorId)) {
          return res.status(403).json({
            success: false,
            message: "Access denied: You can only update permissions for your own sub-users",
          });
        }
      } else if (role === '3') { // Store
        if (subUser.storeId !== String(storeId)) {
          return res.status(403).json({
            success: false,
            message: "Access denied: You can only update permissions for your own sub-users",
          });
        }
      } else if (role !== '0') {
        return res.status(403).json({
          success: false,
          message: "Access denied: Only vendors and stores can update sub-user permissions",
        });
      }

      // Prepare bulk update operations
      const updatePromises = Object.entries(permissions).map(async ([menuKey, enabled]) => {
        const permission = await db.subUserMenuPermission.findOne({
          where: { subUserId, menuKey },
        });

        if (permission) {
          // Update existing permission
          permission.enabled = Boolean(enabled);
          await permission.save();
        } else {
          // Create new permission
          await db.subUserMenuPermission.create({
            subUserId,
            menuKey,
            enabled: Boolean(enabled),
          });
        }
      });

      // Execute all updates
      await Promise.all(updatePromises);

      // Fetch updated permissions to return
      const updatedPermissions = await db.subUserMenuPermission.findAll({
        where: { subUserId },
        attributes: ['menuKey', 'enabled'],
        order: [['menuKey', 'ASC']],
      });

      // Convert to object format
      const permissionsObject = {};
      VALID_MENU_KEYS.forEach(key => {
        const permission = updatedPermissions.find(p => p.menuKey === key);
        permissionsObject[key] = permission ? permission.enabled : false;
      });

      return res.status(200).json({
        success: true,
        message: "Permissions updated successfully",
        data: permissionsObject,
      });
    } catch (error) {
      console.error("Error bulk updating sub-user menu permissions:", error);
      
      // Handle unique constraint violation
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          message: "Duplicate permission entry",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to update menu permissions",
        error: error.message,
      });
    }
  },
};

