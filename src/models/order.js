'use strict';
module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('orders', {
    custId: DataTypes.INTEGER,
    number: DataTypes.STRING,
    paymentmethod: DataTypes.STRING,
    deliverydate: DataTypes.DATE,
    grandtotal: DataTypes.INTEGER, 
    status: DataTypes.ENUM('processing','shipping','delieverd','cancel'),
    productIds :  DataTypes.INTEGER,
    qty :  DataTypes.INTEGER,
    storeId: DataTypes.INTEGER,
    customization : DataTypes.STRING,
    cutomerDeliveryDate: DataTypes.DATE,
    deliveryAddress : DataTypes.STRING,
    orderType : DataTypes.ENUM('Service','Product'),
    size: DataTypes.STRING,
    unitSize: DataTypes.STRING,
    sizeDetails: DataTypes.JSON,
    // Shipping integration fields
    deliveryPartner: DataTypes.STRING, // "shiprocket" | null
    shiprocketOrderId: DataTypes.STRING,
    shiprocketShipmentId: DataTypes.STRING,
    shiprocketAwb: DataTypes.STRING,
    shiprocketCourierName: DataTypes.STRING,
    shiprocketTrackingUrl: DataTypes.TEXT,
    shiprocketRaw: DataTypes.TEXT('long'),
    shiprocketStatus: DataTypes.STRING,
    shiprocketStatusCode: DataTypes.INTEGER,
  }, {});
  Order.associate = function(models) {
    // associations can be defined here
    models.orders.hasMany(models.addresses, { foreignKey: 'orderId' });
    models.orders.hasMany(models.product, { foreignKey: 'id' }); // Removed problematic association
    models.orders.belongsTo(models.user, { foreignKey: 'custId' });
    // models.orders.hasMany(models.payment, { foreignKey: 'orderCreationId' });  

  };
  return Order;
};