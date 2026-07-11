'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const addStore = async (name, spec) => {
      try {
        await queryInterface.addColumn('stores', name, spec);
      } catch (e) {
        if (!/Duplicate column/i.test(String(e?.message || e))) throw e;
      }
    };
    const addProduct = async (name, spec) => {
      try {
        await queryInterface.addColumn('products', name, spec);
      } catch (e) {
        if (!/Duplicate column/i.test(String(e?.message || e))) throw e;
      }
    };
    const addOrder = async (name, spec) => {
      try {
        await queryInterface.addColumn('orders', name, spec);
      } catch (e) {
        if (!/Duplicate column/i.test(String(e?.message || e))) throw e;
      }
    };

    await addStore('rentalEnabled', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    await addStore('rentalBillingMode', { type: Sequelize.STRING(20), allowNull: true, defaultValue: 'auto' });
    await addStore('rentalAdvancePercent', { type: Sequelize.INTEGER, allowNull: true, defaultValue: 30 });
    await addStore('rentalMinLeadTimeHours', { type: Sequelize.INTEGER, allowNull: true, defaultValue: 2 });
    await addStore('rentalMaxAdvanceBookingDays', { type: Sequelize.INTEGER, allowNull: true, defaultValue: 90 });
    await addStore('rentalWorkingHours', { type: Sequelize.JSON, allowNull: true });
    await addStore('rentalHolidayDates', { type: Sequelize.JSON, allowNull: true });
    await addStore('rentalTermsUrl', { type: Sequelize.TEXT, allowNull: true });
    await addStore('rentalCancellationPolicy', { type: Sequelize.TEXT, allowNull: true });
    await addStore('rentalPaymentQrUrl', { type: Sequelize.TEXT, allowNull: true });
    await addStore('rentalUpiId', { type: Sequelize.STRING(120), allowNull: true });
    await addStore('rentalRequireIdProof', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true });

    await addProduct('isRentalEnabled', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    await addProduct('rentalPricePerHour', { type: Sequelize.INTEGER, allowNull: true });
    await addProduct('rentalPricePerDay', { type: Sequelize.INTEGER, allowNull: true });
    await addProduct('rentalMinDurationHours', { type: Sequelize.INTEGER, allowNull: true, defaultValue: 1 });
    await addProduct('rentalMaxDurationDays', { type: Sequelize.INTEGER, allowNull: true, defaultValue: 30 });

    await addOrder('rentalStatus', { type: Sequelize.STRING(30), allowNull: true });
    await addOrder('rentalSource', { type: Sequelize.STRING(20), allowNull: true });
    await addOrder('rentalCatalogItemId', { type: Sequelize.INTEGER, allowNull: true });
    await addOrder('rentalStartAt', { type: Sequelize.DATE, allowNull: true });
    await addOrder('rentalEndAt', { type: Sequelize.DATE, allowNull: true });
    await addOrder('rentalTotalAmount', { type: Sequelize.INTEGER, allowNull: true });
    await addOrder('rentalAdvancePercent', { type: Sequelize.INTEGER, allowNull: true });
    await addOrder('rentalAdvanceAmount', { type: Sequelize.INTEGER, allowNull: true });
    await addOrder('rentalBalanceAmount', { type: Sequelize.INTEGER, allowNull: true });
    await addOrder('rentalBalancePaidAt', { type: Sequelize.DATE, allowNull: true });

    await queryInterface.createTable('rental_catalog_items', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      storeId: { type: Sequelize.INTEGER, allowNull: false },
      name: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      photoUrl: { type: Sequelize.TEXT, allowNull: true },
      pricePerHour: { type: Sequelize.INTEGER, allowNull: true },
      pricePerDay: { type: Sequelize.INTEGER, allowNull: true },
      minDurationHours: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 1 },
      maxDurationDays: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 30 },
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'active' },
      sortOrder: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('rental_booking_proofs', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      orderId: { type: Sequelize.INTEGER, allowNull: false, unique: true },
      bookerName: { type: Sequelize.STRING(255), allowNull: true },
      bookerPhone: { type: Sequelize.STRING(30), allowNull: true },
      idProofUrl: { type: Sequelize.TEXT, allowNull: true },
      paymentProofUrl: { type: Sequelize.TEXT, allowNull: true },
      paymentMethod: { type: Sequelize.STRING(30), allowNull: true },
      paymentReference: { type: Sequelize.STRING(120), allowNull: true },
      reviewedAt: { type: Sequelize.DATE, allowNull: true },
      reviewedBy: { type: Sequelize.INTEGER, allowNull: true },
      rejectReason: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('rental_booking_events', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      orderId: { type: Sequelize.INTEGER, allowNull: false },
      status: { type: Sequelize.STRING(30), allowNull: false },
      note: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('rental_booking_events');
    await queryInterface.dropTable('rental_booking_proofs');
    await queryInterface.dropTable('rental_catalog_items');
    for (const col of [
      'rentalBalancePaidAt', 'rentalBalanceAmount', 'rentalAdvanceAmount', 'rentalAdvancePercent',
      'rentalTotalAmount', 'rentalEndAt', 'rentalStartAt', 'rentalCatalogItemId', 'rentalSource', 'rentalStatus',
    ]) {
      try { await queryInterface.removeColumn('orders', col); } catch { /* ignore */ }
    }
    for (const col of [
      'rentalMaxDurationDays', 'rentalMinDurationHours', 'rentalPricePerDay', 'rentalPricePerHour', 'isRentalEnabled',
    ]) {
      try { await queryInterface.removeColumn('products', col); } catch { /* ignore */ }
    }
    for (const col of [
      'rentalRequireIdProof', 'rentalUpiId', 'rentalPaymentQrUrl', 'rentalCancellationPolicy', 'rentalTermsUrl',
      'rentalHolidayDates', 'rentalWorkingHours', 'rentalMaxAdvanceBookingDays', 'rentalMinLeadTimeHours',
      'rentalAdvancePercent', 'rentalBillingMode', 'rentalEnabled',
    ]) {
      try { await queryInterface.removeColumn('stores', col); } catch { /* ignore */ }
    }
  },
};
