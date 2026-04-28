"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("inboundTransactions", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      vendorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      clientId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      invoiceNumber: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      invoice: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      referenceNumber: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    // Add indexes for better query performance
    // Note: Foreign keys are handled at the model level, not database level
    await queryInterface.addIndex("inboundTransactions", ["vendorId"]);
    await queryInterface.addIndex("inboundTransactions", ["productId"]);
    await queryInterface.addIndex("inboundTransactions", ["clientId"]);
    await queryInterface.addIndex("inboundTransactions", ["date"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("inboundTransactions");
  },
};

