const express = require("express");

const {
  createPaymentOrder,
  verifyPayment,
  paymentFailed,
  schedulePaymentRetry,
  abortRetry,
  getPaymentStatus,
  getDashboardStats,
  testAIDiagnosis,
  testFailedPayment,
} = require("../controllers/paymentController.js");

const router = express.Router();

router.post("/create-order", createPaymentOrder);
router.post("/verify", verifyPayment);
router.post("/failed", paymentFailed);
router.post("/:paymentId/schedule-retry", schedulePaymentRetry);
router.post("/abort-retry", abortRetry);
router.get("/status/:paymentId", getPaymentStatus);

router.get("/dashboard", getDashboardStats);
router.get("/test-ai", testAIDiagnosis);
router.get("/test-failed-payment", testFailedPayment);

module.exports = router;
