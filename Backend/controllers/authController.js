const crypto = require("crypto");

const {
  sendVerificationEmail,
} = require("../services/emailService");

const verificationTokens = new Map();

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

    verificationTokens.set(email, {
      token,
      expiresAt,
      verified: false,
    });

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

const verifyEmail = (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send("Verification token is missing");
    }

    for (const [email, data] of verificationTokens.entries()) {
      if (data.token === token) {
        if (Date.now() > data.expiresAt) {
          verificationTokens.delete(email);

          return res.status(400).send(
            "Verification link has expired"
          );
        }

        data.verified = true;

        verificationTokens.set(email, data);

        return res.status(200).send(`
          <h1>Email Verified Successfully</h1>
          <p>${email}</p>
          <p>Your email has been verified.</p>
        `);
      }
    }

    return res.status(400).send(
      "Invalid verification token"
    );
  } catch (error) {
    console.error("Verify email error:", error);

    res.status(500).send(
      "Something went wrong during verification"
    );
  }
};

module.exports = {
  sendVerification,
  verifyEmail,
};