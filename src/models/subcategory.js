"use strict";
module.exports = (sequelize, DataTypes) => {
  const SubCategory = sequelize.define(
    "subcategories",
    {
      sub_name: DataTypes.STRING,
      categoryId: DataTypes.INTEGER,
    },
    {}
  );
  SubCategory.associate = function (models) {
    // associations can be defined here
    models.subcategories.belongsTo(models.category, {
      foreignKey: "id",
    });
    models.subcategories.hasMany(models.subchildcategories, {
      foreignKey: "subcategoryId",
    });
    models.subcategories.hasMany(models.product, {
      foreignKey: "subCategoryId",
    });
  };
  return SubCategory;
};
