const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [1, "Amount must be at least 1"],
    },

    // Razorpay details
    razorpayOrderId: {
      type: String,
      unique: true,
      sparse: true,
    },

    razorpayPaymentId: {
      type: String,
    },

    razorpaySignature: {
      type: String,
    },

    paymentMethod: {
      type: String,
      enum: ["card", "netbanking", "wallet", "upi", "emi", "paylater", null],
      default: null,
    },

    paymentBank: {
      type: String,
      default: null,
    },

    orderHistory: [
      {
        orderId: String,
        attempt: Number,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    currency: {
      type: String,
      default: "INR",
    },

    qrCode: {
      type: String,
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "PROCESSING",
        "SUCCESS",
        "FAILED",
        "RETRYING",
        "WAITING_FOR_RETRY",
        "ABORTED",
        "EXPIRED",
      ],
      default: "PENDING",
    },

    paymentAttempted: {
      type: Boolean,
      default: false,
    },
        recovered: {
      type: Boolean,
      default: false,
    },

    retryCount: {
      type: Number,
      default: 0,
    },

    maxRetries: {
      type: Number,
      default: 2,
    },

    failureReason: {
      type: String,
    },

    failureHistory: [
      {
        attempt: Number,
        reason: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    expiresAt: {
      type: Date,
    },

    lastAttemptAt: {
      type: Date,
    },

    nextRetryAt: {
      type: Date,
    },

    customerResponse: {
      type: String,
    },

    abortRequested: {
      type: Boolean,
      default: false,
    },

    completedAt: {
      type: Date,
    },

    incompleteEmailSent: {
      type: Boolean,
      default: false,
    },

    callStatus: {
      type: String,
      enum: ["NOT_ATTEMPTED", "INITIATED", "COMPLETED", "FAILED"],
      default: "NOT_ATTEMPTED",
    },

    callId: {
      type: String,
      default: null,
    },

    callResponse: {
      type: String,
      enum: ["YES", "NO", null],
      default: null,
    },

    customerAcceptedRecovery: {
      type: Boolean,
      default: false,
    },

    recoveryChannel: {
      type: String,
      enum: ["NONE", "CALL", "EMAIL"],
      default: "NONE",
    },

    declineReason: {
      type: String,
      enum: ["price", "changed_mind", "technical_issue", "other", null],
      default: null,
    },

    feedback: {
      type: String,
      default: "",
    },

    callOutcome: {
      type: String,
      enum: [
        "consented",
        "declined",
        "already_paid",
        "opted_out",
        "voicemail",
        "unreachable",
        null,
      ],
      default: null,
    },

    recoveryEmailSent: {
      type: Boolean,
      default: false,
    },

    processedWebhookEvents: {
      type: [String],
      default: [],
    },

    lastReminderAt: {
      type: Date,
    },

    reminderCount: {
      type: Number,
      default: 0,
    },

    aiRecommendation: {
  classification: String,
  rootCause: String,
  action: String,
  confidence: Number,
  recoveryProbability: Number,
  retryAfterMinutes: Number,
  customerMessage: String,
  reason: String,
  riskLevel: String,
  diagnosedAt: Date,
},

    // Each failure is diagnosed independently; retain prior diagnoses for audit.
    aiDiagnosisHistory: [
      {
        classification: String,
        rootCause: String,
        action: String,
        confidence: Number,
        recoveryProbability: Number,
        retryAfterMinutes: Number,
        customerMessage: String,
        reason: String,
        riskLevel: String,
        diagnosedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({
  status: 1,
  expiresAt: 1,
});

paymentSchema.index({
  status: 1,
  nextRetryAt: 1,
});

paymentSchema.index({
  email: 1,
  createdAt: -1,
});

paymentSchema.virtual("timeRemaining").get(function () {
  if (!this.expiresAt) return 0;

  const remaining = this.expiresAt - Date.now();

  return Math.max(0, Math.floor(remaining / 1000));
});

paymentSchema.methods.isExpired = function () {
  if (!this.expiresAt) return false;

  return Date.now() > this.expiresAt;
};

paymentSchema.methods.canRetry = function () {
  return (
    this.status !== "SUCCESS" &&
    this.status !== "ABORTED" &&
    !this.abortRequested &&
    !this.isExpired() &&
    this.retryCount < this.maxRetries
  );
};

module.exports = mongoose.model("Payment", paymentSchema);
