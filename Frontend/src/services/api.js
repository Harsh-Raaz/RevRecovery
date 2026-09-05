import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

export const authApi = {
  sendVerification: async (email) => {
    const response = await api.post("/auth/send-verification", { email });
    return response.data;
  },
};

export const paymentApi = {
  createPayment: async ({ email, phone, amount }) => {
    const response = await api.post("/payment/create-order", {
      email,
      phone,
      amount: Number(amount),
    });

    return response.data;
  },

  verifyPayment: async (paymentData) => {
    const response = await api.post("/payment/verify", paymentData);

    return response.data;
  },
  reportFailure: async ({ razorpay_order_id, reason, payment_method, payment_id }) => {
    const response = await api.post("/payment/failed", {
      razorpay_order_id,
      reason,
      payment_method,
      payment_id,
    });

    return response.data;
  },
  reportCheckoutAbandoned: async (razorpay_order_id) => {
    const response = await api.post("/payment/checkout-abandoned", {
      razorpay_order_id,
    });

    return response.data;
  },
  scheduleRetry: async (paymentId, { retryAfter, retryUnit }) => {
    const response = await api.post(`/payment/${paymentId}/schedule-retry`, {
      retryAfter: Number(retryAfter),
      retryUnit,
    });

    return response.data;
  },
  abortRetry: async (paymentId) => {
    const response = await api.post("/payment/abort-retry", { paymentId });

    return response.data;
  },
  getPaymentStatus: async (paymentId) => {
    const response = await api.get(`/payment/status/${paymentId}`);

    return response.data;
  },
    getDashboard: async () => {
    const response = await api.get("/payment/dashboard");

    return response.data;
  },
};
