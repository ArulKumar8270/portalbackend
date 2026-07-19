'use strict';

module.exports = (sequelize, DataTypes) => {
  const OneDayDeliveryProof = sequelize.define(
    'one_day_delivery_proofs',
    {
      orderId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      employeeId: { type: DataTypes.INTEGER, allowNull: true },
      photoUrl: { type: DataTypes.TEXT, allowNull: true },
      signatureUrl: { type: DataTypes.TEXT, allowNull: true },
      paymentPhotoUrl: { type: DataTypes.TEXT, allowNull: true },
      otpVerifiedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {}
  );

  OneDayDeliveryProof.associate = function (models) {
    OneDayDeliveryProof.belongsTo(models.orders, { foreignKey: 'orderId' });
  };

  return OneDayDeliveryProof;
};
