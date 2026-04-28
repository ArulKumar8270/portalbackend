'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Index for store status queries
    await queryInterface.addIndex('stores', ['status'], {
      name: 'idx_stores_status',
      concurrently: true
    });

    // Index for store_product lookups
    await queryInterface.addIndex('store_products', ['supplierId', 'productId'], {
      name: 'idx_store_products_supplier_product',
      concurrently: true
    });

    // Index for product status and category
    await queryInterface.addIndex('products', ['status', 'categoryId'], {
      name: 'idx_products_status_category',
      concurrently: true
    });

    // Index for product search
    await queryInterface.addIndex('products', ['name'], {
      name: 'idx_products_name',
      concurrently: true,
      using: 'BTREE'
    });

    // Composite index for store hours
    await queryInterface.addIndex('stores', ['openTime', 'closeTime', 'status'], {
      name: 'idx_stores_hours_status',
      concurrently: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('stores', 'idx_stores_status');
    await queryInterface.removeIndex('store_products', 'idx_store_products_supplier_product');
    await queryInterface.removeIndex('products', 'idx_products_status_category');
    await queryInterface.removeIndex('products', 'idx_products_name');
    await queryInterface.removeIndex('stores', 'idx_stores_hours_status');
  }
};
