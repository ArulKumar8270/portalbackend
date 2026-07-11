'use strict';

/** Package height (cm) for courier / shipping integrations. */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('products');
    if (!table.height) {
      await queryInterface.addColumn('products', 'height', {
        type: Sequelize.STRING(32),
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('products');
    if (table.height) {
      await queryInterface.removeColumn('products', 'height');
    }
  },
};
