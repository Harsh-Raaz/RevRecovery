const express = require("express");
const {
  triggerRecoveryCall,
  handleRetellWebhook,
} = require("../controllers/recoveryController");

const router = express.Router();

router.post("/call/:paymentId", triggerRecoveryCall);
router.post("/retell-webhook", handleRetellWebhook);

module.exports = router;