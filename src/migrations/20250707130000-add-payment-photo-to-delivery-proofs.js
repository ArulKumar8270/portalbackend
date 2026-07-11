'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('one_day_delivery_proofs', 'paymentPhotoUrl', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    } catch (e) {
      if (!/Duplicate column/i.test(String(e?.message || e))) throw e;
    }
  },

  down: async (queryInterface) => {
    try {
      await queryInterface.removeColumn('one_day_delivery_proofs', 'paymentPhotoUrl');
    } catch {
      /* ignore */
    }
  },
};
