'use strict';

/** Track whether a product barcode label has been printed. */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const products = await queryInterface.describeTable('products');
    const addProductCol = async (name, spec) => {
      if (!products[name]) {
        await queryInterface.addColumn('products', name, spec);
        products[name] = true;
      }
    };

    await addProductCol('barcodePrinted', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await addProductCol('barcodePrintedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    const products = await queryInterface.describeTable('products');
    if (products.barcodePrintedAt) {
      await queryInterface.removeColumn('products', 'barcodePrintedAt');
    }
    if (products.barcodePrinted) {
      await queryInterface.removeColumn('products', 'barcodePrinted');
    }
  },
};
