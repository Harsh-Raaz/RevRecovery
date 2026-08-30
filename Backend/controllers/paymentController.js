const { createOrder } = require("../services/paymentService");

const createPaymentOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({
        message: "Amount is required",
      });
    }

    const order = await createOrder(amount);

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Create Razorpay order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create payment order",
    });
  }
};

module.exports = {
  createPaymentOrder,
};