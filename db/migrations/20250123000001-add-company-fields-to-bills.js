
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if columns exist before adding them
    const tableDescription = await queryInterface.describeTable('bills');
    
    // Company Information
    if (!tableDescription.companyName) {
      await queryInterface.addColumn('bills', 'companyName', {
        type: Sequelize.STRING(255),
        allowNull: true,
        after: 'storeId'
      });
    }

    if (!tableDescription.companyShortName) {
      await queryInterface.addColumn('bills', 'companyShortName', {
        type: Sequelize.STRING(100),
        allowNull: true,
        after: 'companyName'
      });
    }

    if (!tableDescription.companySuffix) {
      await queryInterface.addColumn('bills', 'companySuffix', {
        type: Sequelize.STRING(100),
        allowNull: true,
        after: 'companyShortName'
      });
    }

    if (!tableDescription.companyAddress) {
      await queryInterface.addColumn('bills', 'companyAddress', {
        type: Sequelize.TEXT,
        allowNull: true,
        after: 'companySuffix'
      });
    }

    if (!tableDescription.companyMobile) {
      await queryInterface.addColumn('bills', 'companyMobile', {
        type: Sequelize.STRING(50),
        allowNull: true,
        after: 'companyAddress'
      });
    }

    if (!tableDescription.companyGSTIN) {
      await queryInterface.addColumn('bills', 'companyGSTIN', {
        type: Sequelize.STRING(50),
        allowNull: true,
        after: 'companyMobile'
      });
    }

    // Bank Information
    if (!tableDescription.bankAccountName) {
      await queryInterface.addColumn('bills', 'bankAccountName', {
        type: Sequelize.STRING(255),
        allowNull: true,
        after: 'poDate'
      });
    }

    if (!tableDescription.bankAccountNumber) {
      await queryInterface.addColumn('bills', 'bankAccountNumber', {
        type: Sequelize.STRING(50),
        allowNull: true,
        after: 'bankAccountName'
      });
    }

    if (!tableDescription.bankIFSC) {
      await queryInterface.addColumn('bills', 'bankIFSC', {
        type: Sequelize.STRING(20),
        allowNull: true,
        after: 'bankAccountNumber'
      });
    }

    if (!tableDescription.bankNameBranch) {
      await queryInterface.addColumn('bills', 'bankNameBranch', {
        type: Sequelize.STRING(255),
        allowNull: true,
        after: 'bankIFSC'
      });
    }

    // LUT Information
    if (!tableDescription.lutRef) {
      await queryInterface.addColumn('bills', 'lutRef', {
        type: Sequelize.STRING(100),
        allowNull: true,
        after: 'bankNameBranch'
      });
    }

    if (!tableDescription.lutDate) {
      await queryInterface.addColumn('bills', 'lutDate', {
        type: Sequelize.DATE,
        allowNull: true,
        after: 'lutRef'
      });
    }

    // Invoice Display Information
    if (!tableDescription.invoiceTitle) {
      await queryInterface.addColumn('bills', 'invoiceTitle', {
        type: Sequelize.STRING(100),
        allowNull: true,
        after: 'invoiceType'
      });
    }

    if (!tableDescription.invoiceCopyType) {
      await queryInterface.addColumn('bills', 'invoiceCopyType', {
        type: Sequelize.STRING(100),
        allowNull: true,
        after: 'invoiceTitle'
      });
    }

    if (!tableDescription.invoiceMonth) {
      await queryInterface.addColumn('bills', 'invoiceMonth', {
        type: Sequelize.STRING(50),
        allowNull: true,
        after: 'invoiceDate'
      });
    }

    // Terms and Conditions (stored as JSON)
    if (!tableDescription.termsConditions) {
      await queryInterface.addColumn('bills', 'termsConditions', {
        type: Sequelize.JSON,
        allowNull: true,
        after: 'notes'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('bills');
    
    // Remove columns in reverse order
    if (tableDescription.termsConditions) {
      await queryInterface.removeColumn('bills', 'termsConditions');
    }
    if (tableDescription.invoiceMonth) {
      await queryInterface.removeColumn('bills', 'invoiceMonth');
    }
    if (tableDescription.invoiceCopyType) {
      await queryInterface.removeColumn('bills', 'invoiceCopyType');
    }
    if (tableDescription.invoiceTitle) {
      await queryInterface.removeColumn('bills', 'invoiceTitle');
    }
    if (tableDescription.lutDate) {
      await queryInterface.removeColumn('bills', 'lutDate');
    }
    if (tableDescription.lutRef) {
      await queryInterface.removeColumn('bills', 'lutRef');
    }
    if (tableDescription.bankNameBranch) {
      await queryInterface.removeColumn('bills', 'bankNameBranch');
    }
    if (tableDescription.bankIFSC) {
      await queryInterface.removeColumn('bills', 'bankIFSC');
    }
    if (tableDescription.bankAccountNumber) {
      await queryInterface.removeColumn('bills', 'bankAccountNumber');
    }
    if (tableDescription.bankAccountName) {
      await queryInterface.removeColumn('bills', 'bankAccountName');
    }
    if (tableDescription.companyGSTIN) {
      await queryInterface.removeColumn('bills', 'companyGSTIN');
    }
    if (tableDescription.companyMobile) {
      await queryInterface.removeColumn('bills', 'companyMobile');
    }
    if (tableDescription.companyAddress) {
      await queryInterface.removeColumn('bills', 'companyAddress');
    }
    if (tableDescription.companySuffix) {
      await queryInterface.removeColumn('bills', 'companySuffix');
    }
    if (tableDescription.companyShortName) {
      await queryInterface.removeColumn('bills', 'companyShortName');
    }
    if (tableDescription.companyName) {
      await queryInterface.removeColumn('bills', 'companyName');
    }
  }
};
