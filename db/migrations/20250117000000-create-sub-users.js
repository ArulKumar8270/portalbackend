'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('subUsers', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      firstName: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      phone: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
      },
      vendorId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      storeId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      approvedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      rejectedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      rejectionReason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      approvedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      rejectedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes
    await queryInterface.addIndex('subUsers', ['email'], {
      name: 'idx_sub_users_email',
      unique: true,
    });
    await queryInterface.addIndex('subUsers', ['vendorId'], {
      name: 'idx_sub_users_vendorId',
    });
    await queryInterface.addIndex('subUsers', ['storeId'], {
      name: 'idx_sub_users_storeId',
    });
    await queryInterface.addIndex('subUsers', ['status'], {
      name: 'idx_sub_users_status',
    });
    await queryInterface.addIndex('subUsers', ['createdBy'], {
      name: 'idx_sub_users_createdBy',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('subUsers');
  }
};

