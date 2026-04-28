"use strict";

module.exports = (sequelize, DataTypes) => {
  const inventoryProduct = sequelize.define(
    "inventoryProduct",
    {
      vendorId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      storeId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sku: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      brand: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: true, // e.g., "kg", "liters", "pieces"
      },
      currentStock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      reorderLevel: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      costPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      sellingPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      photo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "active", // active, inactive
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "inventoryProducts",
    }
  );

  inventoryProduct.associate = function (models) {
    inventoryProduct.belongsTo(models.vendor, {
      foreignKey: "vendorId",
      as: "vendor",
    });
    inventoryProduct.belongsTo(models.store, {
      foreignKey: "storeId",
      as: "store",
    });
    inventoryProduct.belongsTo(models.category, {
      foreignKey: "categoryId",
      as: "category",
    });
  };

  return inventoryProduct;
};

