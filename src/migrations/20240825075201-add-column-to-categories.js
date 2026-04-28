"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("categories", "createdId", {
      type: Sequelize.TEXT,
      allowNull: true, // Allow null values
      defaultValue: null, // Optional: Default value
    });

    await queryInterface.addColumn("categories", "createdType", {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: null, // Optional: Default value
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("categories", "createdId");
    await queryInterface.removeColumn("categories", "createdType");
  },
};
