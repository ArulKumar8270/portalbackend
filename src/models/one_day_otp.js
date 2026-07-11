'use strict';

module.exports = (sequelize, DataTypes) => {
  const OneDayOtp = sequelize.define(
    'one_day_otps',
    {
      orderId: { type: DataTypes.INTEGER, allowNull: false },
      otp: { type: DataTypes.STRING, allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      verifiedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {}
  );

  OneDayOtp.associate = function (models) {
    OneDayOtp.belongsTo(models.orders, { foreignKey: 'orderId' });
  };

  return OneDayOtp;
};
