'use strict';

module.exports = (sequelize, DataTypes) => {
  const OneDayLocationPing = sequelize.define(
    'one_day_location_pings',
    {
      employeeId: { type: DataTypes.INTEGER, allowNull: false },
      orderId: { type: DataTypes.INTEGER, allowNull: true },
      latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
      longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
    },
    { updatedAt: true, createdAt: true }
  );

  OneDayLocationPing.associate = function (models) {
    OneDayLocationPing.belongsTo(models.store_employees, { foreignKey: 'employeeId' });
    OneDayLocationPing.belongsTo(models.orders, { foreignKey: 'orderId' });
  };

  return OneDayLocationPing;
};
