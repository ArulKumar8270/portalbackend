const express = require('express');
const router = express.Router();
const addressController = require('./address.controller');
const { jwtStrategy } = require('../../../middleware/strategy');
const { requireAdmin } = require('../../../middleware/requireAuth');

router.post('/create', addressController.createAddress);
router.get('/', jwtStrategy, requireAdmin, addressController.getAllAddresses);
router.get('/:id', addressController.getAddressById);
router.get('/list/:custId', addressController.getAddressesByCustId);
router.post('/update/:id', addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);

module.exports = router;