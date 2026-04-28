"use strict";

module.exports = (sequelize, DataTypes) => {
  const subUserMenuPermission = sequelize.define(
    "subUserMenuPermission",
    {
      subUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "subUsers",
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
      tableName: "subUserMenuPermissions",
      indexes: [
        {
          unique: true,
          fields: ['subUserId', 'menuKey'],
        },
      ],
    }
  );

  subUserMenuPermission.associate = function (models) {
    subUserMenuPermission.belongsTo(models.subUser, {
      foreignKey: "subUserId",
      as: "subUser",
    });
  };

  return subUserMenuPermission;
};

