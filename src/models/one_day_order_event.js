'use strict';

module.exports = (sequelize, DataTypes) => {
  const OneDayOrderEvent = sequelize.define(
    'one_day_order_events',
    {
      orderId: { type: DataTypes.INTEGER, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      employeeId: { type: DataTypes.INTEGER, allowNull: true },
      latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
      longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
      note: { type: DataTypes.TEXT, allowNull: true },
    },
    { timestamps: true }
  );

  OneDayOrderEvent.associate = function (models) {
    OneDayOrderEvent.belongsTo(models.orders, { foreignKey: 'orderId' });
    OneDayOrderEvent.belongsTo(models.store_employees, { foreignKey: 'employeeId' });
  };

  return OneDayOrderEvent;
};
