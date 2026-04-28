'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('orders', 'deliveryPartner', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('orders', 'shiprocketOrderId', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('orders', 'shiprocketShipmentId', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('orders', 'shiprocketAwb', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('orders', 'shiprocketCourierName', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('orders', 'shiprocketTrackingUrl', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('orders', 'shiprocketRaw', {
      type: Sequelize.TEXT('long'),
      allowNull: true,
      defaultValue: null,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('orders', 'shiprocketRaw');
    await queryInterface.removeColumn('orders', 'shiprocketTrackingUrl');
    await queryInterface.removeColumn('orders', 'shiprocketCourierName');
    await queryInterface.removeColumn('orders', 'shiprocketAwb');
    await queryInterface.removeColumn('orders', 'shiprocketShipmentId');
    await queryInterface.removeColumn('orders', 'shiprocketOrderId');
    await queryInterface.removeColumn('orders', 'deliveryPartner');
  },
};

