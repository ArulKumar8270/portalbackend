'use strict';

/** Add one-day delivery columns to orders (safe if columns already exist). */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('orders');
    const add = async (name, spec) => {
      if (!table[name]) {
        await queryInterface.addColumn('orders', name, spec);
      }
    };

    await add('deliveryType', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'standard',
    });
    await add('assignedEmployeeId', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await add('oneDayStatus', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await add('deliveryCharge', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    });
    await add('distanceKm', {
      type: Sequelize.DECIMAL(8, 2),
      allowNull: true,
    });
    await add('promisedDeliveryAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await add('deliveredAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('orders');
    const drop = async (name) => {
      if (table[name]) {
        await queryInterface.removeColumn('orders', name);
      }
    };
    await drop('deliveredAt');
    await drop('promisedDeliveryAt');
    await drop('distanceKm');
    await drop('deliveryCharge');
    await drop('oneDayStatus');
    await drop('assignedEmployeeId');
    await drop('deliveryType');
  },
};
