import { useEffect, useState } from "react";
import { paymentApi } from "../services/api";
import "./Dashboard.css";

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await paymentApi.getDashboard();

      if (response.success) {
        setDashboard(response);
      } else {
        setError("Failed to load dashboard");
      }
    } catch (error) {
      console.error("Dashboard error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">
          {error}
          <button onClick={loadDashboard}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = dashboard?.stats || {};
  const payments = dashboard?.recentPayments || [];

  return (
    <div className="dashboard-page">

      {/* Header */}
      <header className="dashboard-header">
        <div>
          <div className="dashboard-brand">
            <div className="dashboard-brand-icon">
              ₹
            </div>

            <span>
              AI Revenue Recovery
            </span>
          </div>

          <h1>Revenue Recovery Dashboard</h1>

          <p>
            Detect, diagnose and recover revenue
            at risk.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={loadDashboard}
        >
          ↻ Refresh
        </button>
      </header>

      {/* KPI Cards */}
      <section className="stats-grid">

        <div className="stat-card">
          <span className="stat-label">
            Total Payment Volume
          </span>

          <strong>
            ₹{stats.totalPaymentVolume?.toLocaleString("en-IN")}
          </strong>

          <span className="stat-subtext">
            {stats.totalPayments} payments
          </span>
        </div>

        <div className="stat-card risk-card">
          <span className="stat-label">
            Revenue at Risk
          </span>

          <strong>
            ₹{stats.revenueAtRisk?.toLocaleString("en-IN")}
          </strong>

          <span className="stat-subtext">
            Unresolved revenue
          </span>
        </div>

        <div className="stat-card recovered-card">
          <span className="stat-label">
            Recovered Revenue
          </span>

          <strong>
            ₹{stats.recoveredRevenue?.toLocaleString("en-IN")}
          </strong>

          <span className="stat-subtext">
            Successfully recovered
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">
            Recovery Rate
          </span>

          <strong>
            {stats.recoveryRate}%
          </strong>

          <span className="stat-subtext">
            Recovery performance
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">
            Failed Payments
          </span>

          <strong>
            {stats.failedPayments}
          </strong>

          <span className="stat-subtext">
            Requiring attention
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">
            Total Recoveries Made
          </span>

          <strong>
            {stats.recoveredCount}
          </strong>

          <span className="stat-subtext">
            Payments successfully recovered
          </span>
        </div>

      </section>

      {/* Revenue At Risk */}
      <section className="dashboard-section">

        <div className="section-header">
          <div>
            <h2>Revenue at Risk</h2>

            <p>
              Payments requiring recovery action
            </p>
          </div>

          <span className="section-count">
            ₹{stats.revenueAtRisk?.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="table-container">

          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Amount</th>
                <th>Problem</th>
                <th>Status</th>
                <th>Retry Count</th>
                <th>Recovery Call</th>
              </tr>
            </thead>

            <tbody>
              {payments
                .filter(
                  (payment) =>
                    payment.status !== "SUCCESS"
                )
                .map((payment) => (
                  <tr key={payment._id}>

                    <td>
                      {payment.email}
                    </td>

                    <td>
                      ₹
                      {payment.amount?.toLocaleString(
                        "en-IN"
                      )}
                    </td>

                    <td>
                      {payment.failureReason ||
                        (
                          payment.status ===
                          "PENDING"
                            ? "Payment pending"
                            : "Payment failed"
                        )}
                    </td>

                    <td>
                      <span
                        className={`status-badge ${payment.status.toLowerCase()}`}
                      >
                        {payment.status}
                      </span>
                    </td>

                    <td>
                      {payment.retryCount}
                    </td>

                    <td>
                      {payment.callStatus || "NOT_ATTEMPTED"}
                      {payment.callOutcome && ` / ${payment.callOutcome}`}
                      {payment.callResponse && ` / ${payment.callResponse}`}
                      {payment.customerAcceptedRecovery && " / Accepted"}
                      {payment.recoveryEmailSent && " / Email sent"}
                      {payment.declineReason && ` / ${payment.declineReason}`}
                      {payment.feedback && <small>{payment.feedback}</small>}
                    </td>

                  </tr>
                ))}
            </tbody>
          </table>

          {payments.filter(
            (payment) =>
              payment.status !== "SUCCESS"
          ).length === 0 && (
            <div className="empty-state">
              No revenue currently at risk.
            </div>
          )}

        </div>
      </section>

      {/* AI Diagnosis */}
      {/* AI Diagnosis */}
<section className="dashboard-section">

  <div className="section-header">
    <div>
      <h2>AI Recovery Intelligence</h2>

      <p>
        Gemini-powered diagnosis and recovery recommendations
      </p>
    </div>
  </div>

  {payments.filter(
    (payment) => payment.aiRecommendation
  ).length === 0 ? (

    <div className="empty-state">
      No AI diagnosis available yet.
      <br />
      AI diagnosis will appear here after a payment failure.
    </div>

  ) : (

    <div className="ai-diagnosis-list">

      {payments
        .filter((payment) => payment.aiRecommendation)
        .map((payment) => {

          const ai = payment.aiRecommendation;

          return (
            <div
              className="ai-diagnosis-card"
              key={payment._id}
            >

              <div className="ai-card-header">

                <div>
                  <strong>
                    {payment.email}
                  </strong>

                  <span>
                    Payment: ₹
                    {payment.amount?.toLocaleString("en-IN")}
                  </span>
                </div>

                <span
                  className={`risk-badge ${
                    ai.riskLevel?.toLowerCase()
                  }`}
                >
                  {ai.riskLevel || "UNKNOWN"} RISK
                </span>

              </div>

              <div className="ai-grid">

                <div className="ai-item">
                  <span>Diagnosis</span>
                  <strong>
                    {ai.classification || "N/A"}
                  </strong>
                </div>

                <div className="ai-item">
                  <span>Root Cause</span>
                  <strong>
                    {ai.rootCause || "N/A"}
                  </strong>
                </div>

                <div className="ai-item">
                  <span>AI Confidence</span>
                  <strong>
                    {ai.confidence != null
                      ? `${Math.round(ai.confidence * 100)}%`
                      : "N/A"}
                  </strong>
                </div>

                <div className="ai-item">
                  <span>Recovery Probability</span>
                  <strong>
                    {ai.recoveryProbability != null
                      ? `${Math.round(
                          ai.recoveryProbability * 100
                        )}%`
                      : "N/A"}
                  </strong>
                </div>

                <div className="ai-item">
                  <span>Recommended Action</span>
                  <strong>
                    {ai.action === "CONTACT_CUSTOMER"
                      ? "CONTACT CUSTOMER"
                      : ai.action === "TRY_LATER"
                      ? "TRY LATER"
                      : ai.action || "N/A"}
                  </strong>
                </div>

                <div className="ai-item">
                  <span>Retry After</span>
                  <strong>
                    {ai.retryAfterMinutes != null
                      ? `${ai.retryAfterMinutes} minutes`
                      : "N/A"}
                  </strong>
                </div>

              </div>

              <div className="ai-reason">

                <span>AI Reasoning</span>

                <p>
                  {ai.reason || "No reasoning available."}
                </p>

              </div>

              <div className="ai-message">

                <span>Customer Message</span>

                <p>
                  {ai.customerMessage ||
                    "No customer message generated."}
                </p>

              </div>

            </div>
          );
        })}

    </div>
  )}

</section>

      {/* Recent Transactions */}
      <section className="dashboard-section">

        <div className="section-header">
          <div>
            <h2>Recent Transactions</h2>

            <p>
              Latest payment activity
            </p>
          </div>
        </div>

        <div className="table-container">

          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Recovery</th>
                <th>Call</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((payment) => (
                <tr key={payment._id}>

                  <td>
                    {payment.email}
                  </td>

                  <td>
                    {payment.callStatus || "NOT_ATTEMPTED"}
                    {payment.callOutcome && ` / ${payment.callOutcome}`}
                    {payment.callResponse && ` / ${payment.callResponse}`}
                    {payment.recoveryEmailSent && " / Email sent"}
                  </td>

                  <td>
                    ₹
                    {payment.amount?.toLocaleString(
                      "en-IN"
                    )}
                  </td>

                  <td>
                    <span
                      className={`status-badge ${payment.status.toLowerCase()}`}
                    >
                      {payment.status}
                    </span>
                  </td>

                  <td>
                    {payment.recovered
                      ? "Recovered"
                      : payment.status ===
                        "SUCCESS"
                      ? "Normal"
                      : "At Risk"}
                  </td>

                  <td>
                    {new Date(
                      payment.createdAt
                    ).toLocaleDateString("en-IN")}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </section>

    </div>
  );
}

export default Dashboard;
