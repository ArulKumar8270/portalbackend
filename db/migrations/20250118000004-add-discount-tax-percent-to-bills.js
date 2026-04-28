'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if columns exist before adding them
    const tableDescription = await queryInterface.describeTable('bills');
    
    if (!tableDescription.discountPercent) {
      await queryInterface.addColumn('bills', 'discountPercent', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        after: 'discount'
      });
    }

    if (!tableDescription.taxPercent) {
      await queryInterface.addColumn('bills', 'taxPercent', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        after: 'tax'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('bills', 'discountPercent');
    await queryInterface.removeColumn('bills', 'taxPercent');
  }
};

