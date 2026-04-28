const db = require("../../../models");

module.exports = {
  // Create a new cart item
  async create(req, res, next) {
    try {
      const { productId, name, orderId, price, total, qty, photo, storeId, unitSize, size } =
        req.body;
      const newCart = await db.carts.create({
        productId,
        name,
        orderId,
        price,
        total,
        qty,
        photo,
        storeId,
        unitSize,
        size
      });
      res.status(201).json({ success: true, data: newCart });
    } catch (err) {
      next(err);
    }
  },

  // Get all cart items
  async index(req, res, next) {
    try {
      const { orderId } = req.params;
      const carts = await db.carts.findAll({
        where: {
          orderId,
        },
        include: [{ model: db.user }],
      });
      res.status(200).json({ success: true, data: carts });
    } catch (err) {
      next(err);
    }
  },

  // Get cart item by ID
  async show(req, res, next) {
    try {
      const { orderId, productId } = req.params;
      const cart = await db.carts.findOne({
        where: {
          productId,
          orderId,
        },
        include: [{ model: db.user }],
      });
      if (!cart) {
        return res
          .status(200)
          .json({ success: false, message: "Cart item not found" });
      }
      res.status(200).json({ success: true, data: cart });
    } catch (err) {
      next(err);
    }
  },

  // Update a cart item
  async update(req, res, next) {
    try {
      const { orderId, productId } = req.params;
      const { name, price, total, qty, photo, unitSize, size } = req.body;

      const cart = await db.carts.findOne({ where: { orderId, productId } });
      if (!cart) {
        return res
          .status(200)
          .json({ success: false, message: "Cart item not found" });
      }
      await cart.update({
        productId: productId ?? cart.productId,
        name: name ?? cart.name,
        orderId: orderId ?? cart.orderId,
        price: price ?? cart.price,
        total: total ?? cart.total,
        qty: qty ?? cart.qty,
        photo: photo !== undefined ? photo : cart.photo,
        unitSize: unitSize !== undefined ? unitSize : cart.unitSize,
        size: size !== undefined ? size : cart.size,
      });
      res.status(200).json({ success: true, data: cart });
    } catch (err) {
      next(err);
    }
  },

  // Delete a cart item
  async delete(req, res, next) {
    try {
      const { orderId, productId } = req.params;
      const cart = await db.carts.findOne({ where: { orderId, productId } });
      if (!cart) {
        return res
          .status(404)
          .json({ success: false, message: "Cart item not found" });
      }
      await cart.destroy();
      res.status(200).json({ success: true, message: "Cart item deleted" });
    } catch (err) {
      next(err);
    }
  },
};
