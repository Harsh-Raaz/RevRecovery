const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, verificationUrl) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify your email - AI Revenue Recovery",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>Verify your email</h2>

        <p>
          Please verify your email address to continue with your payment.
        </p>

        <a
          href="${verificationUrl}"
          style="
            display: inline-block;
            padding: 12px 20px;
            background-color: #111827;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
          "
        >
          Verify Email
        </a>

        <p style="margin-top: 20px;">
          This verification link will expire in 15 minutes.
        </p>

        <p>
          If you did not request this verification, you can ignore this email.
        </p>
      </div>
    `,
  });
};

module.exports = {
  sendVerificationEmail,
};