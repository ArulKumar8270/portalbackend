"use strict";
module.exports = (sequelize, DataTypes) => {
  const vendorInvoiceFormat = sequelize.define(
    "vendorInvoiceFormat",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      vendorId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      formatId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "vendorInvoiceFormats",
      timestamps: true,
    }
  );

  vendorInvoiceFormat.associate = function (models) {
    vendorInvoiceFormat.belongsTo(models.vendor, {
      foreignKey: "vendorId",
      as: "vendor",
    });

    vendorInvoiceFormat.belongsTo(models.invoiceFormat, {
      foreignKey: "formatId",
      as: "format",
    });
  };

  return vendorInvoiceFormat;
};

