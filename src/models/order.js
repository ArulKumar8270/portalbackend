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
    deliveryAddress : DataTypes.TEXT,
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
    deliveryType: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'standard',
    },
    assignedEmployeeId: DataTypes.INTEGER,
    oneDayStatus: DataTypes.STRING,
    isOneDayTrial: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    deliveryCharge: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    distanceKm: DataTypes.DECIMAL(8, 2),
    promisedDeliveryAt: DataTypes.DATE,
    deliveredAt: DataTypes.DATE,
    rentalStatus: DataTypes.STRING(30),
    rentalSource: DataTypes.STRING(20),
    rentalCatalogItemId: DataTypes.INTEGER,
    rentalStartAt: DataTypes.DATE,
    rentalEndAt: DataTypes.DATE,
    rentalTotalAmount: DataTypes.INTEGER,
    rentalAdvancePercent: DataTypes.INTEGER,
    rentalAdvanceAmount: DataTypes.INTEGER,
    rentalBalanceAmount: DataTypes.INTEGER,
    rentalBalancePaidAt: DataTypes.DATE,
  }, {});
  Order.associate = function(models) {
    // associations can be defined here
    models.orders.hasMany(models.addresses, { foreignKey: 'orderId' });
    models.orders.hasMany(models.product, { foreignKey: 'id' }); // Removed problematic association
    models.orders.belongsTo(models.user, { foreignKey: 'custId' });
    models.orders.belongsTo(models.store_employees, { foreignKey: 'assignedEmployeeId', as: 'assignedEmployee' });
    models.orders.hasMany(models.one_day_order_events, { foreignKey: 'orderId' });
    models.orders.hasOne(models.one_day_delivery_proofs, { foreignKey: 'orderId' });
    // models.orders.hasMany(models.payment, { foreignKey: 'orderCreationId' });  

  };
  return Order;
};