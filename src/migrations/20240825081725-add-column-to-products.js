"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("products", "createdId", {
      type: Sequelize.TEXT,
      allowNull: true, // Allow null values
      defaultValue: null, // Optional: Default value
    });

    await queryInterface.addColumn("products", "createdType", {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: null, // Optional: Default value
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("products", "createdId");
    await queryInterface.removeColumn("products", "createdType");
  },
};
