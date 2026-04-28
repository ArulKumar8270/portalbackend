"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("products", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: true, // Set to true if categoryId can be null
      },
      subCategoryId: {
        type: Sequelize.INTEGER,
        allowNull: true, // Set to true if subCategoryId can be null
      },
      childCategoryId: {
        type: Sequelize.INTEGER,
        allowNull: true, // Set to true if childCategoryId can be null
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true, // Slugs are typically unique
      },
      brand: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      unitSize: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      buyerPrice: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      price: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      qty: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      discountPer: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      discount: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      total: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      netPrice: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      photo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sortDesc: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      desc: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      paymentMode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      createdType: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create foreign key relationships
    await queryInterface.addConstraint("products", {
      fields: ["subCategoryId"],
      type: "foreign key",
      name: "fk_subcategoryId", // name of the key
      references: {
        table: "subcategories",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addConstraint("products", {
      fields: ["childCategoryId"],
      type: "foreign key",
      name: "fk_childCategoryId", // name of the key
      references: {
        table: "subchildcategories",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
    await queryInterface.addConstraint("products", {
      fields: ["createdId"],
      type: "foreign key",
      name: "fk_createdId", // name of the key
      references: {
        table: "stores",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("products");
  },
};
