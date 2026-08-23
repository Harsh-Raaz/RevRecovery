import { useState, useEffect, useCallback } from 'react';
import { paymentApi } from '../services/api';
import toast from 'react-hot-toast';

export const usePayment = (paymentId) => {
  const [payment, setPayment] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Fetch payment status
  const fetchPayment = useCallback(async () => {
    if (!paymentId) return;
    
    try {
      setLoading(true);
      const response = await paymentApi.getPaymentStatus(paymentId);
      setPayment(response.payment);
      setAiRecommendation(response.aiRecommendation);
      setTimeRemaining(response.payment.timeRemaining || 0);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  // Process payment
  const processPayment = useCallback(async () => {
    try {
      toast.loading('Processing payment...', { id: 'payment-processing' });
      const response = await paymentApi.processPayment(paymentId);
      toast.success('Payment processed!', { id: 'payment-processing' });
      await fetchPayment();
      return response;
    } catch (err) {
      toast.error(err.message, { id: 'payment-processing' });
      throw err;
    }
  }, [paymentId, fetchPayment]);

  // Retry payment
  const retryPayment = useCallback(async () => {
    try {
      toast.loading('Retrying payment...', { id: 'payment-retry' });
      const response = await paymentApi.retryPayment(paymentId);
      if (response.result.success) {
        toast.success('Retry successful!', { id: 'payment-retry' });
      } else {
        toast.error(response.result.message, { id: 'payment-retry' });
      }
      await fetchPayment();
      return response;
    } catch (err) {
      toast.error(err.message, { id: 'payment-retry' });
      throw err;
    }
  }, [paymentId, fetchPayment]);

  // Schedule retry
  const scheduleRetry = useCallback(async () => {
    try {
      toast.loading('Scheduling retry...', { id: 'schedule-retry' });
      const response = await paymentApi.scheduleRetry(paymentId);
      toast.success('Retry scheduled for 15 minutes!', { id: 'schedule-retry' });
      await fetchPayment();
      return response;
    } catch (err) {
      toast.error(err.message, { id: 'schedule-retry' });
      throw err;
    }
  }, [paymentId, fetchPayment]);

  // Abort payment
  const abortPayment = useCallback(async () => {
    try {
      toast.loading('Aborting payment...', { id: 'abort-payment' });
      const response = await paymentApi.abortPayment(paymentId);
      toast.success('Payment aborted!', { id: 'abort-payment' });
      await fetchPayment();
      return response;
    } catch (err) {
      toast.error(err.message, { id: 'abort-payment' });
      throw err;
    }
  }, [paymentId, fetchPayment]);

  // Get AI recommendation
  const getAIRecommendation = useCallback(async () => {
    try {
      const response = await paymentApi.getAIRecommendation(paymentId);
      setAiRecommendation(response.recommendation);
      return response;
    } catch (err) {
      toast.error('Failed to get AI recommendation');
      throw err;
    }
  }, [paymentId]);

  // Auto-fetch every 10 seconds
  useEffect(() => {
    fetchPayment();
    
    const interval = setInterval(() => {
      fetchPayment();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchPayment]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  return {
    payment,
    aiRecommendation,
    loading,
    error,
    timeRemaining,
    fetchPayment,
    processPayment,
    retryPayment,
    scheduleRetry,
    abortPayment,
    getAIRecommendation,
  };
};