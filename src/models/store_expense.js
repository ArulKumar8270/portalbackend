"use strict";

module.exports = (sequelize, DataTypes) => {
  const StoreExpense = sequelize.define(
    "store_expense",
    {
      storeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      expenseDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "Other",
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      paymentMethod: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: "Cash",
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "store_expenses",
      timestamps: true,
      underscored: false,
    }
  );

  StoreExpense.associate = function (models) {
    models.store_expense.belongsTo(models.store, { foreignKey: "storeId" });
  };

  return StoreExpense;
};
