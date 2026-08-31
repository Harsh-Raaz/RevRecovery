const crypto = require("crypto");

const {
  sendVerificationEmail,
} = require("../services/emailService");

const Verification = require("../models/Verification.js");

const sendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email address",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const expiresAt = Date.now() + 15 * 60 * 1000;

    await Verification.findOneAndUpdate(
  { email: email.toLowerCase() },
  {
    email: email.toLowerCase(),
    token,
    expiresAt: new Date(expiresAt),
    verified: false,
  },
  {
    upsert: true,
    new: true,
  }
);

    const verificationUrl =
      `http://localhost:${process.env.PORT || 5000}` +
      `/api/auth/verify-email?token=${token}`;

    await sendVerificationEmail(email, verificationUrl);

    res.status(200).json({
      message: "Verification email sent",
    });
  } catch (error) {
    console.error("Send verification error:", error);

    res.status(500).json({
      message: "Failed to send verification email",
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send("Verification token is missing");
    }

    const verification = await Verification.findOne({
      token,
    });

    if (!verification) {
      return res.status(400).send("Invalid verification token");
    }

    if (Date.now() > verification.expiresAt.getTime()) {
      await Verification.deleteOne({
        _id: verification._id,
      });

      return res.status(400).send("Verification link has expired");
    }

    verification.verified = true;

    await verification.save();

    return res.redirect(
      `http://localhost:5173/?verified=true&email=${encodeURIComponent(
        verification.email
      )}`
    );
  } catch (error) {
    console.error("Verify email error:", error);

    return res.status(500).send("Something went wrong during verification");
  }
};

module.exports = {
  sendVerification,
  verifyEmail,
};