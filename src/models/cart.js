'use strict';
module.exports = (sequelize, DataTypes) => {
  const Cart = sequelize.define('carts', {
    productId: DataTypes.INTEGER,
    name: DataTypes.STRING,
    orderId: DataTypes.INTEGER,
    price: DataTypes.INTEGER,
    total: DataTypes.INTEGER,
    qty: DataTypes.INTEGER,
    unitSize: DataTypes.STRING,
    size: DataTypes.STRING,
    photo: DataTypes.STRING,
    storeId: DataTypes.INTEGER,
  }, {});
  Cart.associate = function(models) {
    // associations can be defined here
    models.carts.belongsTo(models.user, { foreignKey: 'orderId' });
  };
  return Cart;
}; 