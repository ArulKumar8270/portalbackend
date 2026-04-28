'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('invoiceFormats', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      headerTemplate: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      template: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      footerTemplate: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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

    await queryInterface.addIndex('invoiceFormats', ['isDefault'], {
      name: 'idx_invoice_format_default'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('invoiceFormats');
  }
};

