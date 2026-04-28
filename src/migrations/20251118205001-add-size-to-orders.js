'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.addColumn('orders', 'size', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn('orders', 'unitSize', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn('orders', 'sizeDetails', {
        type: Sequelize.JSON,
        allowNull: true,
      }),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.removeColumn('orders', 'size'),
      queryInterface.removeColumn('orders', 'unitSize'),
      queryInterface.removeColumn('orders', 'sizeDetails'),
    ]);
  },
};

