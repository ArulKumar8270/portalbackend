"use strict";

module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define(
    "subscriptions",
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      subscriptionType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      subscriptionPlan: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      subscriptionPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "customers", // Assuming "customers" is the customer table
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "active",
      },
      subscriptionCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      freeCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      paymentId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
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

  Subscription.associate = function (models) {
    models.subscriptions.belongsTo(models.user, {
      foreignKey: "customerId",
    });
  };

  return Subscription;
};
