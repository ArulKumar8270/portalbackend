'use strict';

module.exports = (sequelize, DataTypes) => {
  const StoreEmployee = sequelize.define(
    'store_employees',
    {
      storeId: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      phone: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: true },
      password: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'rider' },
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'active' },
      isOnDuty: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      maxActiveOrders: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
      vehicleType: { type: DataTypes.STRING, allowNull: true },
      payType: { type: DataTypes.STRING, allowNull: true, defaultValue: 'per_order' },
      payRate: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      petrolPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      lastLatitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
      lastLongitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
      lastLocationAt: { type: DataTypes.DATE, allowNull: true },
    },
    {}
  );

  StoreEmployee.associate = function (models) {
    StoreEmployee.belongsTo(models.store, { foreignKey: 'storeId' });
  };

  return StoreEmployee;
};
