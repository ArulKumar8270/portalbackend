"use strict";
module.exports = (sequelize, DataTypes) => {
  const RequestStore = sequelize.define(
    "RequestStore",
    {
      requestId: DataTypes.STRING,
      requesterName: DataTypes.STRING,
      contactPerson: DataTypes.STRING,
      vendorName: DataTypes.INTEGER,
      contactEmail: DataTypes.STRING,
      contactPhone: DataTypes.STRING,
      vendorInformation: DataTypes.STRING,
      billingAddress: DataTypes.STRING,
      paymentMethod: DataTypes.STRING,
      deliverType: DataTypes.STRING,
      requestDate: DataTypes.DATE,
      emergencyContact: DataTypes.STRING,
      deliveryDate: DataTypes.DATE,
      requestType: DataTypes.STRING,
      priority: DataTypes.STRING,
      status: DataTypes.STRING,
      quantity: DataTypes.INTEGER,
      unitPrice: DataTypes.DECIMAL,
      totalCost: DataTypes.DECIMAL,
      serviceDescription: DataTypes.STRING,
      relatedDocuments: DataTypes.STRING,
      legalCompliance: DataTypes.STRING,
      urgencyLevel: DataTypes.STRING,
      shippingInformation: DataTypes.STRING,
    },
    {}
  );
  RequestStore.associate = function (models) {
    // associations can be defined here
    models.vendor.hasMany(models.vendor, { foreignKey: "storename" });
  };
  return RequestStore;
};
