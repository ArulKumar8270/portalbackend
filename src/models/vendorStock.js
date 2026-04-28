"use strict";

module.exports = (sequelize, DataTypes) => {
  const vendorStock = sequelize.define(
    "vendorStock",
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "categories", // name of the referenced model
          key: "id", // key in the referenced model
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      vendorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "vendors", // name of the referenced model
          key: "id", // key in the referenced model
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {}
  );

  vendorStock.associate = function (models) {
    models.vendorStock.belongsTo(models.category, {
      foreignKey: "id",
    });
    models.vendorStock.belongsTo(models.vendor, {
      foreignKey: "vendorId",
    });
  };

  return vendorStock;
};
