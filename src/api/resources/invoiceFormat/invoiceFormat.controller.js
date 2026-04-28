const db = require("../../../models");
const { Op } = require("sequelize");

module.exports = {
  // Get all invoice formats
  async getAllFormats(req, res, next) {
    try {
      const formats = await db.invoiceFormat.findAll({
        order: [['isDefault', 'DESC'], ['createdAt', 'DESC']],
      });

      return res.status(200).json({
        success: true,
        data: formats,
        count: formats.length,
      });
    } catch (error) {
      console.error("Error fetching invoice formats:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch invoice formats",
        error: error.message,
      });
    }
  },

  // Get invoice format by ID
  async getFormatById(req, res, next) {
    try {
      const { id } = req.params;

      const format = await db.invoiceFormat.findByPk(id);

      if (!format) {
        return res.status(404).json({
          success: false,
          message: "Invoice format not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: format,
      });
    } catch (error) {
      console.error("Error fetching invoice format:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch invoice format",
        error: error.message,
      });
    }
  },

  // Create invoice format
  async createFormat(req, res, next) {
    try {
      console.log("========== CREATE FORMAT REQUEST ==========");
      console.log("Request body:", JSON.stringify(req.body).substring(0, 500));
      console.log("Request body keys:", Object.keys(req.body || {}));
      console.log("Content-Type:", req.headers['content-type']);
      console.log("===========================================");

      const { name, description, headerTemplate, template, footerTemplate, isDefault } = req.body;

      console.log("Extracted values:");
      console.log("- name:", name ? name.substring(0, 50) : "undefined");
      console.log("- template:", template ? template.substring(0, 50) : "undefined");
      console.log("- headerTemplate:", headerTemplate ? headerTemplate.substring(0, 50) : "undefined");
      console.log("- footerTemplate:", footerTemplate ? footerTemplate.substring(0, 50) : "undefined");
      console.log("- isDefault:", isDefault);

      // Validate required fields
      if (!name || !template) {
        return res.status(400).json({
          success: false,
          message: "Name and template are required fields",
          debug: {
            receivedName: !!name,
            receivedTemplate: !!template,
            bodyKeys: Object.keys(req.body || {}),
          },
        });
      }

      // If setting as default, unset other defaults
      if (isDefault) {
        await db.invoiceFormat.update(
          { isDefault: false },
          { where: {} }
        );
      }

      const format = await db.invoiceFormat.create({
        name: name.trim(),
        description: description ? description.trim() : null,
        headerTemplate: headerTemplate ? headerTemplate.trim() : null,
        template: template.trim(),
        footerTemplate: footerTemplate ? footerTemplate.trim() : null,
        isDefault: isDefault || false,
      });

      return res.status(201).json({
        success: true,
        message: "Invoice format created successfully",
        data: format,
      });
    } catch (error) {
      console.error("Error creating invoice format:", error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          message: "Invoice format with this name already exists",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to create invoice format",
        error: error.message,
      });
    }
  },

  // Update invoice format
  async updateFormat(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, headerTemplate, template, footerTemplate, isDefault } = req.body;

      const format = await db.invoiceFormat.findByPk(id);

      if (!format) {
        return res.status(404).json({
          success: false,
          message: "Invoice format not found",
        });
      }

      // If setting as default, unset other defaults
      if (isDefault && !format.isDefault) {
        await db.invoiceFormat.update(
          { isDefault: false },
          { where: { id: { [Op.ne]: id } } }
        );
      }

      // Update fields
      if (name !== undefined) format.name = name;
      if (description !== undefined) format.description = description;
      if (headerTemplate !== undefined) format.headerTemplate = headerTemplate;
      if (template !== undefined) format.template = template;
      if (footerTemplate !== undefined) format.footerTemplate = footerTemplate;
      if (isDefault !== undefined) format.isDefault = isDefault;

      await format.save();

      return res.status(200).json({
        success: true,
        message: "Invoice format updated successfully",
        data: format,
      });
    } catch (error) {
      console.error("Error updating invoice format:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update invoice format",
        error: error.message,
      });
    }
  },

  // Delete invoice format
  async deleteFormat(req, res, next) {
    try {
      const { id } = req.params;

      const format = await db.invoiceFormat.findByPk(id);

      if (!format) {
        return res.status(404).json({
          success: false,
          message: "Invoice format not found",
        });
      }

      // Check if it's the default format
      if (format.isDefault) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete the default invoice format",
        });
      }

      // Check if format is assigned to any store
      const storeAssignments = await db.storeInvoiceFormat.count({
        where: { formatId: id },
      });

      if (storeAssignments > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete invoice format. It is assigned to ${storeAssignments} store(s).`,
        });
      }

      // Check if format is assigned to any vendor
      const vendorAssignments = await db.vendorInvoiceFormat.count({
        where: { formatId: id },
      });

      if (vendorAssignments > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete invoice format. It is assigned to ${vendorAssignments} vendor(s).`,
        });
      }

      // Check if format is used in any bills
      const billsCount = await db.bill.count({
        where: { invoiceFormatId: id },
      });

      if (billsCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete invoice format. It is used in ${billsCount} bill(s).`,
        });
      }

      await format.destroy();

      return res.status(200).json({
        success: true,
        message: "Invoice format deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting invoice format:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete invoice format",
        error: error.message,
      });
    }
  },

  // Get store invoice format
  async getStoreFormat(req, res, next) {
    try {
      const { storeId } = req.params;

      const assignment = await db.storeInvoiceFormat.findOne({
        where: { storeId },
        include: [
          {
            model: db.invoiceFormat,
            as: 'format',
          },
        ],
      });

      if (!assignment) {
        // Return default format if no assignment
        const defaultFormat = await db.invoiceFormat.findOne({
          where: { isDefault: true },
        });

        return res.status(200).json({
          success: true,
          data: defaultFormat ? {
            storeId: parseInt(storeId),
            formatId: defaultFormat.id,
            format: defaultFormat,
          } : null,
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          storeId: assignment.storeId,
          formatId: assignment.formatId,
          format: assignment.format,
        },
      });
    } catch (error) {
      console.error("Error fetching store invoice format:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch store invoice format",
        error: error.message,
      });
    }
  },

  // Assign invoice format to store
  async assignStoreFormat(req, res, next) {
    try {
      const { storeId } = req.params;
      const { formatId } = req.body;

      if (!formatId) {
        return res.status(400).json({
          success: false,
          message: "formatId is required",
        });
      }

      // Check if format exists
      const format = await db.invoiceFormat.findByPk(formatId);
      if (!format) {
        return res.status(404).json({
          success: false,
          message: "Invoice format not found",
        });
      }

      // Check if store exists
      const store = await db.store.findByPk(storeId);
      if (!store) {
        return res.status(404).json({
          success: false,
          message: "Store not found",
        });
      }

      // Create or update assignment
      const [assignment, created] = await db.storeInvoiceFormat.findOrCreate({
        where: { storeId },
        defaults: { formatId },
      });

      if (!created) {
        assignment.formatId = formatId;
        await assignment.save();
      }

      return res.status(200).json({
        success: true,
        message: "Invoice format assigned to store successfully",
        data: {
          storeId: assignment.storeId,
          formatId: assignment.formatId,
        },
      });
    } catch (error) {
      console.error("Error assigning store invoice format:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to assign invoice format to store",
        error: error.message,
      });
    }
  },

  // Get vendor invoice format
  async getVendorFormat(req, res, next) {
    try {
      const { vendorId } = req.params;

      const assignment = await db.vendorInvoiceFormat.findOne({
        where: { vendorId: String(vendorId) },
        include: [
          {
            model: db.invoiceFormat,
            as: 'format',
          },
        ],
      });

      if (!assignment) {
        // Return default format if no assignment
        const defaultFormat = await db.invoiceFormat.findOne({
          where: { isDefault: true },
        });

        return res.status(200).json({
          success: true,
          data: defaultFormat ? {
            vendorId: String(vendorId),
            formatId: defaultFormat.id,
            format: defaultFormat,
          } : null,
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          vendorId: assignment.vendorId,
          formatId: assignment.formatId,
          format: assignment.format,
        },
      });
    } catch (error) {
      console.error("Error fetching vendor invoice format:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch vendor invoice format",
        error: error.message,
      });
    }
  },

  // Assign invoice format to vendor
  async assignVendorFormat(req, res, next) {
    try {
      const { vendorId } = req.params;
      const { formatId } = req.body;

      if (!formatId) {
        return res.status(400).json({
          success: false,
          message: "formatId is required",
        });
      }

      // Check if format exists
      const format = await db.invoiceFormat.findByPk(formatId);
      if (!format) {
        return res.status(404).json({
          success: false,
          message: "Invoice format not found",
        });
      }

      // Check if vendor exists
      const vendor = await db.vendor.findByPk(String(vendorId));
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Vendor not found",
        });
      }

      // Create or update assignment
      const [assignment, created] = await db.vendorInvoiceFormat.findOrCreate({
        where: { vendorId: String(vendorId) },
        defaults: { formatId },
      });

      if (!created) {
        assignment.formatId = formatId;
        await assignment.save();
      }

      return res.status(200).json({
        success: true,
        message: "Invoice format assigned to vendor successfully",
        data: {
          vendorId: assignment.vendorId,
          formatId: assignment.formatId,
        },
      });
    } catch (error) {
      console.error("Error assigning vendor invoice format:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to assign invoice format to vendor",
        error: error.message,
      });
    }
  },

  // Get all invoice format assignments
  async getAssignments(req, res, next) {
    try {
      // Get all store assignments
      const storeAssignments = await db.storeInvoiceFormat.findAll({
        include: [
          {
            model: db.store,
            as: 'store',
            attributes: ['id', 'storename'],
            required: false,
          },
          {
            model: db.invoiceFormat,
            as: 'format',
            attributes: ['id', 'name', 'isDefault'],
            required: false,
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      // Get all vendor assignments
      const vendorAssignments = await db.vendorInvoiceFormat.findAll({
        include: [
          {
            model: db.vendor,
            as: 'vendor',
            attributes: ['id', 'storename'],
            required: false,
          },
          {
            model: db.invoiceFormat,
            as: 'format',
            attributes: ['id', 'name', 'isDefault'],
            required: false,
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      // Format the response
      const formattedStoreAssignments = storeAssignments.map(assignment => ({
        id: assignment.id,
        type: 'store',
        storeId: assignment.storeId,
        formatId: assignment.formatId,
        store: assignment.store ? {
          id: assignment.store.id,
          name: assignment.store.storename,
        } : null,
        format: assignment.format ? {
          id: assignment.format.id,
          name: assignment.format.name,
          isDefault: assignment.format.isDefault,
        } : null,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
      }));

      const formattedVendorAssignments = vendorAssignments.map(assignment => ({
        id: assignment.id,
        type: 'vendor',
        vendorId: assignment.vendorId,
        formatId: assignment.formatId,
        vendor: assignment.vendor ? {
          id: assignment.vendor.id,
          name: assignment.vendor.storename,
        } : null,
        format: assignment.format ? {
          id: assignment.format.id,
          name: assignment.format.name,
          isDefault: assignment.format.isDefault,
        } : null,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
      }));

      return res.status(200).json({
        success: true,
        data: {
          stores: formattedStoreAssignments,
          vendors: formattedVendorAssignments,
          total: formattedStoreAssignments.length + formattedVendorAssignments.length,
        },
        count: {
          stores: formattedStoreAssignments.length,
          vendors: formattedVendorAssignments.length,
        },
      });
    } catch (error) {
      console.error("Error fetching invoice format assignments:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch invoice format assignments",
        error: error.message,
      });
    }
  },
};

