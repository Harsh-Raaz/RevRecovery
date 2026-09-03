const crypto = require("crypto");

const Payment = require("../models/Payment");
const Verification = require("../models/Verification");
const { createOrder } = require("../services/paymentService");
const { diagnosePayment } = require("../services/aiService");
const {
  scheduleRetry,
  getRetryDelayMs,
  MAX_RETRIES,
} = require("../services/retryService");
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

    const normalizedEmail = String(email).trim().toLowerCase();
    const verification = await Verification.exists({
      email: normalizedEmail,
      verified: true,
    });

    if (!verification) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before making a payment.",
      });
    }

    const order = await createOrder(amount);

    // MongoDB mein payment save karo
    const payment = await Payment.create({
      email: normalizedEmail,
      amount: Number(amount),
      currency: order.currency,
      razorpayOrderId: order.id,
      status: "PENDING",
      maxRetries: MAX_RETRIES,
      orderHistory: [
        {
          orderId: order.id,
          attempt: 0,
        },
      ],
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
    const existingPayment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    }).select("retryCount");

    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "SUCCESS",
        recovered: (existingPayment?.retryCount || 0) > 0,
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

    payment.failureHistory.push({
      // retryCount counts retries only; attempt includes the original payment.
      attempt: payment.retryCount + 1,
      reason: reason || "Payment failed",
      timestamp: new Date(),
    });

    payment.lastAttemptAt = new Date();

    await payment.save();


try {
  const diagnosis = await diagnosePayment(
    payment.toObject()
  );

    payment.aiRecommendation = {
    classification: diagnosis.diagnosis,
    rootCause: diagnosis.rootCause,
    action: diagnosis.recommendedAction,
    confidence: diagnosis.confidence,
    recoveryProbability: diagnosis.recoveryProbability,
    retryAfterMinutes: diagnosis.retryAfterMinutes,
    customerMessage: diagnosis.customerMessage,
    reason: diagnosis.reasoning,
    riskLevel: diagnosis.riskLevel,
    diagnosedAt: new Date(),
  };

  // Preserve every diagnosis while retaining aiRecommendation for the dashboard.
  const diagnosisHistoryEntry = payment.aiRecommendation.toObject
    ? payment.aiRecommendation.toObject()
    : payment.aiRecommendation;
  payment.aiDiagnosisHistory.push(diagnosisHistoryEntry);
  await payment.save();

  console.log(
    "Gemini AI Diagnosis:",
    payment.aiRecommendation
  );

} catch (error) {
  console.error(
    "Gemini AI diagnosis failed:",
    error.message
  );
}

    if (payment.retryCount >= MAX_RETRIES) {
      payment.status = "ABORTED";
      await payment.save();
    }

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

const schedulePaymentRetry = async (req, res) => {
  try {
    const { retryAfter, retryUnit } = req.body;

    if (getRetryDelayMs(retryAfter, retryUnit) === null) {
      return res.status(400).json({
        success: false,
        message: "retryAfter must be positive and retryUnit must be SECONDS, MINUTES, or HOURS",
      });
    }

    const payment = await scheduleRetry(
      req.params.paymentId,
      retryAfter,
      retryUnit
    );

    if (!payment) {
      return res.status(409).json({
        success: false,
        message: "Payment is not available for retry scheduling",
      });
    }

    res.status(200).json({
      success: true,
      message: "Retry scheduled",
      payment,
    });
  } catch (error) {
    console.error("Schedule retry error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to schedule retry",
    });
  }
};

const abortRetry = async (req, res) => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "paymentId is required",
      });
    }

    const payment = await Payment.findOneAndUpdate(
      {
        _id: paymentId,
        status: { $ne: "SUCCESS" },
      },
      {
        $set: {
          abortRequested: true,
          status: "ABORTED",
          nextRetryAt: null,
        },
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found or already completed",
      });
    }

    res.status(200).json({ success: true, payment });
  } catch (error) {
    console.error("Abort retry error:", error);
    res.status(500).json({ success: false, message: "Failed to abort retry" });
  }
};

