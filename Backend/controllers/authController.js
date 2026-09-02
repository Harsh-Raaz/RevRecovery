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

    const normalizedEmail = email.trim().toLowerCase();
    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
      return res.status(500).json({
        message: "Server verification URL is not configured",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const expiresAt = Date.now() + 15 * 60 * 1000;

    await Verification.findOneAndUpdate(
  { email: normalizedEmail },
  {
    email: normalizedEmail,
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
      `${backendUrl.replace(/\/$/, "")}` +
      `/api/auth/verify-email?token=${encodeURIComponent(token)}`;

    await sendVerificationEmail(normalizedEmail, verificationUrl);

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

    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      return res.status(500).send("Server frontend URL is not configured");
    }

    verification.verified = true;

    await verification.save();

    return res.redirect(
      `${frontendUrl.replace(/\/$/, "")}/?verified=true&email=${encodeURIComponent(
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
