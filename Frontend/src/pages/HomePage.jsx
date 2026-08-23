import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentApi } from '../services/api';
import PaymentForm from '../components/PaymentForm';
import { FaRocket, FaShieldAlt, FaBrain, FaClock } from 'react-icons/fa';
import toast from 'react-hot-toast';

const HomePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handlePaymentSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await paymentApi.createPayment(data);
      toast.success('Payment QR generated successfully!');
      navigate(`/payment/${response.paymentId}`);
    } catch (error) {
      toast.error(error.message || 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4">
              AI Revenue Recovery
            </h1>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto">
              Intelligent payment recovery system powered by AI that maximizes payment success rates
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="card text-center">
            <FaBrain className="text-4xl text-primary-500 mx-auto mb-3" />
            <h3 className="font-semibold text-lg">AI Intelligence</h3>
            <p className="text-gray-600 text-sm">Smart failure analysis and retry decisions</p>
          </div>
          <div className="card text-center">
            <FaRocket className="text-4xl text-primary-500 mx-auto mb-3" />
            <h3 className="font-semibold text-lg">Auto Recovery</h3>
            <p className="text-gray-600 text-sm">Automatic retry with intelligent scheduling</p>
          </div>
          <div className="card text-center">
            <FaShieldAlt className="text-4xl text-primary-500 mx-auto mb-3" />
            <h3 className="font-semibold text-lg">Secure</h3>
            <p className="text-gray-600 text-sm">Safe and reliable payment processing</p>
          </div>
          <div className="card text-center">
            <FaClock className="text-4xl text-primary-500 mx-auto mb-3" />
            <h3 className="font-semibold text-lg">Real-time</h3>
            <p className="text-gray-600 text-sm">Live status updates and monitoring</p>
          </div>
        </div>

        {/* Payment Form */}
        <div className="max-w-md mx-auto">
          <div className="card">
            <h2 className="text-2xl font-bold text-center mb-6">Start Payment</h2>
            <PaymentForm onSubmit={handlePaymentSubmit} loading={loading} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© 2024 AI Revenue Recovery. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;