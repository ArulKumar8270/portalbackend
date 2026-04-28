"use strict";

module.exports = (sequelize, DataTypes) => {
  const storeMenuPermission = sequelize.define(
    "storeMenuPermission",
    {
      storeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "stores",
          key: "id",
        },
      },
      menuKey: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "storeMenuPermissions",
      indexes: [
        {
          unique: true,
          fields: ['storeId', 'menuKey'],
          name: 'unique_store_menu',
        },
        {
          fields: ['storeId'],
          name: 'idx_store_id',
        },
        {
          fields: ['menuKey'],
          name: 'idx_menu_key',
        },
      ],
    }
  );

  storeMenuPermission.associate = function (models) {
    storeMenuPermission.belongsTo(models.store, {
      foreignKey: "storeId",
      as: "store",
    });
  };

  return storeMenuPermission;
};

