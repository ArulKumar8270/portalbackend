'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('bills', 'invoiceFormatId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: 'notes'
    });

    await queryInterface.addIndex('bills', ['invoiceFormatId'], {
      name: 'idx_bill_invoice_format_id'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('bills', 'idx_bill_invoice_format_id');
    await queryInterface.removeColumn('bills', 'invoiceFormatId');
  }
};

