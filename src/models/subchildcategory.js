'use strict';
module.exports = (sequelize, DataTypes) => {
  const SubChildCategory = sequelize.define('subchildcategories', {
    name: DataTypes.STRING,
    categoryId: DataTypes.INTEGER,
    subcategoryId: DataTypes.INTEGER
  }, {});
  SubChildCategory.associate = function(models) {
    // associations can be defined here
    models.subchildcategories.belongsTo(models.category, { foreignKey: 'id' });
    models.subchildcategories.belongsTo(models.subcategories, { foreignKey: 'subcategoryId' });
    models.subchildcategories.hasMany(models.product, { foreignKey: 'childCategoryId' });

  };
  return SubChildCategory;
}; 