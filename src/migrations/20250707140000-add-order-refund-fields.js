'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const add = async (name, spec) => {
      try {
        await queryInterface.addColumn('orders', name, spec);
      } catch (e) {
        if (!/Duplicate column/i.test(String(e?.message || e))) throw e;
      }
    };
    await add('refundStatus', {
      type: Sequelize.STRING(30),
      allowNull: true,
      defaultValue: 'none',
    });
    await add('refundNote', { type: Sequelize.TEXT, allowNull: true });
    await add('refundedAt', { type: Sequelize.DATE, allowNull: true });
  },

  down: async (queryInterface) => {
    for (const col of ['refundedAt', 'refundNote', 'refundStatus']) {
      try {
        await queryInterface.removeColumn('orders', col);
      } catch {
        /* ignore */
      }
    }
  },
};
