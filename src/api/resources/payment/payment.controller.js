const Razorpay = require("razorpay");
const db = require("../../../models");

module.exports = {
  /* Add user api start here................................*/
  async orderDetails(req, res, next) {
    const instance = new Razorpay({
      key_id: "rzp_live_RgPc8rKEOZbHgf",
      key_secret: "k3YfPhVvjHEWaa6517AHJJP5",
    });

    let { order_id, amount, payment_capture, currency } = req.body;

    try {
      const options = {
        amount: amount * 100, // amount in smallest currency unit
        currency: currency,
        receipt: `order_rcptid_${order_id}`,
        payment_capture: payment_capture,
      };

      const order = await instance.orders.create(options);
      if (!order) return res.status(500).send("Some error occured");
      res.status(200).json({ success: true, data: order });
    } catch (err) {
      return res.status(500).json({
        message: "Something error's",
      });
    }
  },

  async findOrderList(req, res, next) {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "rzp_live_RgPc8rKEOZbHgf",
      key_secret: process.env.RAZORPAY_SECRET || "k3YfPhVvjHEWaa6517AHJJP5",
    });
    try {
      let { orderCreationId, razorpayPaymentId, razorpayOrderId, custId } =
        req.body;
      await instance.payments
        .fetch(razorpayPaymentId)
        .then((order) => {
          if (order) {
            return db.payment
              .create({
                custId: Number(custId),
                amount: order.amount / 100,
                orderCreationId: orderCreationId,
                razorpayPaymentId: razorpayPaymentId,
                razorpayOrderId: razorpayOrderId,
                currency: order.currency,
                status: order.status,
                method: order.method,
              })
              .then((r) => [order, r]);
          }
        })
        .then(([order, r]) => {
          res.status(200).json({ success: true, data: order });
        });   
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        message: "Something error's",
      });
    }
  },

  async getAllPayment(req, res, next) {
    try {
      db.payment
        .findAll({
          include: [{ model: db.customer }],
        })
        .then((list) => {
          res.status(200).json({ success: true, data: list });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },
};
