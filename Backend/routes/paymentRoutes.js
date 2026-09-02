const express = require("express");

const {
  createPaymentOrder,
  verifyPayment,
  paymentFailed,
  getDashboardStats,
} = require("../controllers/paymentController.js");
const router = express.Router();

router.post("/create-order", createPaymentOrder);

router.post("/verify", verifyPayment);

router.post("/failed", paymentFailed);

router.get("/dashboard", getDashboardStats);

module.exports = router;