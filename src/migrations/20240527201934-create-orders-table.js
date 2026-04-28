'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      custId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'customers', // Name of the customers table (usually pluralized)
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      number: {
        type: Sequelize.STRING
      },
      paymentmethod: {
        type: Sequelize.STRING
      },
      deliverydate: {
        type: Sequelize.DATE
      },
      grandtotal: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.ENUM('processing', 'shipping', 'delivered', 'cancelled'),
        defaultValue: 'processing'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Orders');
  }
};
