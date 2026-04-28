'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('inventoryProducts', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      vendorId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      storeId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      sku: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      brand: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      unit: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      currentStock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      reorderLevel: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      costPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      sellingPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      photo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'active',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('inventoryProducts', ['vendorId'], {
      name: 'idx_inventory_products_vendorId',
    });
    await queryInterface.addIndex('inventoryProducts', ['storeId'], {
      name: 'idx_inventory_products_storeId',
    });
    await queryInterface.addIndex('inventoryProducts', ['categoryId'], {
      name: 'idx_inventory_products_categoryId',
    });
    await queryInterface.addIndex('inventoryProducts', ['sku'], {
      name: 'idx_inventory_products_sku',
    });
    await queryInterface.addIndex('inventoryProducts', ['status'], {
      name: 'idx_inventory_products_status',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('inventoryProducts');
  }
};

