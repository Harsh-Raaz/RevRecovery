import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.message || 'Something went wrong';
      return Promise.reject({ message, status: error.response.status });
    } else if (error.request) {
      // Request made but no response
      return Promise.reject({ message: 'Network error. Please check your connection.' });
    } else {
      // Something else
      return Promise.reject({ message: error.message || 'An error occurred' });
    }
  }
);

// Payment APIs
export const paymentApi = {
  // Create new payment
  createPayment: async (data) => {
    const response = await api.post('/payments/create', data);
    return response.data;
  },

  // Get payment status
  getPaymentStatus: async (paymentId) => {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data;
  },

  // Process payment
  processPayment: async (paymentId) => {
    const response = await api.post(`/payments/${paymentId}/process`);
    return response.data;
  },

  // Retry payment
  retryPayment: async (paymentId) => {
    const response = await api.post(`/payments/${paymentId}/retry`);
    return response.data;
  },

  // Schedule retry
  scheduleRetry: async (paymentId) => {
    const response = await api.post(`/payments/${paymentId}/schedule-retry`);
    return response.data;
  },

  // Abort payment
  abortPayment: async (paymentId) => {
    const response = await api.post(`/payments/${paymentId}/abort`);
    return response.data;
  },

  // Get AI recommendation
  getAIRecommendation: async (paymentId) => {
    const response = await api.get(`/payments/${paymentId}/ai-recommendation`);
    return response.data;
  },

  // Get statistics
  getStats: async () => {
    const response = await api.get('/payments/stats');
    return response.data;
  },
};

export default api;