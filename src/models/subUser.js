"use strict";

module.exports = (sequelize, DataTypes) => {
  const subUser = sequelize.define(
    "subUser",
    {
      firstName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      phone: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
      },
      vendorId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      storeId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      rejectedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rejectedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "subUsers",
    }
  );

  subUser.associate = function (models) {
    subUser.belongsTo(models.user, {
      foreignKey: "createdBy",
      as: "creator",
    });
    subUser.belongsTo(models.user, {
      foreignKey: "approvedBy",
      as: "approver",
    });
    subUser.belongsTo(models.user, {
      foreignKey: "rejectedBy",
      as: "rejector",
    });
    subUser.belongsTo(models.vendor, {
      foreignKey: "vendorId",
      as: "vendor",
    });
    subUser.belongsTo(models.store, {
      foreignKey: "storeId",
      as: "store",
    });
    subUser.hasMany(models.subUserMenuPermission, {
      foreignKey: "subUserId",
      as: "menuPermissions",
    });
  };

  return subUser;
};

