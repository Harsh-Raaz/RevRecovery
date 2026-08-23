const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [1, 'Amount must be at least 1']
    },
    qrCode: {
        type: String
    },
    status: {
        type: String,
        enum: [
            'PENDING',
            'PROCESSING',
            'SUCCESS',
            'FAILED',
            'RETRYING',
            'WAITING_FOR_RETRY',
            'ABORTED',
            'EXPIRED'
        ],
        default: 'PENDING'
    },
    retryCount: {
        type: Number,
        default: 0
    },
    maxRetries: {
        type: Number,
        default: 3
    },
    failureReason: {
        type: String
    },
    failureHistory: [{
        attempt: Number,
        reason: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date
    },
    lastAttemptAt: {
        type: Date
    },
    nextRetryAt: {
        type: Date
    },
    customerResponse: {
        type: String
    },
    abortRequested: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date
    },
    incompleteEmailSent: {
        type: Boolean,
        default: false
    },
    lastReminderAt: {
        type: Date
    },
    reminderCount: {
        type: Number,
        default: 0
    },
    aiRecommendation: {
        classification: String,
        action: String,
        confidence: Number,
        reason: String
    }
}, {
    timestamps: true
});

// Indexes for performance
paymentSchema.index({ status: 1, expiresAt: 1 });
paymentSchema.index({ status: 1, nextRetryAt: 1 });
paymentSchema.index({ email: 1, createdAt: -1 });

// Virtual for time remaining
paymentSchema.virtual('timeRemaining').get(function() {
    if (!this.expiresAt) return 0;
    const remaining = this.expiresAt - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
});

// Method to check if payment is expired
paymentSchema.methods.isExpired = function() {
    if (!this.expiresAt) return false;
    return Date.now() > this.expiresAt;
};

// Method to check if can retry
paymentSchema.methods.canRetry = function() {
    return (
        this.status !== 'SUCCESS' &&
        this.status !== 'ABORTED' &&
        !this.abortRequested &&
        !this.isExpired() &&
        this.retryCount < this.maxRetries
    );
};

module.exports = mongoose.model('Payment', paymentSchema);