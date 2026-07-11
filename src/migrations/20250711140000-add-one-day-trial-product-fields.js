'use strict';

/** Trial-only one-day products: optional trial price + delivery charge. */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const products = await queryInterface.describeTable('products');
    const addProductCol = async (name, spec) => {
      if (!products[name]) {
        await queryInterface.addColumn('products', name, spec);
      }
    };

    await addProductCol('oneDayTrialOnly', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await addProductCol('oneDayTrialPrice', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    const orders = await queryInterface.describeTable('orders');
    if (!orders.isOneDayTrial) {
      await queryInterface.addColumn('orders', 'isOneDayTrial', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  down: async (queryInterface) => {
    const products = await queryInterface.describeTable('products');
    if (products.oneDayTrialOnly) {
      await queryInterface.removeColumn('products', 'oneDayTrialOnly');
    }
    if (products.oneDayTrialPrice) {
      await queryInterface.removeColumn('products', 'oneDayTrialPrice');
    }

    const orders = await queryInterface.describeTable('orders');
    if (orders.isOneDayTrial) {
      await queryInterface.removeColumn('orders', 'isOneDayTrial');
    }
  },
};
