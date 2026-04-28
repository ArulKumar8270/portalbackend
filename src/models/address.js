'use strict';
module.exports = (sequelize, DataTypes) => {
  const Address = sequelize.define('addresses', {
    fullname: DataTypes.STRING,
    phone: DataTypes.STRING,
    orderId: DataTypes.INTEGER,
    custId: DataTypes.INTEGER,
    discrict: DataTypes.STRING,
    city: DataTypes.STRING,
    states: DataTypes.STRING, 
    area: DataTypes.STRING,
    shipping: DataTypes.TEXT,
    pincode: DataTypes.STRING
  }, {});
  Address.associate = function(models) {
    // associations can be defined here
    models.addresses.belongsTo(models.orders, { foreignKey: 'orderId' });  
    models.addresses.belongsTo(models.user, { foreignKey: 'custId' });      
  };
  return Address;
};