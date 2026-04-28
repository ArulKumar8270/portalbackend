'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('storeMenuPermissions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      storeId: {
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
        allowNull: false,
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

    // Add unique index for storeId + menuKey combination
    await queryInterface.addIndex('storeMenuPermissions', ['storeId', 'menuKey'], {
      name: 'unique_store_menu',
      unique: true,
    });
    // Add indexes for performance
    await queryInterface.addIndex('storeMenuPermissions', ['storeId'], {
      name: 'idx_store_id',
    });
    await queryInterface.addIndex('storeMenuPermissions', ['menuKey'], {
      name: 'idx_menu_key',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('storeMenuPermissions');
  }
};

