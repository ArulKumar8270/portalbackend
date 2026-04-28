"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("RequestStores", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      requestId: {
        type: Sequelize.STRING,
      },
      requesterName: {
        type: Sequelize.STRING,
      },
      contactPerson: {
        type: Sequelize.STRING,
      },
      vendorName: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "vendors",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      contactEmail: {
        type: Sequelize.STRING,
      },
      contactPhone: {
        type: Sequelize.STRING,
      },
      vendorInformation: {
        type: Sequelize.STRING,
      },
      billingAddress: {
        type: Sequelize.STRING,
      },
      paymentMethod: {
        type: Sequelize.STRING,
      },
      deliverType: {
        type: Sequelize.STRING,
      },
      requestDate: {
        type: Sequelize.DATE,
      },
      emergencyContact: {
        type: Sequelize.STRING,
      },
      deliveryDate: {
        type: Sequelize.DATE,
      },
      requestType: {
        type: Sequelize.STRING,
      },
      priority: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.STRING,
      },
      quantity: {
        type: Sequelize.INTEGER,
      },
      unitPrice: {
        type: Sequelize.DECIMAL,
      },
      totalCost: {
        type: Sequelize.DECIMAL,
      },
      serviceDescription: {
        type: Sequelize.STRING,
      },
      relatedDocuments: {
        type: Sequelize.STRING,
      },
      legalCompliance: {
        type: Sequelize.STRING,
      },
      urgencyLevel: {
        type: Sequelize.STRING,
      },
      shippingInformation: {
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("RequestStores");
  },
};
