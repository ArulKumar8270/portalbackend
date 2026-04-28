"use strict";

module.exports = (sequelize, DataTypes) => {
  const inboundTransaction = sequelize.define(
    "inboundTransactions",
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
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
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
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "categories",
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
      invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [3, 50],
        },
      },
      invoice: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      referenceNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: [0, 100],
        },
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
      tableName: "inboundTransactions",
    }
  );

  inboundTransaction.associate = function (models) {
    models.inboundTransactions.belongsTo(models.vendor, {
      foreignKey: "vendorId",
      as: "vendor",
    });
    models.inboundTransactions.belongsTo(models.user, {
      foreignKey: "clientId",
      as: "client",
    });
    models.inboundTransactions.belongsTo(models.product, {
      foreignKey: "productId",
      as: "product",
    });
    models.inboundTransactions.belongsTo(models.inventoryProduct, {
      foreignKey: "productId",
      as: "inventoryProduct",
    });
    models.inboundTransactions.belongsTo(models.category, {
      foreignKey: "categoryId",
      as: "category",
    });
  };

  return inboundTransaction;
};

