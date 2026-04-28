"use strict";
module.exports = (sequelize, DataTypes) => {
  const category = sequelize.define(
    "category",
    {
      name: DataTypes.STRING,
      slug: DataTypes.STRING,
      createdId: DataTypes.TEXT,
      createdType: DataTypes.TEXT,
    },
    {}
  );
  category.associate = function (models) {
    // associations can be defined here
    models.category.hasMany(models.product, { foreignKey: "categoryId" });
    models.category.hasMany(models.subcategories, { foreignKey: "categoryId" });
    models.category.hasMany(models.subchildcategories, {
      foreignKey: "categoryId",
    });
    models.category.hasMany(models.vendorStock, { foreignKey: "categoryId" });
  };
  return category;
};
