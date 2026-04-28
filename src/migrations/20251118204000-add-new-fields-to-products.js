'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.addColumn('products', 'grandTotal', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      }),
      queryInterface.addColumn('products', 'size', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn('products', 'weight', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn('products', 'sizeUnitSizeMap', {
        type: Sequelize.JSON,
        allowNull: true,
      }),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.removeColumn('products', 'grandTotal'),
      queryInterface.removeColumn('products', 'size'),
      queryInterface.removeColumn('products', 'weight'),
      queryInterface.removeColumn('products', 'sizeUnitSizeMap'),
    ]);
  },
};

