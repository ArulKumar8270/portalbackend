'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if columns exist before adding them
    const tableDescription = await queryInterface.describeTable('bills');
    
    // Billing Information
    if (!tableDescription.billingAddress) {
      await queryInterface.addColumn('bills', 'billingAddress', {
        type: Sequelize.TEXT,
        allowNull: true,
        after: 'customerPhone'
      });
    }

    if (!tableDescription.billingGSTIN) {
      await queryInterface.addColumn('bills', 'billingGSTIN', {
        type: Sequelize.STRING(50),
        allowNull: true,
        after: 'billingAddress'
      });
    }

    // Shipping Information
    if (!tableDescription.shippingCompanyName) {
      await queryInterface.addColumn('bills', 'shippingCompanyName', {
        type: Sequelize.STRING(255),
        allowNull: true,
        after: 'billingGSTIN'
      });
    }

    if (!tableDescription.shippingAddress) {
      await queryInterface.addColumn('bills', 'shippingAddress', {
        type: Sequelize.TEXT,
        allowNull: true,
        after: 'shippingCompanyName'
      });
    }

    // Invoice Information
    if (!tableDescription.invoiceNumber) {
      await queryInterface.addColumn('bills', 'invoiceNumber', {
        type: Sequelize.STRING(100),
        allowNull: true,
        after: 'invoiceType'
      });
    }

    if (!tableDescription.invoiceDate) {
      await queryInterface.addColumn('bills', 'invoiceDate', {
        type: Sequelize.DATE,
        allowNull: true,
        after: 'invoiceNumber'
      });
    }

    if (!tableDescription.poNumber) {
      await queryInterface.addColumn('bills', 'poNumber', {
        type: Sequelize.STRING(100),
        allowNull: true,
        after: 'invoiceDate'
      });
    }

    if (!tableDescription.poDate) {
      await queryInterface.addColumn('bills', 'poDate', {
        type: Sequelize.DATE,
        allowNull: true,
        after: 'poNumber'
      });
    }

    // Tax Information
    if (!tableDescription.totalCGST) {
      await queryInterface.addColumn('bills', 'totalCGST', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        after: 'total'
      });
    }

    if (!tableDescription.totalSGST) {
      await queryInterface.addColumn('bills', 'totalSGST', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        after: 'totalCGST'
      });
    }

    // Add indexes for better query performance
    if (!tableDescription.invoiceDate) {
      await queryInterface.addIndex('bills', ['invoiceDate'], {
        name: 'idx_bills_invoice_date'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('bills');
    
    // Remove indexes first
    try {
      await queryInterface.removeIndex('bills', 'idx_bills_invoice_date');
    } catch (e) {
      // Index might not exist
    }

    // Remove columns
    if (tableDescription.totalSGST) {
      await queryInterface.removeColumn('bills', 'totalSGST');
    }
    if (tableDescription.totalCGST) {
      await queryInterface.removeColumn('bills', 'totalCGST');
    }
    if (tableDescription.poDate) {
      await queryInterface.removeColumn('bills', 'poDate');
    }
    if (tableDescription.poNumber) {
      await queryInterface.removeColumn('bills', 'poNumber');
    }
    if (tableDescription.invoiceDate) {
      await queryInterface.removeColumn('bills', 'invoiceDate');
    }
    if (tableDescription.invoiceNumber) {
      await queryInterface.removeColumn('bills', 'invoiceNumber');
    }
    if (tableDescription.shippingAddress) {
      await queryInterface.removeColumn('bills', 'shippingAddress');
    }
    if (tableDescription.shippingCompanyName) {
      await queryInterface.removeColumn('bills', 'shippingCompanyName');
    }
    if (tableDescription.billingGSTIN) {
      await queryInterface.removeColumn('bills', 'billingGSTIN');
    }
    if (tableDescription.billingAddress) {
      await queryInterface.removeColumn('bills', 'billingAddress');
    }
  }
};
