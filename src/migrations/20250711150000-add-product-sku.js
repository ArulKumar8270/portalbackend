'use strict';

/** Store-facing unique product ID (manual or auto-generated). */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('products');
    if (!table.productSku) {
      await queryInterface.addColumn('products', 'productSku', {
        type: Sequelize.STRING(64),
        allowNull: true,
        unique: true,
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('products');
    if (table.productSku) {
      await queryInterface.removeColumn('products', 'productSku');
    }
  },
};
