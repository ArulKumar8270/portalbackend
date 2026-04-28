module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('products', 'paymentMode', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: "1,2,3"
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('products', 'paymentMode');
  }
};