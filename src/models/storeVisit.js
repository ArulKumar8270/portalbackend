"use strict";

module.exports = (sequelize, DataTypes) => {
  const storeVisit = sequelize.define(
    "storeVisit",
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      storeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "store",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
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
      tableName: "store_visits",
      underscored: false,
    }
  );

  storeVisit.associate = function (models) {
    storeVisit.belongsTo(models.store, {
      foreignKey: "storeId",
    });
  };

  return storeVisit;
};
