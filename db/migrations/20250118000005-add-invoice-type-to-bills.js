'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column exists before adding it
    const tableDescription = await queryInterface.describeTable('bills');
    
    if (!tableDescription.invoiceType) {
      await queryInterface.addColumn('bills', 'invoiceType', {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'Invoice',
        after: 'invoiceFormatId'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('bills', 'invoiceType');
  }
};

