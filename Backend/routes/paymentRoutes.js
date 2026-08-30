const express = require("express");
const {
  createPaymentOrder,
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/create-order", createPaymentOrder);

module.exports = router;