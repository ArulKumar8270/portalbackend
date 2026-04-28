'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.addColumn('vendors', 'website', {
        type: Sequelize.STRING,
        allowNull: true
      }),
      queryInterface.addColumn('vendors', 'vendorImage', {
        type: Sequelize.STRING,
        allowNull: true
      }),
      queryInterface.addColumn('vendors', 'openTime', {
        type: Sequelize.STRING,
        allowNull: true
      }),
      queryInterface.addColumn('vendors', 'closeTime', {
        type: Sequelize.STRING,
        allowNull: true
      }),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.removeColumn('vendors', 'website'),
      queryInterface.removeColumn('vendors', 'vendorImage'),
      queryInterface.removeColumn('vendors', 'openTime'),
      queryInterface.removeColumn('vendors', 'closeTime'),
    ]);
  }
};
