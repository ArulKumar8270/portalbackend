'use strict';
module.exports = (sequelize, DataTypes) => {
  const store_product = sequelize.define('store_product', {
    supplierId: DataTypes.INTEGER,
    productId: DataTypes.INTEGER,
    price: DataTypes.INTEGER,
    unitSize: DataTypes.INTEGER
      
  }, {});
  store_product.associate = function(models) {
    // associations can be defined here
    models.store_product.belongsTo(models.product, { foreignKey: 'productId' });
    models.store_product.belongsTo(models.store, { foreignKey: 'supplierId' });  
  };
  return store_product;
};