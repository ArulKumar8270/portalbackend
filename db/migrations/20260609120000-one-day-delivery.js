'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('stores', 'oneDayDeliveryEnabled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('stores', 'maxDeliveryRadiusKm', {
      type: Sequelize.DECIMAL(8, 2),
      allowNull: true,
      defaultValue: 10,
    });
    await queryInterface.addColumn('stores', 'workingHours', { type: Sequelize.JSON, allowNull: true });
    await queryInterface.addColumn('stores', 'holidayDates', { type: Sequelize.JSON, allowNull: true });
    await queryInterface.addColumn('stores', 'cutoffTime', {
      type: Sequelize.STRING(10),
      allowNull: true,
      defaultValue: '14:00',
    });
    await queryInterface.addColumn('stores', 'deliveryChargeSlabs', { type: Sequelize.JSON, allowNull: true });
    await queryInterface.addColumn('stores', 'storeLatitude', { type: Sequelize.DECIMAL(10, 7), allowNull: true });
    await queryInterface.addColumn('stores', 'storeLongitude', { type: Sequelize.DECIMAL(10, 7), allowNull: true });
    await queryInterface.addColumn('stores', 'sameDayPromiseText', {
      type: Sequelize.STRING(255),
      allowNull: true,
      defaultValue: 'Today by 8 PM',
    });
    await queryInterface.addColumn('stores', 'nextDayPromiseText', {
      type: Sequelize.STRING(255),
      allowNull: true,
      defaultValue: 'Tomorrow by 2 PM',
    });
    await queryInterface.addColumn('stores', 'requireDeliveryOtp', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.addColumn('stores', 'requireDeliveryPhoto', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.addColumn('stores', 'requireDeliverySignature', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('products', 'isOneDayEnabled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('products', 'oneDayPrice', { type: Sequelize.INTEGER, allowNull: true });
    await queryInterface.addColumn('products', 'oneDayMaxQty', { type: Sequelize.INTEGER, allowNull: true });

    await queryInterface.addColumn('orders', 'deliveryType', {
      type: Sequelize.STRING(20),
      allowNull: true,
      defaultValue: 'standard',
    });
    await queryInterface.addColumn('orders', 'assignedEmployeeId', { type: Sequelize.INTEGER, allowNull: true });
    await queryInterface.addColumn('orders', 'oneDayStatus', { type: Sequelize.STRING(30), allowNull: true });
    await queryInterface.addColumn('orders', 'deliveryCharge', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    });
    await queryInterface.addColumn('orders', 'distanceKm', { type: Sequelize.DECIMAL(8, 2), allowNull: true });
    await queryInterface.addColumn('orders', 'promisedDeliveryAt', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn('orders', 'deliveredAt', { type: Sequelize.DATE, allowNull: true });

    await queryInterface.createTable('store_employees', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      storeId: { type: Sequelize.INTEGER, allowNull: false },
      name: { type: Sequelize.STRING(255), allowNull: false },
      phone: { type: Sequelize.STRING(20), allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: true },
      password: { type: Sequelize.STRING(255), allowNull: false },
      role: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'rider' },
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'active' },
      isOnDuty: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      maxActiveOrders: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 3 },
      vehicleType: { type: Sequelize.STRING(50), allowNull: true },
      lastLatitude: { type: Sequelize.DECIMAL(10, 7), allowNull: true },
      lastLongitude: { type: Sequelize.DECIMAL(10, 7), allowNull: true },
      lastLocationAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('one_day_order_events', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      orderId: { type: Sequelize.INTEGER, allowNull: false },
      status: { type: Sequelize.STRING(30), allowNull: false },
      employeeId: { type: Sequelize.INTEGER, allowNull: true },
      latitude: { type: Sequelize.DECIMAL(10, 7), allowNull: true },
      longitude: { type: Sequelize.DECIMAL(10, 7), allowNull: true },
      note: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('one_day_delivery_proofs', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      orderId: { type: Sequelize.INTEGER, allowNull: false, unique: true },
      employeeId: { type: Sequelize.INTEGER, allowNull: true },
      photoUrl: { type: Sequelize.TEXT, allowNull: true },
      signatureUrl: { type: Sequelize.TEXT, allowNull: true },
      otpVerifiedAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('one_day_otps', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      orderId: { type: Sequelize.INTEGER, allowNull: false },
      otp: { type: Sequelize.STRING(10), allowNull: false },
      expiresAt: { type: Sequelize.DATE, allowNull: false },
      verifiedAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('one_day_location_pings', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      employeeId: { type: Sequelize.INTEGER, allowNull: false },
      orderId: { type: Sequelize.INTEGER, allowNull: true },
      latitude: { type: Sequelize.DECIMAL(10, 7), allowNull: false },
      longitude: { type: Sequelize.DECIMAL(10, 7), allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('one_day_location_pings');
    await queryInterface.dropTable('one_day_otps');
    await queryInterface.dropTable('one_day_delivery_proofs');
    await queryInterface.dropTable('one_day_order_events');
    await queryInterface.dropTable('store_employees');

    for (const col of ['deliveredAt', 'promisedDeliveryAt', 'distanceKm', 'deliveryCharge', 'oneDayStatus', 'assignedEmployeeId', 'deliveryType']) {
      await queryInterface.removeColumn('orders', col);
    }
    for (const col of ['oneDayMaxQty', 'oneDayPrice', 'isOneDayEnabled']) {
      await queryInterface.removeColumn('products', col);
    }
    for (const col of [
      'requireDeliverySignature', 'requireDeliveryPhoto', 'requireDeliveryOtp',
      'nextDayPromiseText', 'sameDayPromiseText', 'storeLongitude', 'storeLatitude',
      'deliveryChargeSlabs', 'cutoffTime', 'holidayDates', 'workingHours',
      'maxDeliveryRadiusKm', 'oneDayDeliveryEnabled',
    ]) {
      await queryInterface.removeColumn('stores', col);
    }
  },
};
