"use strict";
module.exports = (sequelize, DataTypes) => {
  const vendor = sequelize.define(
    "vendor",
    {
      storename: DataTypes.STRING,
      status: DataTypes.INTEGER,
      shopaddress: DataTypes.TEXT,
      shopdesc: DataTypes.TEXT,
      location: DataTypes.STRING,
      ownername: DataTypes.STRING,
      owneraddress: DataTypes.TEXT,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      phone: DataTypes.TEXT,
      areaId: DataTypes.INTEGER,
      accountNo: DataTypes.STRING,
      accountHolderName: DataTypes.STRING,
      bankName: DataTypes.STRING,
      IFSC: DataTypes.STRING,
      branch: DataTypes.STRING,
      adharCardNo: DataTypes.INTEGER,
      panCardNo: DataTypes.STRING,
      GSTNo: DataTypes.STRING,
      website: DataTypes.STRING,
      vendorImage: DataTypes.STRING,
      openTime: DataTypes.STRING,
      closeTime: DataTypes.STRING,
      plan: DataTypes.STRING,
    },
    {}
  );
  vendor.associate = function (models) {
    models.vendor.belongsTo(models.area, { foreignKey: "areaId" });
    models.vendor.hasMany(models.vendor_product, { foreignKey: "supplierId" });
    models.vendor.hasMany(models.vendorStock, { foreignKey: "vendorId" });
    models.vendor.hasMany(models.productFeedback, { foreignKey: "vendorId" });
    models.vendor.hasMany(models.user, { foreignKey: "vendorId" }); // A vendor can have multiple users
  };
  return vendor;
};
