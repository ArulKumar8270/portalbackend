const { Op } = require("sequelize");
const db = require("../../../models");
const { VALID_MENU_KEYS } = require("../../../constants/menuKeys");

module.exports = {
  // Get all menu permissions for a store (Admin only)
  async getStoreMenuPermissions(req, res, next) {
    try {
      const { storeId } = req.params;

      // Find store
      const store = await db.store.findByPk(storeId, {
        attributes: ['id', 'storename', 'email'],
      });

      if (!store) {
        return res.status(404).json({
          success: false,
          message: "Store not found",
        });
      }

      // Get all permissions for this store
      const permissions = await db.storeMenuPermission.findAll({
        where: { storeId },
        attributes: ['menuKey', 'enabled'],
        order: [['menuKey', 'ASC']],
      });

      // Convert to object format expected by frontend
      // Include all valid menu keys, defaulting to true if not found
      const permissionsObject = {};
      VALID_MENU_KEYS.forEach(key => {
        const permission = permissions.find(p => p.menuKey === key);
        permissionsObject[key] = permission ? permission.enabled : true;
      });

      return res.status(200).json({
        success: true,
        data: permissionsObject,
      });
    } catch (error) {
      console.error("Error fetching store menu permissions:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch store menu permissions",
        error: error.message,
      });
    }
  },

  // Update a single menu permission for a store (Admin only)
  async updateStoreMenuPermission(req, res, next) {
    try {
      const { storeId } = req.params;
      const { menuKey, enabled } = req.body;

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

      // Find store
      const store = await db.store.findByPk(storeId, {
        attributes: ['id', 'storename', 'email'],
      });

      if (!store) {
        return res.status(404).json({
          success: false,
          message: "Store not found",
        });
      }

      // Update or create permission (upsert)
      // Check if permission exists
      let permission = await db.storeMenuPermission.findOne({
        where: { storeId, menuKey },
      });

      let created = false;
      if (permission) {
        // Update existing permission
        permission.enabled = Boolean(enabled);
        await permission.save();
      } else {
        // Create new permission
        permission = await db.storeMenuPermission.create({
          storeId,
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
      console.error("Error updating store menu permission:", error);
      
      // Handle unique constraint violation
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          message: "Permission already exists for this store and menu key",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to update store menu permission",
        error: error.message,
      });
    }
  },

  // Bulk update menu permissions for a store (Admin only)
  async bulkUpdateStoreMenuPermissions(req, res, next) {
    try {
      const { storeId } = req.params;
      const { permissions } = req.body;

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

      // Find store
      const store = await db.store.findByPk(storeId, {
        attributes: ['id', 'storename', 'email'],
      });

      if (!store) {
        return res.status(404).json({
          success: false,
          message: "Store not found",
        });
      }

      // Prepare bulk update operations
      const updatePromises = Object.entries(permissions).map(async ([menuKey, enabled]) => {
        const permission = await db.storeMenuPermission.findOne({
          where: { storeId, menuKey },
        });

        if (permission) {
          // Update existing permission
          permission.enabled = Boolean(enabled);
          await permission.save();
        } else {
          // Create new permission
          await db.storeMenuPermission.create({
            storeId,
            menuKey,
            enabled: Boolean(enabled),
          });
        }
      });

      // Execute all updates
      await Promise.all(updatePromises);

      // Fetch updated permissions to return
      const updatedPermissions = await db.storeMenuPermission.findAll({
        where: { storeId },
        attributes: ['menuKey', 'enabled'],
        order: [['menuKey', 'ASC']],
      });

      // Convert to object format
      const permissionsObject = {};
      VALID_MENU_KEYS.forEach(key => {
        const permission = updatedPermissions.find(p => p.menuKey === key);
        permissionsObject[key] = permission ? permission.enabled : true;
      });

      return res.status(200).json({
        success: true,
        message: "Store permissions updated successfully",
        data: permissionsObject,
      });
    } catch (error) {
      console.error("Error bulk updating store menu permissions:", error);
      
      // Handle unique constraint violation
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          message: "Duplicate permission entry",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to update store menu permissions",
        error: error.message,
      });
    }
  },
};

