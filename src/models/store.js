"use strict";

module.exports = (sequelize, DataTypes) => {
  const Store = sequelize.define(
    "store",
    {
      storename: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // Which delivery partner (if any) this store uses for shipping integration.
      // When null/empty, the system should NOT create Shiprocket shipments for this store.
      deliveryPartner: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      // Shiprocket pickup location NAME (warehouse name) configured in Shiprocket panel.
      // This is not the address text; Shiprocket requires a known pickup location name (e.g. "Primary").
      shiprocketPickupLocation: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      // Trash flag: separates "inactive" from "trashed"
      isTrashed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      storeaddress: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      storedesc: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      ownername: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      owneraddress: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      areaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "areas", // Name of the areas table
          key: "id",
        },
      },
      accountNo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      accountHolderName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bankName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      IFSC: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      branch: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      adharCardNo: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      panCardNo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      GSTNo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      website: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      storeImage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      verifyDocument: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      openTime: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      location: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      closeTime: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {}
  );

  Store.associate = function (models) {
    // Associations can be defined here
    Store.belongsTo(models.area, { foreignKey: "areaId" });
    // models.store.belongsTo(models.product, {
    //   foreignKey: "createdId",
    // });
    // Store.hasMany(models.product, { foreignKey: 'productId' });
    Store.hasMany(models.category, { foreignKey: "id" });
    Store.hasMany(models.product, { foreignKey: "createdId" });
    Store.hasMany(models.store_product, { foreignKey: 'supplierId' });
    // productFeedback model uses `storeId` (not `supplierId`)
    Store.hasMany(models.productFeedback, { foreignKey: 'storeId' });
    models.store.hasMany(models.user, { foreignKey: "storeId" }); // A vendor can have multiple users
    models.store.hasMany(models.product, { foreignKey: "createdId" });
  };

  return Store;
};
