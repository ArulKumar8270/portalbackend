"use strict";
module.exports = (sequelize, DataTypes) => {
  const storeInvoiceFormat = sequelize.define(
    "storeInvoiceFormat",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      storeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      formatId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "storeInvoiceFormats",
      timestamps: true,
    }
  );

  storeInvoiceFormat.associate = function (models) {
    storeInvoiceFormat.belongsTo(models.store, {
      foreignKey: "storeId",
      as: "store",
    });

    storeInvoiceFormat.belongsTo(models.invoiceFormat, {
      foreignKey: "formatId",
      as: "format",
    });
  };

  return storeInvoiceFormat;
};

