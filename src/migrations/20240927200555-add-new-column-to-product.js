'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('products', 'isEnableEcommerce', {
      type: Sequelize.STRING,
      allowNull: true, // adjust according to your needs
    });
    await queryInterface.addColumn('products', 'isEnableCustomize', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0, // default value if needed
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('products', 'isEnableEcommerce');
    await queryInterface.removeColumn('products', 'isEnableCustomize');
  },
};
