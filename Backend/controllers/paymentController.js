const crypto = require("crypto");

const Payment = require("../models/Payment");
const { createOrder } = require("../services/paymentService");

const createPaymentOrder = async (req, res) => {
  try {
    const { amount, email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Amount is required",
      });
    }

    const order = await createOrder(amount);

    // MongoDB mein payment save karo
    const payment = await Payment.create({
      email,
      amount: Number(amount),
      currency: order.currency,
      razorpayOrderId: order.id,
      status: "PENDING",
    });

    res.status(200).json({
      success: true,
      order,
      paymentId: payment._id,
    });
  } catch (error) {
    console.error("Create Razorpay order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create payment order",
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment details are required",
      });
    }

    const body =
      razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          status: "FAILED",
          failureReason: "Invalid payment signature",
        }
      );

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Successful payment ko database mein update karo
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "SUCCESS",
        completedAt: new Date(),
      },
      {
        new: true,
      }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment,
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};
const paymentFailed = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      reason,
    } = req.body;

    if (!razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order ID is required",
      });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    payment.status = "FAILED";
    payment.failureReason = reason || "Payment failed";

    payment.retryCount += 1;

    payment.failureHistory.push({
      attempt: payment.retryCount,
      reason: reason || "Payment failed",
      timestamp: new Date(),
    });

    payment.lastAttemptAt = new Date();

    await payment.save();

    res.status(200).json({
      success: true,
      message: "Payment failure saved",
      payment,
    });
  } catch (error) {
    console.error("Save payment failure error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save payment failure",
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  paymentFailed,
};