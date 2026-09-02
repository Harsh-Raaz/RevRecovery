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
            Active Recoveries
          </span>

          <strong>
            {stats.activeRecoveries}
          </strong>

          <span className="stat-subtext">
            Recovery workflows
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
      <section className="dashboard-section">

        <div className="section-header">
          <div>
            <h2>AI Recovery Overview</h2>

            <p>
              Current recovery pipeline
            </p>
          </div>
        </div>

        <div className="recovery-flow">

          <div className="flow-step">
            <div className="flow-number">
              01
            </div>

            <strong>
              Detect
            </strong>

            <span>
              Identify unresolved payments
            </span>
          </div>

          <div className="flow-arrow">
            →
          </div>

          <div className="flow-step">
            <div className="flow-number">
              02
            </div>

            <strong>
              Diagnose
            </strong>

            <span>
              Determine why revenue is at risk
            </span>
          </div>

          <div className="flow-arrow">
            →
          </div>

          <div className="flow-step">
            <div className="flow-number">
              03
            </div>

            <strong>
              Recover
            </strong>

            <span>
              Execute the appropriate action
            </span>
          </div>

          <div className="flow-arrow">
            →
          </div>

          <div className="flow-step">
            <div className="flow-number">
              04
            </div>

            <strong>
              Measure
            </strong>

            <span>
              Track recovered revenue
            </span>
          </div>

        </div>

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