const getPaymentStatus = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId).select(
      "razorpayOrderId amount currency status recovered retryCount maxRetries nextRetryAt aiRecommendation"
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    res.status(200).json({
      success: true,
      payment: {
        ...payment.toObject(),
        // Razorpay Checkout expects its amount in paise, while Payment stores rupees.
        order: {
          id: payment.razorpayOrderId,
          amount: Math.round(Number(payment.amount) * 100),
          currency: payment.currency,
        },
      },
    });
  } catch (error) {
    console.error("Get payment status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load payment status",
    });
  }
};

const testAIDiagnosis = async (req, res) => {
  try {
    const testPayment = {
      amount: 500,
      currency: "INR",
      status: "FAILED",
      failureReason: "Payment failed due to temporary network issue",
      retryCount: 1,
      maxRetries: 2,
    };

    const diagnosis = await diagnosePayment(testPayment);

    res.status(200).json({
      success: true,
      message: "AI diagnosis working",
      diagnosis,
    });

  } catch (error) {
    console.error("AI test failed:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const testFailedPayment = async (req, res) => {
  try {
    const testPayment = await Payment.create({
      email: "test@example.com",
      amount: 500,
      currency: "INR",
      razorpayOrderId: `test_order_${Date.now()}`,
      status: "FAILED",
      failureReason:
        "Payment failed due to temporary network issue",
      retryCount: 0,
      maxRetries: 2,
      lastAttemptAt: new Date(),
    });

    const diagnosis = await diagnosePayment(
      testPayment.toObject()
    );

    testPayment.aiRecommendation = {
      classification: diagnosis.diagnosis,
      rootCause: diagnosis.rootCause,
      action: diagnosis.recommendedAction,
      confidence: diagnosis.confidence,
      recoveryProbability:
        diagnosis.recoveryProbability,
      retryAfterMinutes:
        diagnosis.retryAfterMinutes,
      customerMessage:
        diagnosis.customerMessage,
      reason: diagnosis.reasoning,
      riskLevel: diagnosis.riskLevel,
      diagnosedAt: new Date(),
    };

    await testPayment.save();

    res.status(200).json({
      success: true,
      message: "Test failed payment created and diagnosed",
      payment: testPayment,
    });

  } catch (error) {
    console.error(
      "Test failed payment error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    // Total number of payments
    const totalPayments = await Payment.countDocuments();

    // Total payment volume
    const totalVolumeResult = await Payment.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const totalPaymentVolume =
      totalVolumeResult[0]?.total || 0;

    // Revenue currently at risk
    const revenueAtRiskResult = await Payment.aggregate([
      {
        $match: {
          status: {
            $in: [
              "FAILED",
              "RETRYING",
              "WAITING_FOR_RETRY",
              "PENDING",
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const revenueAtRisk =
      revenueAtRiskResult[0]?.total || 0;

    // Recovered revenue
    const recoveredRevenueResult = await Payment.aggregate([
      {
        $match: {
          status: "SUCCESS",
          recovered: true,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const recoveredRevenue =
      recoveredRevenueResult[0]?.total || 0;

    // Failed payments
    const failedPayments =
      await Payment.countDocuments({
        status: "FAILED",
      });

    // Active recoveries
    const activeRecoveries =
      await Payment.countDocuments({
        status: {
          $in: [
            "RETRYING",
            "WAITING_FOR_RETRY",
          ],
        },
      });

    // Recovery rate
    const recoveryRate =
      revenueAtRisk > 0
        ? Number(
            (
              (recoveredRevenue / revenueAtRisk) *
              100
            ).toFixed(2)
          )
        : 0;

    // Recent transactions
    const recentPayments = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
  "email amount status recovered failureReason retryCount createdAt completedAt aiRecommendation"
);

    res.status(200).json({
      success: true,

      stats: {
        totalPayments,
        totalPaymentVolume,
        revenueAtRisk,
        recoveredRevenue,
        recoveryRate,
        failedPayments,
        activeRecoveries,
      },

      recentPayments,
    });
  } catch (error) {
    console.error(
      "Dashboard stats error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  paymentFailed,
  schedulePaymentRetry,
  abortRetry,
  getPaymentStatus,
  getDashboardStats,
  testAIDiagnosis,
  testFailedPayment,
};
