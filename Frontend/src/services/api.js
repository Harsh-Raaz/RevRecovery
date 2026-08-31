import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

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
};