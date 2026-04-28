"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.addColumn("products", "preOrder", {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn("products", "onlinePayment", {
        type: Sequelize.STRING,
        allowNull: true,
      }),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.removeColumn("products", "preOrder"),
      queryInterface.removeColumn("products", "onlinePayment"),
    ]);
  },
};
