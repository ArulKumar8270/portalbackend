"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("outboundTransactions", {
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
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
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
    // Note: Foreign keys will be added separately if needed
    await queryInterface.addIndex("outboundTransactions", ["vendorId"]);
    await queryInterface.addIndex("outboundTransactions", ["productId"]);
    await queryInterface.addIndex("outboundTransactions", ["orderId"]);
    await queryInterface.addIndex("outboundTransactions", ["date"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("outboundTransactions");
  },
};

