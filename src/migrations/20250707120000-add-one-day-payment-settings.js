'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = 'stores';
    const add = async (name, spec) => {
      try {
        await queryInterface.addColumn(table, name, spec);
      } catch (e) {
        if (!/Duplicate column/i.test(String(e?.message || e))) throw e;
      }
    };
    await add('oneDayPaymentQrUrl', { type: Sequelize.TEXT, allowNull: true });
    await add('oneDayUpiId', { type: Sequelize.STRING(120), allowNull: true });
    await add('oneDayReturnPolicyUrl', { type: Sequelize.TEXT, allowNull: true });
    await add('oneDayReturnPolicyText', { type: Sequelize.TEXT, allowNull: true });
    await add('oneDayPaymentReturnNote', { type: Sequelize.TEXT, allowNull: true });
  },

  down: async (queryInterface) => {
    const table = 'stores';
    const drop = async (name) => {
      try {
        await queryInterface.removeColumn(table, name);
      } catch {
        /* ignore */
      }
    };
    await drop('oneDayPaymentQrUrl');
    await drop('oneDayUpiId');
    await drop('oneDayReturnPolicyUrl');
    await drop('oneDayReturnPolicyText');
    await drop('oneDayPaymentReturnNote');
  },
};
