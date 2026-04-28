"use strict";

module.exports = (sequelize, DataTypes) => {
  const product = sequelize.define(
    "product",
    {
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "category", // Assumes a Category model exists
          key: "id",
        },
      },
      subCategoryId: {
        type: DataTypes.INTEGER,
        references: {
          model: "subcategories", // Assumes a Subcategories model exists
          key: "id",
        },
      },
      childCategoryId: {
        type: DataTypes.INTEGER,
        references: {
          model: "subchildcategories", // Assumes a Subchildcategories model exists
          key: "id",
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      brand: DataTypes.STRING,
      unitSize: DataTypes.STRING,
      status: {
        type: DataTypes.STRING,
        defaultValue: "active",
      },
      buyerPrice: DataTypes.INTEGER,
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      qty: DataTypes.INTEGER,
      discountPer: DataTypes.INTEGER,
      discount: DataTypes.INTEGER,
      total: DataTypes.INTEGER,
      netPrice: DataTypes.INTEGER,
      photo: DataTypes.STRING,
      sortDesc: DataTypes.TEXT,
      desc: DataTypes.TEXT,
      paymentMode: DataTypes.STRING,
      createdId: DataTypes.INTEGER,
      createdType: DataTypes.TEXT,
      isEnableEcommerce: DataTypes.TEXT,
      isEnableCustomize: DataTypes.TEXT,
      isBooking: DataTypes.TEXT,
      serviceType: DataTypes.TEXT,
      grandTotal: DataTypes.DECIMAL(10, 2),
      size: DataTypes.STRING,
      weight: DataTypes.STRING,
      sizeUnitSizeMap: DataTypes.JSON,
    },
    {}
  );

  product.associate = function (models) {
    // Defining associations
    product.belongsTo(models.category, {
      foreignKey: "categoryId",
      as: "category",
    });
    product.belongsTo(models.subcategories, {
      foreignKey: "subCategoryId",
    });
    product.belongsTo(models.subchildcategories, {
      foreignKey: "childCategoryId",
    });
    product.hasMany(models.productphoto, { foreignKey: "productId" });
    product.hasMany(models.ProductOffer, { foreignKey: "productId" });
    product.hasMany(models.vendor_product, { foreignKey: "productId" });
    product.hasMany(models.store_product, { foreignKey: "productId" });
    product.hasMany(models.productFeedback, { foreignKey: "productId" });
    product.belongsTo(models.store, { foreignKey: "createdId" });
    product.belongsTo(models.user, { 
      foreignKey: "createdId", 
      as: "client",
      constraints: false, // Allow this association even though createdId is also used for store
    });
  };

  return product;
};
