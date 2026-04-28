"use strict";
module.exports = (sequelize, DataTypes) => {
  const user = sequelize.define(
    "user",
    {
      firstName: DataTypes.STRING,
      lastName: DataTypes.STRING,
      address: DataTypes.STRING,
      email: DataTypes.STRING,
      phone: DataTypes.STRING,
      role: DataTypes.STRING,
      verify: DataTypes.BOOLEAN,
      password: DataTypes.STRING,
      vendorId: DataTypes.STRING,
      storeId: DataTypes.STRING,
      plan: DataTypes.STRING,
      branches: DataTypes.TEXT, // Store branches as JSON string
      city: DataTypes.STRING,
      gstNumber: DataTypes.STRING,
      logo: DataTypes.STRING,
    },
    {}
  );
  user.associate = function (models) {
    models.user.belongsTo(models.vendor, { foreignKey: "vendorId" }); // A user belongs to one vendor
    models.user.belongsTo(models.store, { foreignKey: "storeId" }); // A user belongs to one vendor
    models.user.hasMany(models.orders, { foreignKey: "custId" }); // A user can have many orders
    models.user.hasMany(models.subscriptions, { foreignKey: "customerId" }); // A user can have many subscriptions
  };
  return user;
};
