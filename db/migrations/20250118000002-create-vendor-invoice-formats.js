'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('vendorInvoiceFormats', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      vendorId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      formatId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('vendorInvoiceFormats', ['vendorId', 'formatId'], {
      unique: true,
      name: 'unique_vendor_format'
    });
    await queryInterface.addIndex('vendorInvoiceFormats', ['vendorId'], {
      name: 'idx_vendor_id'
    });
    await queryInterface.addIndex('vendorInvoiceFormats', ['formatId'], {
      name: 'idx_format_id'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('vendorInvoiceFormats');
  }
};

