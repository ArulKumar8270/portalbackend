"use strict";

module.exports = (sequelize, DataTypes) => {
  const outboundTransaction = sequelize.define(
    "outboundTransactions",
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      vendorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "vendors",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "products",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 999999,
        },
      },
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "orders",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: [0, 500],
        },
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
    {
      tableName: "outboundTransactions",
    }
  );

  outboundTransaction.associate = function (models) {
    models.outboundTransactions.belongsTo(models.vendor, {
      foreignKey: "vendorId",
      as: "vendor",
    });
    models.outboundTransactions.belongsTo(models.product, {
      foreignKey: "productId",
      as: "product",
    });
    models.outboundTransactions.belongsTo(models.orders, {
      foreignKey: "orderId",
      as: "order",
    });
  };

  return outboundTransaction;
};

