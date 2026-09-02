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
  createPayment: async ({ email, amount }) => {
    const response = await api.post("/payment/create-order", {
      email,
      amount: Number(amount),
    });

    return response.data;
  },

  verifyPayment: async (paymentData) => {
    const response = await api.post("/payment/verify", paymentData);

    return response.data;
  },
  reportFailure: async ({ razorpay_order_id, reason }) => {
    const response = await api.post("/payment/failed", {
      razorpay_order_id,
      reason,
    });

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
