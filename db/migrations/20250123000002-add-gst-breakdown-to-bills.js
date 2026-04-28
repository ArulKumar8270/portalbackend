'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column exists before adding it
    const tableDescription = await queryInterface.describeTable('bills');
    
    // GST Breakdown Information (stored as JSON)
    if (!tableDescription.gstBreakdown) {
      await queryInterface.addColumn('bills', 'gstBreakdown', {
        type: Sequelize.JSON,
        allowNull: true,
        after: 'termsConditions'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('bills');
    
    // Remove column
    if (tableDescription.gstBreakdown) {
      await queryInterface.removeColumn('bills', 'gstBreakdown');
    }
  }
};
