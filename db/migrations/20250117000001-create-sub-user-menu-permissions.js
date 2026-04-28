'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('subUserMenuPermissions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      subUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      menuKey: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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

    // Add unique index for subUserId + menuKey combination
    await queryInterface.addIndex('subUserMenuPermissions', ['subUserId', 'menuKey'], {
      name: 'unique_subuser_menu',
      unique: true,
    });
    // Add indexes for performance
    await queryInterface.addIndex('subUserMenuPermissions', ['subUserId'], {
      name: 'idx_subuser_id',
    });
    await queryInterface.addIndex('subUserMenuPermissions', ['menuKey'], {
      name: 'idx_menu_key',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('subUserMenuPermissions');
  }
};

