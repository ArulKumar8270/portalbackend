const db = require("../../../models");

module.exports = {
  async addBill(req, res, next) {
    try {
      const {
        storeId,
        currentVendorUserId,
        customerName,
        customerEmail,
        customerPhone,
        products,
        subtotal,
        discount,
        discountPercent,
        tax,
        taxPercent,
        total,
        notes,
        invoiceFormatId,
        invoiceType,
      } = req.body;

      // Determine storeId from currentStoreUserId or currentVendorUserId

      if (!storeId) {
        return res.status(400).json({ 
          success: false, 
          errors: ["storeId is required (either currentStoreUserId or currentVendorUserId)"] 
        });
      }

      // Determine invoice format ID
      let finalInvoiceFormatId = invoiceFormatId;

      // If no format specified, try to get from store/vendor assignment
      if (!finalInvoiceFormatId) {
        const store = await db.store.findByPk(storeId);
        if (store) {
          const storeFormat = await db.storeInvoiceFormat.findOne({
            where: { storeId },
          });
          if (storeFormat) {
            finalInvoiceFormatId = storeFormat.formatId;
          }
        }

        // If still no format, try vendor
        if (!finalInvoiceFormatId && currentVendorUserId) {
          const vendorFormat = await db.vendorInvoiceFormat.findOne({
            where: { vendorId: String(currentVendorUserId) },
          });
          if (vendorFormat) {
            finalInvoiceFormatId = vendorFormat.formatId;
          }
        }

        // If still no format, use default
        if (!finalInvoiceFormatId) {
          const defaultFormat = await db.invoiceFormat.findOne({
            where: { isDefault: true },
          });
          if (defaultFormat) {
            finalInvoiceFormatId = defaultFormat.id;
          }
        }
      }

      // Validate invoiceType
      const validInvoiceTypes = ['DC', 'Invoice', 'Quotation'];
      const finalInvoiceType = invoiceType && validInvoiceTypes.includes(invoiceType) 
        ? invoiceType 
        : 'Invoice'; // Default to 'Invoice' if not provided or invalid

      // Create the bill
      const bill = await db.bill.create({
        storeId: storeId || currentVendorUserId,
        customerName: customerName || "",
        customerEmail: customerEmail || "",
        customerPhone: customerPhone || "",
        products: products,
        subtotal: subtotal || 0,
        discount: discount || 0,
        discountPercent: discountPercent || 0,
        tax: tax || 0,
        taxPercent: taxPercent || 0,
        total: total || 0,
        notes: notes || "",
        invoiceFormatId: finalInvoiceFormatId || null,
        invoiceType: finalInvoiceType,
      });

      res.status(201).json({ 
        success: true, 
        message: "Bill created successfully",
        data: bill 
      });
    } catch (err) {
      console.error(err, "Error creating bill");
      res.status(500).json({ 
        success: false, 
        errors: ["Error creating bill", err.message] 
      });
    }
  },

  async updateBill(req, res, next) {
    try {
      // Support both frontend field names (snake_case) and API field names (camelCase)
      const {
        id,
        // Frontend field names (snake_case)
        invoice_no,
        invoice_date,
        invoice_month,
        po_no,
        po_date,
        billing_name,
        billing_address,
        billing_mobile,
        billing_gstin,
        shipping_name,
        shipping_address,
        taxable_amount,
        total_cgst,
        total_sgst,
        total_tax,
        final_amount,
        company_name,
        company_short_name,
        company_suffix,
        company_address,
        company_mobile,
        company_gstin,
        bank_account_name,
        bank_account_number,
        bank_ifsc,
        bank_name_branch,
        lut_ref,
        lut_date,
        invoice_title,
        invoice_copy_type,
        terms_condition_1,
        terms_condition_2,
        terms_conditions,
        gst_breakdown,
        // API field names (camelCase) - for backward compatibility
        storeId: requestStoreId,
        customerName,
        customerEmail,
        customerPhone,
        billingAddress,
        billingGSTIN,
        shippingCompanyName,
        shippingAddress,
        products,
        subtotal,
        discount,
        discountPercent,
        tax,
        taxPercent,
        total,
        totalCGST,
        totalSGST,
        notes,
        invoiceFormatId,
        invoiceType,
        invoiceNumber,
        invoiceDate,
        invoiceMonth,
        poNumber,
        poDate,
        companyName,
        companyShortName,
        companySuffix,
        companyAddress,
        companyMobile,
        companyGSTIN,
        bankAccountName,
        bankAccountNumber,
        bankIFSC,
        bankNameBranch,
        lutRef,
        lutDate,
        invoiceTitle,
        invoiceCopyType,
        termsConditions,
        gstBreakdown,
      } = req.body;

      const userId = req.user?.id;
      const role = req.user?.role;
      const userStoreId = req.user?.storeId ? parseInt(req.user.storeId) : null;
      const userVendorId = req.user?.vendorId ? parseInt(req.user.vendorId) : null;

      // 1. Validate required fields
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Bill ID is required'
        });
      }

      // 2. Find the bill with store association
      const bill = await db.bill.findByPk(id, {
        include: [
          {
            model: db.store,
            as: 'store',
            required: false,
            attributes: ['id', 'storename']
          }
        ]
      });

      if (!bill) {
        return res.status(404).json({
          success: false,
          message: 'Bill not found'
        });
      }

      // 3. Authorization check
      const billStoreId = bill.storeId ? parseInt(bill.storeId) : null;

      // Admin can update any bill
      if (role !== '0') {
        // Store users (role 3) can only update bills for their store
        if (role === '3') {
          if (userStoreId !== billStoreId) {
            return res.status(403).json({
              success: false,
              message: 'You do not have permission to update this bill'
            });
          }
        }

        // Vendor users (role 2) can update bills for stores they have access to
        // If vendor user has a storeId, check if it matches the bill's storeId
        // If vendor user doesn't have storeId, we need to verify through vendor relationship
        if (role === '2') {
          if (userStoreId) {
            // Vendor user with storeId - check if it matches
            if (userStoreId !== billStoreId) {
              return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this bill'
              });
            }
          } else if (userVendorId) {
            // Vendor user without storeId - check if any user with this vendorId has access to the bill's store
            // This verifies that the vendor has at least one user associated with the store
            const vendorStoreUser = await db.user.findOne({
              where: {
                vendorId: String(userVendorId),
                storeId: String(billStoreId)
              }
            });

            if (!vendorStoreUser) {
              return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this bill'
              });
            }
          } else {
            // Vendor user without vendorId or storeId - deny access
            return res.status(403).json({
              success: false,
              message: 'You do not have permission to update this bill'
            });
          }
        }
      }

      // 4. Validate invoiceType if provided
      if (invoiceType !== undefined) {
        const validTypes = ['DC', 'Invoice', 'Quotation'];
        if (!validTypes.includes(invoiceType)) {
          return res.status(400).json({
            success: false,
            message: `invoiceType must be one of: ${validTypes.join(', ')}`
          });
        }
      }

      // 5. Validate invoiceFormatId if provided
      if (invoiceFormatId !== undefined && invoiceFormatId !== null) {
        const format = await db.invoiceFormat.findByPk(invoiceFormatId);
        if (!format) {
          return res.status(400).json({
            success: false,
            message: 'Invalid invoiceFormatId'
          });
        }
      }

      // 6. Prepare update data - map frontend field names to database field names
      const updateData = {};

      // Customer/Billing Information - support both frontend (snake_case) and API (camelCase) names
      const customerNameValue = billing_name !== undefined ? billing_name : customerName;
      const customerPhoneValue = billing_mobile !== undefined ? billing_mobile : customerPhone;
      const billingAddressValue = billing_address !== undefined ? billing_address : billingAddress;
      const billingGSTINValue = billing_gstin !== undefined ? billing_gstin : billingGSTIN;

      if (customerNameValue !== undefined) updateData.customerName = customerNameValue;
      if (customerEmail !== undefined) updateData.customerEmail = customerEmail;
      if (customerPhoneValue !== undefined) updateData.customerPhone = customerPhoneValue;
      if (billingAddressValue !== undefined) updateData.billingAddress = billingAddressValue;
      if (billingGSTINValue !== undefined) updateData.billingGSTIN = billingGSTINValue;

      // Shipping Information - support both frontend (snake_case) and API (camelCase) names
      const shippingCompanyNameValue = shipping_name !== undefined ? shipping_name : shippingCompanyName;
      const shippingAddressValue = shipping_address !== undefined ? shipping_address : shippingAddress;

      if (shippingCompanyNameValue !== undefined) updateData.shippingCompanyName = shippingCompanyNameValue;
      if (shippingAddressValue !== undefined) updateData.shippingAddress = shippingAddressValue;

      // Company Information - support both frontend (snake_case) and API (camelCase) names
      const companyNameValue = company_name !== undefined ? company_name : companyName;
      const companyShortNameValue = company_short_name !== undefined ? company_short_name : companyShortName;
      const companySuffixValue = company_suffix !== undefined ? company_suffix : companySuffix;
      const companyAddressValue = company_address !== undefined ? company_address : companyAddress;
      const companyMobileValue = company_mobile !== undefined ? company_mobile : companyMobile;
      const companyGSTINValue = company_gstin !== undefined ? company_gstin : companyGSTIN;

      if (companyNameValue !== undefined) updateData.companyName = companyNameValue;
      if (companyShortNameValue !== undefined) updateData.companyShortName = companyShortNameValue;
      if (companySuffixValue !== undefined) updateData.companySuffix = companySuffixValue;
      if (companyAddressValue !== undefined) updateData.companyAddress = companyAddressValue;
      if (companyMobileValue !== undefined) updateData.companyMobile = companyMobileValue;
      if (companyGSTINValue !== undefined) updateData.companyGSTIN = companyGSTINValue;

      // Invoice Information - support both frontend (snake_case) and API (camelCase) names
      if (invoiceType !== undefined) updateData.invoiceType = invoiceType;
      if (invoiceFormatId !== undefined) updateData.invoiceFormatId = invoiceFormatId;
      
      const invoiceTitleValue = invoice_title !== undefined ? invoice_title : invoiceTitle;
      if (invoiceTitleValue !== undefined) updateData.invoiceTitle = invoiceTitleValue;
      
      const invoiceCopyTypeValue = invoice_copy_type !== undefined ? invoice_copy_type : invoiceCopyType;
      if (invoiceCopyTypeValue !== undefined) updateData.invoiceCopyType = invoiceCopyTypeValue;
      
      const invoiceNumberValue = invoice_no !== undefined ? invoice_no : invoiceNumber;
      if (invoiceNumberValue !== undefined) updateData.invoiceNumber = invoiceNumberValue;
      
      const invoiceDateValue = invoice_date !== undefined ? invoice_date : invoiceDate;
      if (invoiceDateValue !== undefined) {
        updateData.invoiceDate = invoiceDateValue ? new Date(invoiceDateValue) : null;
      }
      
      const invoiceMonthValue = invoice_month !== undefined ? invoice_month : invoiceMonth;
      if (invoiceMonthValue !== undefined) updateData.invoiceMonth = invoiceMonthValue;
      
      const poNumberValue = po_no !== undefined ? po_no : poNumber;
      if (poNumberValue !== undefined) updateData.poNumber = poNumberValue;
      
      const poDateValue = po_date !== undefined ? po_date : poDate;
      if (poDateValue !== undefined) {
        updateData.poDate = poDateValue ? new Date(poDateValue) : null;
      }

      // Bank Information - support both frontend (snake_case) and API (camelCase) names
      const bankAccountNameValue = bank_account_name !== undefined ? bank_account_name : bankAccountName;
      const bankAccountNumberValue = bank_account_number !== undefined ? bank_account_number : bankAccountNumber;
      const bankIFSCValue = bank_ifsc !== undefined ? bank_ifsc : bankIFSC;
      const bankNameBranchValue = bank_name_branch !== undefined ? bank_name_branch : bankNameBranch;

      if (bankAccountNameValue !== undefined) updateData.bankAccountName = bankAccountNameValue;
      if (bankAccountNumberValue !== undefined) updateData.bankAccountNumber = bankAccountNumberValue;
      if (bankIFSCValue !== undefined) updateData.bankIFSC = bankIFSCValue;
      if (bankNameBranchValue !== undefined) updateData.bankNameBranch = bankNameBranchValue;

      // LUT Information - support both frontend (snake_case) and API (camelCase) names
      const lutRefValue = lut_ref !== undefined ? lut_ref : lutRef;
      const lutDateValue = lut_date !== undefined ? lut_date : lutDate;

      if (lutRefValue !== undefined) updateData.lutRef = lutRefValue;
      if (lutDateValue !== undefined) {
        updateData.lutDate = lutDateValue ? new Date(lutDateValue) : null;
      }

      // Products - handle as JSON
      if (products !== undefined) {
        if (Array.isArray(products)) {
          updateData.products = products;
        } else if (products === null) {
          updateData.products = null;
        }
      }

      // Financial Information - support both frontend (snake_case) and API (camelCase) names
      // Map frontend fields to database fields
      const subtotalValue = taxable_amount !== undefined ? taxable_amount : subtotal;
      const totalCGSTValue = total_cgst !== undefined ? total_cgst : totalCGST;
      const totalSGSTValue = total_sgst !== undefined ? total_sgst : totalSGST;
      const taxValue = total_tax !== undefined ? total_tax : tax;
      const totalValue = final_amount !== undefined ? final_amount : total;

      // Convert to decimals
      if (subtotalValue !== undefined) {
        updateData.subtotal = subtotalValue === null || subtotalValue === '' ? 0 : parseFloat(subtotalValue) || 0;
      }
      if (totalCGSTValue !== undefined) {
        updateData.totalCGST = totalCGSTValue === null || totalCGSTValue === '' ? 0 : parseFloat(totalCGSTValue) || 0;
      }
      if (totalSGSTValue !== undefined) {
        updateData.totalSGST = totalSGSTValue === null || totalSGSTValue === '' ? 0 : parseFloat(totalSGSTValue) || 0;
      }
      if (taxValue !== undefined) {
        updateData.tax = taxValue === null || taxValue === '' ? 0 : parseFloat(taxValue) || 0;
      }
      if (totalValue !== undefined) {
        updateData.total = totalValue === null || totalValue === '' ? 0 : parseFloat(totalValue) || 0;
      }

      // Handle other financial fields (backward compatibility)
      if (discount !== undefined) {
        updateData.discount = discount === null || discount === '' ? 0 : parseFloat(discount) || 0;
      }
      if (discountPercent !== undefined) {
        updateData.discountPercent = discountPercent === null || discountPercent === '' ? 0 : parseFloat(discountPercent) || 0;
      }
      if (taxPercent !== undefined) {
        updateData.taxPercent = taxPercent === null || taxPercent === '' ? 0 : parseFloat(taxPercent) || 0;
      }

      // Notes
      if (notes !== undefined) updateData.notes = notes;

      // Terms and Conditions - handle as JSON array
      if (terms_conditions !== undefined) {
        if (Array.isArray(terms_conditions)) {
          updateData.termsConditions = terms_conditions;
        } else if (terms_conditions === null) {
          updateData.termsConditions = null;
        }
      } else if (termsConditions !== undefined) {
        if (Array.isArray(termsConditions)) {
          updateData.termsConditions = termsConditions;
        } else if (termsConditions === null) {
          updateData.termsConditions = null;
        }
      } else if (terms_condition_1 !== undefined || terms_condition_2 !== undefined) {
        // Build terms conditions array from individual fields
        const termsArray = [];
        if (terms_condition_1) termsArray.push({ id: 1, text: terms_condition_1 });
        if (terms_condition_2) termsArray.push({ id: 2, text: terms_condition_2 });
        if (termsArray.length > 0) {
          updateData.termsConditions = termsArray;
        }
      }

      // GST Breakdown - handle as JSON array
      if (gst_breakdown !== undefined) {
        if (Array.isArray(gst_breakdown)) {
          updateData.gstBreakdown = gst_breakdown;
        } else if (gst_breakdown === null) {
          updateData.gstBreakdown = null;
        }
      } else if (gstBreakdown !== undefined) {
        if (Array.isArray(gstBreakdown)) {
          updateData.gstBreakdown = gstBreakdown;
        } else if (gstBreakdown === null) {
          updateData.gstBreakdown = null;
        }
      }

      // Note: storeId should NOT be updated for security reasons
      // The bill belongs to the original store

      // 7. Update the bill
      await bill.update(updateData);

      // 8. Reload bill with associations for response
      await bill.reload({
        include: [
          {
            model: db.invoiceFormat,
            as: 'invoiceFormat',
            required: false,
            attributes: ['id', 'name', 'headerTemplate', 'template', 'footerTemplate']
          },
          {
            model: db.store,
            as: 'store',
            required: false,
            attributes: ['id', 'storename', 'storeaddress', 'phone', 'GSTNo']
          }
        ]
      });

      // 9. Prepare response data
      const billData = bill.toJSON();

      // Ensure products is parsed if it's a string
      if (billData.products && typeof billData.products === 'string') {
        try {
          billData.products = JSON.parse(billData.products);
        } catch (e) {
          billData.products = [];
        }
      }

      return res.json({
        success: true,
        message: 'Bill updated successfully',
        data: billData
      });

    } catch (error) {
      console.error('Error updating bill:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update bill',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  async getBills(req, res, next) {
    try {
      const bills = await db.bill.findAll({
        order: [["createdAt", "DESC"]],
        include: [
          { model: db.store, required: false },
          { model: db.vendor, as: 'vendor', required: false }
        ]
      });

      res.status(200).json({ 
        success: true, 
        data: bills,
        count: bills.length 
      });
    } catch (err) {
      console.error(err, "Error fetching bills");
      res.status(500).json({ 
        success: false, 
        errors: ["Error fetching bills", err.message] 
      });
    }
  },

  async getBillById(req, res, next) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ 
          success: false, 
          errors: ["Bill ID is required"] 
        });
      }

      const bill = await db.bill.findOne({
        where: { id: id },
        include: [
          { model: db.store, required: false },
          { model: db.vendor, as: 'vendor', required: false },
          { model: db.invoiceFormat, as: 'invoiceFormat', required: false }
        ]
      });

      if (!bill) {
        return res.status(404).json({ 
          success: false, 
          errors: ["Bill not found"] 
        });
      }

      res.status(200).json({ 
        success: true, 
        data: bill 
      });
    } catch (err) {
      console.error(err, "Error fetching bill");
      res.status(500).json({ 
        success: false, 
        errors: ["Error fetching bill", err.message] 
      });
    }
  },
  async getBillByStoreId(req, res, next) {
    try {
      const { storeId } = req.params;

      if (!storeId) {
        return res.status(400).json({ 
          success: false, 
          errors: ["Store ID is required"] 
        });
      }

        const bills = await db.bill.findAll({
        where: { storeId: storeId },
        include: [
          { model: db.store, required: false },
          { model: db.vendor, as: 'vendor', required: false }
        ]
      });

      if (!bills) {
        return res.status(404).json({ 
          success: false, 
          errors: ["Bills not found"] 
        });
      }

      res.status(200).json({ 
        success: true, 
        data: bills 
      });
    } catch (err) {
      console.error(err, "Error fetching bills");
      res.status(500).json({ 
        success: false, 
        errors: ["Error fetching bills", err.message] 
      });
    }
  },
};

