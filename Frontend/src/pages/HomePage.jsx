import { useState, useEffect, useRef } from "react";
import "../App.css";
import { authApi, paymentApi } from "../services/api";
function HomePage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [retryPayment, setRetryPayment] = useState(null);
  const [retrySeconds, setRetrySeconds] = useState("");
  const [retryMinutes, setRetryMinutes] = useState("");
  const [retryHours, setRetryHours] = useState("");
  const [retrySecondsRemaining, setRetrySecondsRemaining] = useState(0);
const [verified, setVerified] = useState(false);
  const retryPollingRef = useRef(null);
  const openedRetryOrderIdRef = useRef(null);

  const stopRetryPolling = () => {
    if (retryPollingRef.current) {
      clearInterval(retryPollingRef.current);
      retryPollingRef.current = null;
    }
  };

  useEffect(() => {
  const params = new URLSearchParams(window.location.search);

  if (params.get("verified") === "true") {
    setVerified(true);
    setMessage("Email verified successfully!");

    const verifiedEmail = params.get("email");

    if (verifiedEmail) {
      setEmail(verifiedEmail);
    }

    // URL se query parameters hata do
    window.history.replaceState({}, document.title, "/");
  }
}, []);

  useEffect(() => () => stopRetryPolling(), []);

  useEffect(() => {
    if (!retryPayment?.nextRetryAt) {
      setRetrySecondsRemaining(0);
      return undefined;
    }

    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(retryPayment.nextRetryAt).getTime() - Date.now()) / 1000)
      );
      setRetrySecondsRemaining(remaining);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [retryPayment?.nextRetryAt]);

  const setRetryValue = (unit, value) => {
    setRetrySeconds(unit === "SECONDS" ? value : "");
    setRetryMinutes(unit === "MINUTES" ? value : "");
    setRetryHours(unit === "HOURS" ? value : "");
  };
  const validateForm = () => {
    const newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!amount) {
      newErrors.amount = "Amount is required";
    } else if (Number(amount) <= 0) {
      newErrors.amount = "Amount must be greater than ₹0";
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };
  const handleVerify = async () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    setMessage("Please enter a valid email");
    return;
  }

  try {
    setLoading(true);
    setMessage("");

    const response = await authApi.sendVerification(email);
    setMessage(response.message);
  } catch (error) {
    setMessage(
      error.response?.data?.message ||
      "Something went wrong"
    );
  } finally {
    setLoading(false);
  }
};

  const openCheckout = (order, paymentId) => {
    if (!window.Razorpay) {
      setMessage("Razorpay Checkout failed to load. Please refresh the page.");
      return;
    }

    let paymentAttempted = false;
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "AI Revenue Recovery",
      description: "Payment",
      order_id: order.id,
      prefill: { email },
      theme: { color: "#2563eb" },
      handler: async function (razorpayResponse) {
        try {
          setMessage("Verifying payment...");
          const verification = await paymentApi.verifyPayment({
            razorpay_order_id: razorpayResponse.razorpay_order_id,
            razorpay_payment_id: razorpayResponse.razorpay_payment_id,
            razorpay_signature: razorpayResponse.razorpay_signature,
          });

          setMessage(
            verification.success
              ? "Payment successful and verified."
              : "Payment verification failed."
          );
        } catch (error) {
          console.error("Payment verification error:", error);
          setMessage("Payment verification failed.");
        }
      },
      modal: {
        ondismiss: async function () {
          setMessage("Payment cancelled.");
          if (!paymentAttempted) {
            try {
              await paymentApi.reportCheckoutAbandoned(order.id);
            } catch (error) {
              console.error("Failed to record checkout abandonment:", error);
            }
          }
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on("payment.failed", async function (response) {
      paymentAttempted = true;
      console.error("Payment failed:", response.error);
      setMessage(response.error.description || "Payment failed.");

      try {
        const failure = await paymentApi.reportFailure({
          razorpay_order_id: order.id,
          reason: response.error.description || "Payment failed",
        });

        setRetryPayment({ ...failure.payment, paymentId });

        if (failure.payment?.status === "WAITING_FOR_RETRY") {
          startRetryPolling(paymentId);
        }
      } catch (error) {
        console.error("Failed to save payment failure:", error);
      }
    });

    razorpay.open();
  };

  useEffect(() => {
    const paymentId = new URLSearchParams(window.location.search).get("paymentId");
    if (!paymentId) return;

    paymentApi.getPaymentStatus(paymentId)
      .then((response) => {
        if (response.success && response.payment?.status !== "SUCCESS") {
          setRetryPayment({ ...response.payment, paymentId });
          openCheckout(response.payment.order, paymentId);
        }
      })
      .catch((error) => {
        console.error("Recovery payment load error:", error);
        setMessage("Unable to load the recovery payment.");
      });
  }, []);

  const startRetryPolling = (paymentId) => {
    stopRetryPolling();
    setMessage("Recovery retry is scheduled. Waiting for the new payment order...");

    const poll = async () => {
      try {
        const response = await paymentApi.getPaymentStatus(paymentId);
        const payment = response.payment;
        setRetryPayment({ ...payment, paymentId });

        if (
          payment.status === "RETRYING" &&
          payment.retryCount > 0 &&
          payment.order?.id &&
          openedRetryOrderIdRef.current !== payment.order.id
        ) {
          openedRetryOrderIdRef.current = payment.order.id;
          stopRetryPolling();
          setMessage(`Opening retry #${payment.retryCount}...`);
          openCheckout(payment.order, paymentId);
          return;
        }

        if (["SUCCESS", "ABORTED", "FAILED"].includes(payment.status)) {
          stopRetryPolling();
        }
      } catch (error) {
        console.error("Retry status polling error:", error);
        stopRetryPolling();
      }
    };

    poll();
    retryPollingRef.current = setInterval(poll, 3000);
  };

  const handleScheduleRetry = async () => {
    if (!retryPayment) return;

    const retrySelection = retrySeconds
      ? { retryAfter: retrySeconds, retryUnit: "SECONDS" }
      : retryMinutes
      ? { retryAfter: retryMinutes, retryUnit: "MINUTES" }
      : retryHours
      ? { retryAfter: retryHours, retryUnit: "HOURS" }
      : null;

    if (!retrySelection || Number(retrySelection.retryAfter) <= 0) {
      setMessage("Enter a positive retry time in seconds, minutes, or hours.");
      return;
    }

    try {
      const response = await paymentApi.scheduleRetry(
        retryPayment.paymentId,
        retrySelection
      );
      setRetryPayment({ ...response.payment, paymentId: retryPayment.paymentId });
      setMessage("Recovery retry is scheduled.");
      startRetryPolling(retryPayment.paymentId);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to schedule retry.");
    }
  };

  const handleAbortRetry = async () => {
    if (!retryPayment) return;

    try {
      await paymentApi.abortRetry(retryPayment.paymentId);
      stopRetryPolling();
      setRetryPayment(null);
      setRetrySecondsRemaining(0);
      setMessage("Retry cancelled.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to cancel retry.");
    }
  };

  const formatRetryCountdown = () => {
    const hours = Math.floor(retrySecondsRemaining / 3600);
    const minutes = Math.floor((retrySecondsRemaining % 3600) / 60);
    const seconds = retrySecondsRemaining % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  if (!verified) {
    setMessage("Please verify your email before making a payment.");
    return;
  }

  stopRetryPolling();
  openedRetryOrderIdRef.current = null;

  try {
    setLoading(true);
    setMessage("");

    // Step 1: Backend se Razorpay order create
    const response = await paymentApi.createPayment({
      email,
      phone,
      amount: Number(amount),
    });

    openCheckout(response.order, response.paymentId);

  } catch (error) {
    console.error("Payment error:", error);

    setMessage(
      error.response?.data?.message ||
      error.message ||
      "Failed to start payment"
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="app">
      <div className="background-glow glow-one"></div>
      <div className="background-glow glow-two"></div>

      <main className="payment-container">
        <div className="brand">
          <div className="brand-icon">₹</div>
          <span>AI Revenue Recovery</span>
        </div>

        <section className="payment-card">
          <div className="card-header">
            <span className="badge">SECURE PAYMENT</span>

            <h1>
              Make a payment.
              <br />
              <span>We handle the recovery.</span>
            </h1>

            <p>
                Enter the payment details below to make a secure payment.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">Email address</label>
              
              <div
                className={`input-wrapper ${
                  errors.email ? "input-error" : ""
                }`}
              >
                <span className="input-icon">@</span>

                <input
                  id="email"
                  type="text"
                  placeholder="customer@example.com"
                  value={email}
                  onChange={(e) => {
                    const nextEmail = e.target.value;
                    if (nextEmail !== email && verified) {
                      setVerified(false);
                      setMessage("Email changed. Please verify the new email before making a payment.");
                    }
                    setEmail(nextEmail);
                    if (errors.email) {
                      setErrors((prev) => ({
                        ...prev,
                        email: "",
                      }));
                    }
                  }}
                />
                <button
  type="button"
  onClick={handleVerify}
  disabled={loading || verified}
>
  {verified
    ? "✓ Verified"
    : loading
    ? "Sending..."
    : "Verify"}
</button>
              </div>
    {message && (
  <p className={verified ? "success-message" : ""}>
    {message}
  </p>
)}
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="phone">Customer phone number</label>
              <div className={`input-wrapper ${errors.phone ? "input-error" : ""}`}>
                <span className="input-icon">+</span>
                <input
                  id="phone"
                  type="tel"
                  placeholder="91 9876543210"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
                  }}
                />
              </div>
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="amount">Payment amount</label>

              <div
                className={`input-wrapper ${
                  errors.amount ? "input-error" : ""
                }`}
              >
                <span className="currency">₹</span>

                <input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errors.amount) {
                      setErrors((prev) => ({
                        ...prev,
                        amount: "",
                      }));
                    }
                  }}
                />
              </div>

              {errors.amount && (
                <span className="error-message">{errors.amount}</span>
              )}
            </div>

            <button type="submit" className="generate-button">
              <span>Generate Payment QR</span>
              <span className="arrow">→</span>
            </button>
          </form>

          {retryPayment && (
            <div className="security-note">
              {retryPayment.aiRecommendation?.customerMessage && (
                <span>{retryPayment.aiRecommendation.customerMessage}</span>
              )}
              {retryPayment.status === "WAITING_FOR_RETRY" && (
                <span>Retry in {formatRetryCountdown()}</span>
              )}
              <div>
                <input
                  aria-label="Retry after seconds"
                  type="number"
                  min="1"
                  placeholder="sec"
                  value={retrySeconds}
                  disabled={Boolean(retryMinutes || retryHours)}
                  onChange={(event) => setRetryValue("SECONDS", event.target.value)}
                />
                <span> sec </span>
                <input
                  aria-label="Retry after minutes"
                  type="number"
                  min="1"
                  placeholder="min"
                  value={retryMinutes}
                  disabled={Boolean(retrySeconds || retryHours)}
                  onChange={(event) => setRetryValue("MINUTES", event.target.value)}
                />
                <span> min </span>
                <input
                  aria-label="Retry after hours"
                  type="number"
                  min="1"
                  placeholder="hr"
                  value={retryHours}
                  disabled={Boolean(retrySeconds || retryMinutes)}
                  onChange={(event) => setRetryValue("HOURS", event.target.value)}
                />
                <span> hr </span>
                <button
                  type="button"
                  onClick={() => {
                    if (retrySecondsRemaining === 0 && retryPayment.status === "WAITING_FOR_RETRY") {
                      startRetryPolling(retryPayment.paymentId);
                    } else {
                      handleScheduleRetry();
                    }
                  }}
                  disabled={retryPayment.status === "WAITING_FOR_RETRY" && retrySecondsRemaining > 0}
                >
                  Retry
                </button>
              </div>
              <button type="button" onClick={handleAbortRetry}>
                Stop Retry
              </button>
            </div>
          )}

          <div className="security-note">
            <span>🔒</span>
            <span>Your payment information is securely processed.</span>
          </div>
        </section>

        <div className="features">
          <div className="feature">
            <div className="feature-icon">₹</div>
              <div>
              <strong>Instant Payment</strong>
              <span>Secure Razorpay checkout</span>
              </div>
            </div>

          <div className="feature-divider"></div>

          <div className="feature">
            <div className="feature-icon">AI</div>
            <div>
              <strong>Smart Recovery</strong>
              <span>Automatic retry handling</span>
            </div>
          </div>

          <div className="feature-divider"></div>

          <div className="feature">
            <div className="feature-icon">✓</div>
            <div>
              <strong>Real-time Status</strong>
              <span>Track every attempt</span>
            </div>
          </div>
        </div>

        <footer>
          AI Revenue Recovery · Secure Payment Infrastructure
        </footer>
      </main>
    </div>
  );
}

export default HomePage;
