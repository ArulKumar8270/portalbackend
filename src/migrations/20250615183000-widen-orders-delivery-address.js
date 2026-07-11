'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('orders', 'deliveryAddress', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('orders', 'deliveryAddress', {
      type: Sequelize.STRING(300),
      allowNull: true,
    });
  },
};
