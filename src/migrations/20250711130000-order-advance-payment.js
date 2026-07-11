'use strict';

/** Advance payment fields for standard & one-day orders (39% online, balance on delivery). */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const add = async (name, spec) => {
      try {
        await queryInterface.addColumn('orders', name, spec);
      } catch (e) {
        if (!/Duplicate column/i.test(String(e?.message || e))) throw e;
      }
    };
    await add('orderAdvancePercent', { type: Sequelize.INTEGER, allowNull: true });
    await add('orderAdvanceAmount', { type: Sequelize.INTEGER, allowNull: true });
    await add('orderBalanceAmount', { type: Sequelize.INTEGER, allowNull: true });
    await add('orderAdvancePaidAt', { type: Sequelize.DATE, allowNull: true });
  },

  down: async (queryInterface) => {
    for (const col of [
      'orderAdvancePaidAt',
      'orderBalanceAmount',
      'orderAdvanceAmount',
      'orderAdvancePercent',
    ]) {
      try {
        await queryInterface.removeColumn('orders', col);
      } catch {
        /* ignore */
      }
    }
  },
};
