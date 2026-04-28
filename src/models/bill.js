'use strict';
module.exports = (sequelize, DataTypes) => {
  const Bill = sequelize.define('bill', {
    storeId: DataTypes.INTEGER,
    // Company Information
    companyName: DataTypes.STRING(255),
    companyShortName: DataTypes.STRING(100),
    companySuffix: DataTypes.STRING(100),
    companyAddress: DataTypes.TEXT,
    companyMobile: DataTypes.STRING(50),
    companyGSTIN: DataTypes.STRING(50),
    // Customer Information
    customerName: DataTypes.STRING,
    customerEmail: DataTypes.STRING,
    customerPhone: DataTypes.STRING,
    billingAddress: DataTypes.TEXT,
    billingGSTIN: DataTypes.STRING(50),
    shippingCompanyName: DataTypes.STRING(255),
    shippingAddress: DataTypes.TEXT,
    products: DataTypes.JSON,
    subtotal: DataTypes.DECIMAL(10, 2),
    discount: DataTypes.DECIMAL(10, 2),
    discountPercent: DataTypes.DECIMAL(10, 2),
    tax: DataTypes.DECIMAL(10, 2),
    taxPercent: DataTypes.DECIMAL(10, 2),
    total: DataTypes.DECIMAL(10, 2),
    totalCGST: DataTypes.DECIMAL(10, 2),
    totalSGST: DataTypes.DECIMAL(10, 2),
    notes: DataTypes.TEXT,
    termsConditions: DataTypes.JSON,
    gstBreakdown: DataTypes.JSON,
    invoiceFormatId: DataTypes.INTEGER,
    invoiceType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'Invoice',
      validate: {
        isIn: [['DC', 'Invoice', 'Quotation']]
      }
    },
    invoiceTitle: DataTypes.STRING(100),
    invoiceCopyType: DataTypes.STRING(100),
    invoiceNumber: DataTypes.STRING(100),
    invoiceDate: DataTypes.DATE,
    invoiceMonth: DataTypes.STRING(50),
    poNumber: DataTypes.STRING(100),
    poDate: DataTypes.DATE,
    // Bank Information
    bankAccountName: DataTypes.STRING(255),
    bankAccountNumber: DataTypes.STRING(50),
    bankIFSC: DataTypes.STRING(20),
    bankNameBranch: DataTypes.STRING(255),
    // LUT Information
    lutRef: DataTypes.STRING(100),
    lutDate: DataTypes.DATE,
  }, {});
  Bill.associate = function(models) {
    // associations can be defined here
    models.bill.belongsTo(models.store, { foreignKey: 'storeId' });
    models.bill.belongsTo(models.vendor, { foreignKey: 'storeId', as: 'vendor' });
    models.bill.belongsTo(models.invoiceFormat, { foreignKey: 'invoiceFormatId', as: 'invoiceFormat' });
  };
  return Bill;
};

