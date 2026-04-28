'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('storeInvoiceFormats', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      storeId: {
        type: Sequelize.INTEGER,
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

    await queryInterface.addIndex('storeInvoiceFormats', ['storeId', 'formatId'], {
      unique: true,
      name: 'unique_store_format'
    });
    await queryInterface.addIndex('storeInvoiceFormats', ['storeId'], {
      name: 'idx_store_id'
    });
    await queryInterface.addIndex('storeInvoiceFormats', ['formatId'], {
      name: 'idx_format_id'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('storeInvoiceFormats');
  }
};

