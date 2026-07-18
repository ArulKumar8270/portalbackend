'use strict';

/** Add pay model fields used by Dashboard One-Day Employees form. */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('store_employees');
    if (!table.payType) {
      await queryInterface.addColumn('store_employees', 'payType', {
        type: Sequelize.STRING(30),
        allowNull: true,
        defaultValue: 'per_order',
      });
    }
    if (!table.payRate) {
      await queryInterface.addColumn('store_employees', 'payRate', {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      });
    }
    if (!table.petrolPrice) {
      await queryInterface.addColumn('store_employees', 'petrolPrice', {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('store_employees');
    if (table.petrolPrice) await queryInterface.removeColumn('store_employees', 'petrolPrice');
    if (table.payRate) await queryInterface.removeColumn('store_employees', 'payRate');
    if (table.payType) await queryInterface.removeColumn('store_employees', 'payType');
  },
};
