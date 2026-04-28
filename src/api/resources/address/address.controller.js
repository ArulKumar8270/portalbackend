const db = require('../../../models');

module.exports = {
  async createAddress(req, res, next) {
    try {
      const {
        fullname,
        phone,
        orderId,
        custId,
        discrict,
        district,
        city,
        states,
        area,
        shipping,
        pincode,
      } = req.body;
      const address = await db.addresses.create({
        fullname,
        phone,
        orderId,
        custId,
        discrict: discrict ?? district,
        city,
        states,
        area,
        shipping,
        pincode,
      });
      res.status(201).json({ success: true, data: address });
    } catch (err) {
      next(err);
    }
  },

  async getAllAddresses(req, res, next) {
    try {
      const addresses = await db.addresses.findAll();
      res.status(200).json({ success: true, data: addresses });
    } catch (err) {
      next(err);
    }
  },

  async getAddressById(req, res, next) {
    try {
      const address = await db.addresses.findByPk(req.params.id);
      if (!address) {
        return res.status(404).json({ success: false, message: 'Address not found' });
      }
      res.status(200).json({ success: true, data: address });
    } catch (err) {
      next(err);
    } 
  },

  async getAddressesByCustId(req, res, next) {
    try {
      const { custId } = req.params;
      const addresses = await db.addresses.findAll({
        where: {
          custId: custId,
        },
      });
      if (addresses.length === 0) {
        return res.status(404).json({ success: false, message: 'No addresses found for the given orderId and custId' });
      }
      res.status(200).json({ success: true, data: addresses });
    } catch (err) {
      next(err);
    }
  },

  async updateAddress(req, res, next) {
    try {
      const {
        fullname,
        phone,
        orderId,
        custId,
        discrict,
        district,
        city,
        states,
        area,
        shipping,
        pincode,
      } = req.body;
      const [updated] = await db.addresses.update(
        {
          fullname,
          phone,
          orderId,
          custId,
          discrict: discrict ?? district,
          city,
          states,
          area,
          shipping,
          pincode,
        },
        { where: { id: req.params.id } }
      );
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Address not found' });
      }
      const updatedAddress = await db.addresses.findByPk(req.params.id);
      res.status(200).json({ success: true, data: updatedAddress });
    } catch (err) {
      next(err);
    }
  },

  async deleteAddress(req, res, next) {
    try {
      const deleted = await db.addresses.destroy({ where: { id: req.params.id } });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Address not found' });
      }
      res.status(204).json({ success: true, message: 'Address deleted' });
    } catch (err) {
      next(err);
    }
  },
};