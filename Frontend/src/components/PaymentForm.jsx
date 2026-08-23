import { useState } from 'react';
import { FaSpinner } from 'react-icons/fa';

const PaymentForm = ({ onSubmit, loading }) => {
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Amount validation
    if (!amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(amount) || Number(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (Number(amount) > 1000000) {
      newErrors.amount = 'Amount cannot exceed ₹10,00,000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ email, amount: Number(amount) });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`input-field ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
          placeholder="customer@example.com"
          disabled={loading}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      {/* Amount Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount (₹)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-gray-500">₹</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`input-field pl-8 ${errors.amount ? 'border-red-500 focus:ring-red-500' : ''}`}
            placeholder="500"
            min="1"
            step="1"
            disabled={loading}
          />
        </div>
        {errors.amount && (
          <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">Minimum amount: ₹1</p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full btn-primary py-3 text-base flex items-center justify-center"
        disabled={loading}
      >
        {loading ? (
          <>
            <FaSpinner className="animate-spin mr-2" />
            Generating QR...
          </>
        ) : (
          'Generate QR Code'
        )}
      </button>

      {/* Info Note */}
      <p className="text-xs text-gray-500 text-center mt-4">
        🔒 Secure payment processing with AI-powered recovery
      </p>
    </form>
  );
};

export default PaymentForm;