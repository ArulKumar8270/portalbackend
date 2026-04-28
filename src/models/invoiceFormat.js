"use strict";
module.exports = (sequelize, DataTypes) => {
  const invoiceFormat = sequelize.define(
    "invoiceFormat",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      headerTemplate: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      template: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      footerTemplate: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
    },
    {
      tableName: "invoiceFormats",
      timestamps: true,
    }
  );

  invoiceFormat.associate = function (models) {
    // One format can be assigned to many stores
    if (models.storeInvoiceFormat && typeof models.storeInvoiceFormat === 'function') {
      invoiceFormat.hasMany(models.storeInvoiceFormat, {
        foreignKey: "formatId",
        as: "storeAssignments",
      });
    }

    // One format can be assigned to many vendors
    if (models.vendorInvoiceFormat && typeof models.vendorInvoiceFormat === 'function') {
      invoiceFormat.hasMany(models.vendorInvoiceFormat, {
        foreignKey: "formatId",
        as: "vendorAssignments",
      });
    }

    // One format can be used in many bills
    if (models.bill && typeof models.bill === 'function') {
      invoiceFormat.hasMany(models.bill, {
        foreignKey: "invoiceFormatId",
        as: "bills",
      });
    }
  };

  return invoiceFormat;
};

