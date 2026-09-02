const express = require("express");

const {
  createPaymentOrder,
  verifyPayment,
  paymentFailed,
  getDashboardStats,
  testAIDiagnosis,
  testFailedPayment,
} = require("../controllers/paymentController.js");

const router = express.Router();

router.post("/create-order", createPaymentOrder);
router.post("/verify", verifyPayment);
router.post("/failed", paymentFailed);

router.get("/dashboard", getDashboardStats);
router.get("/test-ai", testAIDiagnosis);
router.get("/test-failed-payment", testFailedPayment);

module.exports = router;