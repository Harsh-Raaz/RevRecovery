const express = require("express");
const {
  sendVerification,
  verifyEmail,
} = require("../controllers/authController");

const router = express.Router();

router.post("/send-verification", sendVerification);

router.get("/verify-email", verifyEmail);

module.exports = router;