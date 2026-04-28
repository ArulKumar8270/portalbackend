'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('stores', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      storename: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.INTEGER
      },
      storeaddress: {
        type: Sequelize.TEXT
      },
      storedesc: {
        type: Sequelize.TEXT
      },
      ownername: {
        type: Sequelize.STRING
      },
      owneraddress: {
        type: Sequelize.TEXT
      },
      email: {
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING
      },
      phone: {
        type: Sequelize.TEXT
      },
      areaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'areas', // Name of the areas table (usually pluralized)
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      accountNo: {
        type: Sequelize.STRING
      },
      accountHolderName: {
        type: Sequelize.STRING
      },
      bankName: {
        type: Sequelize.STRING
      },
      IFSC: {
        type: Sequelize.STRING
      },
      branch: {
        type: Sequelize.STRING
      },
      adharCardNo: {
        type: Sequelize.INTEGER
      },
      panCardNo: {
        type: Sequelize.STRING
      },
      GSTNo: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('stores');
  }
};
