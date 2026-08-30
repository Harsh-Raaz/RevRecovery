import { useState ,useEffect} from "react";
import "./App.css";
import axios from "axios";
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
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    console.log({
      email,
      amount,
    });

    // Next step:
    // Backend API call → QR generation
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
              Enter the payment details below to generate a secure QR code.
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
            <div className="feature-icon">QR</div>
            <div>
              <strong>Instant QR</strong>
              <span>Generate in seconds</span>
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