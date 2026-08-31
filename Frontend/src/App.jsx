import { useState ,useEffect} from "react";
import "./App.css";
import axios from "axios";
import { paymentApi } from "./services/api";
function App() {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
const [verified, setVerified] = useState(false);

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

    const response = await axios.post(
      "http://localhost:5000/api/auth/send-verification",
      { email }
    );

    setMessage(response.data.message);
  } catch (error) {
    setMessage(
      error.response?.data?.message ||
      "Something went wrong"
    );
  } finally {
    setLoading(false);
  }
};
  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  try {
    setLoading(true);
    setMessage("");

    // Step 1: Backend se Razorpay order create
    const response = await paymentApi.createPayment({
      email,
      amount: Number(amount),
    });

    const order = response.order;

    // Step 2: Razorpay Checkout open
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,

      amount: order.amount,
      currency: order.currency,

      name: "AI Revenue Recovery",
      description: "Payment",

      order_id: order.id,

      prefill: {
        email: email,
      },

      theme: {
        color: "#2563eb",
      },

      handler: async function (razorpayResponse) {
        try {
          setMessage("Verifying payment...");

          // Step 3: Backend signature verification
          const verification = await paymentApi.verifyPayment({
            razorpay_order_id: razorpayResponse.razorpay_order_id,
            razorpay_payment_id: razorpayResponse.razorpay_payment_id,
            razorpay_signature: razorpayResponse.razorpay_signature,
          });

          if (verification.success) {
            setMessage("Payment successful and verified.");
          } else {
            setMessage("Payment verification failed.");
          }
        } catch (error) {
          console.error(error);
          setMessage("Payment verification failed.");
        }
      },

      modal: {
        ondismiss: function () {
          setMessage("Payment cancelled.");
        },
      },
    };

    const razorpay = new window.Razorpay(options);

    razorpay.on("payment.failed", function (response) {
      console.error("Payment failed:", response.error);

      setMessage(
        response.error.description || "Payment failed."
      );
    });

    razorpay.open();

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
                    setEmail(e.target.value);
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

export default App;