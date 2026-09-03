const Payment = require("../models/Payment");
const { createOrder } = require("./paymentService");

const MAX_RETRIES = 2;
const RETRY_DELAY_MULTIPLIERS = {
  SECONDS: 1000,
  MINUTES: 60 * 1000,
  HOURS: 60 * 60 * 1000,
};

const getRetryDelayMs = (retryAfter, retryUnit) => {
  const delay = Number(retryAfter);
  const multiplier = RETRY_DELAY_MULTIPLIERS[retryUnit];

  if (!Number.isFinite(delay) || delay <= 0 || !multiplier) {
    return null;
  }

  return delay * multiplier;
};

const scheduleRetry = async (paymentId, retryAfter, retryUnit) => {
  const payment = await Payment.findById(paymentId);

  if (!payment || !payment.canRetry() || payment.retryCount >= MAX_RETRIES) {
    return null;
  }

  const retryDelayMs = getRetryDelayMs(retryAfter, retryUnit);
  if (retryDelayMs === null) {
    return null;
  }

  const nextRetryAt = new Date(Date.now() + retryDelayMs);
  console.log(`[RETRY] Customer requested: ${retryAfter} ${retryUnit}`);
  console.log(`[RETRY] nextRetryAt: ${nextRetryAt.toISOString()}`);

  return Payment.findOneAndUpdate(
    {
      _id: payment._id,
      status: "FAILED",
      retryCount: { $lt: MAX_RETRIES },
      abortRequested: { $ne: true },
    },
    {
      $set: {
        maxRetries: MAX_RETRIES,
        status: "WAITING_FOR_RETRY",
        nextRetryAt,
      },
    },
    { new: true }
  );
};

const executeRetry = async (paymentId) => {
  // Claim the scheduled retry before creating an order so two worker ticks cannot retry twice.
  const payment = await Payment.findOneAndUpdate(
    {
      _id: paymentId,
      status: "WAITING_FOR_RETRY",
      nextRetryAt: { $lte: new Date() },
      abortRequested: { $ne: true },
      retryCount: { $lt: MAX_RETRIES },
    },
    {
      $set: {
        status: "RETRYING",
        nextRetryAt: null,
        lastAttemptAt: new Date(),
        maxRetries: MAX_RETRIES,
      },
    },
    { new: true }
  );

  if (!payment) return null;

  try {
    console.log("[RETRY] Creating NEW Razorpay order");
    const order = await createOrder(payment.amount);
    console.log(`[RETRY] New Razorpay order: ${order.id}`);

    const orderHistory = payment.orderHistory || [];
    const existingOrderAlreadyRecorded = orderHistory.some(
      (entry) => entry.orderId === payment.razorpayOrderId
    );
    const newHistoryEntries = [
      ...(!existingOrderAlreadyRecorded && payment.razorpayOrderId
        ? [{ orderId: payment.razorpayOrderId, attempt: payment.retryCount }]
        : []),
      { orderId: order.id, attempt: payment.retryCount + 1 },
    ];

    // Keep the same Payment document, record every order, then consume this retry.
    return Payment.findByIdAndUpdate(
      payment._id,
      {
        $set: {
          razorpayOrderId: order.id,
          currency: order.currency,
        },
        $inc: { retryCount: 1 },
        $push: { orderHistory: { $each: newHistoryEntries } },
      },
      { new: true }
    );
  } catch (error) {
    await Payment.findByIdAndUpdate(payment._id, {
      $set: {
        status: "FAILED",
        failureReason: "Unable to create retry order",
      },
      $push: {
        failureHistory: {
          attempt: payment.retryCount + 1,
          reason: "Unable to create retry order",
          timestamp: new Date(),
        },
      },
    });
    throw error;
  }
};

module.exports = { scheduleRetry, executeRetry, getRetryDelayMs, MAX_RETRIES };
