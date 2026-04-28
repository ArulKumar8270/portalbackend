"use strict";

module.exports = (sequelize, DataTypes) => {
  const productFeedback = sequelize.define(
    "productFeedback",
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "user", // name of the referenced model
          key: "id", // key in the referenced model
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "product", // name of the referenced model
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
      storeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "store", // name of the referenced model
          key: "id", // key in the referenced model
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      feedBack: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      rating: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      customizedMessage: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
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

  productFeedback.associate = function (models) {
    models.productFeedback.belongsTo(models.user, {
      foreignKey: "customerId",
    });
    models.productFeedback.belongsTo(models.product, {
      foreignKey: "productId",
    });
    models.productFeedback.belongsTo(models.vendor, {
      foreignKey: "vendorId",
    });
    models.productFeedback.belongsTo(models.store, {
      foreignKey: "storeId",
    });
  };

  return productFeedback;
};
