const Payment = require("../models/Payment");
const { executeRetry } = require("../services/retryService");

const WORKER_INTERVAL_MS = 10 * 1000;

const processDueRetries = async () => {
  const duePayments = await Payment.find({
    status: "WAITING_FOR_RETRY",
    nextRetryAt: { $lte: new Date() },
    retryCount: { $lt: 2 },
  }).select("_id");

  for (const payment of duePayments) {
    try {
      await executeRetry(payment._id);
    } catch (error) {
      console.error(`Retry failed for payment ${payment._id}:`, error.message);
    }
  }
};

const startRetryWorker = () => {
  const run = () => processDueRetries().catch((error) => {
    console.error("Retry worker error:", error.message);
  });

  run();
  return setInterval(run, WORKER_INTERVAL_MS);
};

module.exports = { startRetryWorker, processDueRetries };
