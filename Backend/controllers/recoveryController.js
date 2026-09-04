const { verify } = require("retell-sdk/lib/webhook_auth");
const mongoose = require("mongoose");

const Payment = require("../models/Payment");
const { sendRecoveryEmail } = require("../services/emailService");
const { makeRecoveryCall } = require("../services/retellService");

const triggerRecoveryCall = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.paymentId)) {
      return res.status(400).json({ success: false, message: "Invalid payment ID" });
    }

    const payment = await Payment.findById(req.params.paymentId);

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment record not found" });
    }

    if (!payment.phone) {
      return res.status(400).json({ success: false, message: "Customer phone number is missing" });
    }

    const call = await makeRecoveryCall({
      phone: payment.phone,
      paymentId: payment._id,
    });

    payment.callId = call.call_id || null;
    payment.callStatus = "INITIATED";
    payment.recoveryChannel = "CALL";
    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Recovery call initiated",
      callId: payment.callId,
    });
  } catch (error) {
    console.error("Recovery call error:", error.message);
    if (req.params.paymentId) {
      await Payment.findByIdAndUpdate(req.params.paymentId, { callStatus: "FAILED" }).catch(() => {});
    }
    return res.status(502).json({ success: false, message: "Failed to initiate recovery call" });
  }
};

const handleRetellWebhook = async (req, res) => {
  const signature = req.get("x-retell-signature");
  const apiKey = process.env.RETELL_API_KEY;

  if (!signature || !apiKey || !req.rawBody) {
    return res.status(401).json({ success: false, message: "Invalid webhook signature" });
  }

  try {
    if (!(await verify(req.rawBody, apiKey, signature))) {
      return res.status(401).json({ success: false, message: "Invalid webhook signature" });
    }
  } catch (error) {
    console.error("Retell webhook signature verification error:", error.message);
    return res.status(401).json({ success: false, message: "Invalid webhook signature" });
  }

  const { event, call } = req.body || {};
  console.log("Retell webhook received:", event);
  if (event !== "call_analyzed") {
    return res.status(200).json({ success: true, message: "Event ignored" });
  }

  const callId = call?.call_id;
  if (!callId) {
    console.error("Retell webhook missing call_id");
    return res.status(400).json({ success: false, message: "call_id is required" });
  }

  const paymentId = call?.metadata?.payment_id || call?.retell_llm_dynamic_variables?.payment_id;
  if (!paymentId) {
    console.error("Retell webhook missing payment_id");
    return res.status(400).json({ success: false, message: "payment_id is required" });
  }

  if (!mongoose.isValidObjectId(paymentId)) {
    return res.status(400).json({ success: false, message: "Invalid payment ID" });
  }

  console.log("Retell call analyzed:");
  console.log("callId:", callId);
  console.log("paymentId:", paymentId);

  const eventKey = `${event}:${callId}`;
  const analysis = call?.call_analysis?.custom_analysis_data;
  if (!analysis) {
    return res.status(400).json({ success: false, message: "custom_analysis_data is required" });
  }

  console.log("Retell custom analysis:");
  console.log("email_consent:", analysis.email_consent);
  console.log("outcome:", analysis.outcome);
  console.log("decline_reason:", analysis.decline_reason);
  console.log("feedback_comment:", analysis.feedback_comment);

  const payment = await Payment.findOneAndUpdate(
    { _id: paymentId, processedWebhookEvents: { $ne: eventKey } },
    { $push: { processedWebhookEvents: eventKey } },
    { new: true }
  );
  if (!payment) {
    return res.status(200).json({ success: true, message: "Webhook already processed" });
  }

  const emailConsent = analysis.email_consent;
  const outcome = analysis.outcome || null;
  payment.callId = callId || payment.callId;
  payment.callStatus = "COMPLETED";
  payment.callOutcome = outcome;
  payment.callResponse = emailConsent === true ? "YES" : emailConsent === false ? "NO" : null;
  payment.customerAcceptedRecovery = emailConsent === true;
  payment.declineReason = analysis.decline_reason || null;
  payment.feedback = analysis.feedback_comment || "";
  payment.recoveryChannel = "CALL";
  await payment.save();

  if (emailConsent === true && !payment.recoveryEmailSent) {
    try {
      const paymentUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/?paymentId=${payment._id}`;
      await sendRecoveryEmail({ email: payment.email, payment, paymentUrl });
      await Payment.findByIdAndUpdate(payment._id, { recoveryEmailSent: true });
      console.log("Recovery email sent successfully for payment:", paymentId);
    } catch (error) {
      console.error("Recovery email error:", error.message);
      await Payment.findByIdAndUpdate(payment._id, { $pull: { processedWebhookEvents: eventKey } });
      return res.status(500).json({ success: false, message: "Recovery email failed" });
    }
  }

  return res.status(200).json({ success: true, message: "Retell webhook processed" });
};

module.exports = { triggerRecoveryCall, handleRetellWebhook };