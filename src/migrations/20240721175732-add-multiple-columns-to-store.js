'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'vendorId', {
      type: Sequelize.STRING,
      allowNull: true, // or false depending on your requirement
      defaultValue: '', // optional, provide a default value if needed
    });
    await queryInterface.addColumn('users', 'storeId', {
      type: Sequelize.STRING,
      allowNull: true, // or false depending on your requirement
      defaultValue: '', // optional, provide a default value if needed
    });
    await queryInterface.addColumn('users', 'plan', {
      type: Sequelize.STRING,
      allowNull: true, // or false depending on your requirement
      defaultValue: '', // optional, provide a default value if needed
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'vendorId');
    await queryInterface.removeColumn('users', 'storeId');
    await queryInterface.removeColumn('users', 'plan');
  }
};
