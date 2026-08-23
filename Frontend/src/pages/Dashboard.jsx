import { useParams, useNavigate } from 'react-router-dom';
import { usePayment } from '../hooks/usePayment';
import QRCodeDisplay from '../components/QRCodeDisplay';
import StatusBadge from '../components/StatusBadge';
import { 
  FaArrowLeft, 
  FaSync, 
  FaClock, 
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaBrain,
  FaInfoCircle
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    payment,
    aiRecommendation,
    loading,
    timeRemaining,
    processPayment,
    retryPayment,
    scheduleRetry,
    abortPayment,
    fetchPayment,
  } = usePayment(id);

  // Format time
  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  // Handle retry action
  const handleRetry = async () => {
    if (payment?.status === 'WAITING_FOR_RETRY') {
      await scheduleRetry();
    } else {
      await retryPayment();
    }
  };

  // Handle abort
  const handleAbort = async () => {
    if (window.confirm('Are you sure you want to abort this payment?')) {
      await abortPayment();
      toast.success('Payment aborted');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="text-6xl text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700">Payment Not Found</h2>
          <p className="text-gray-500 mt-2">The payment you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 btn-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isSuccess = payment.status === 'SUCCESS';
  const isFailed = payment.status === 'FAILED';
  const isPending = payment.status === 'PENDING';
  const isExpired = payment.status === 'EXPIRED';
  const isAborted = payment.status === 'ABORTED';
  const isWaitingRetry = payment.status === 'WAITING_FOR_RETRY';
  const canRetry = payment.canRetry && !isAborted;
  const showRetryOption = isFailed || isWaitingRetry;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <FaArrowLeft className="mr-2" /> Back to Home
      </button>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column - QR Code & Basic Info */}
        <div className="md:col-span-1">
          <div className="card">
            <QRCodeDisplay qrCode={payment.qrCode} amount={payment.amount} />
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">Payment ID</p>
              <p className="text-xs font-mono bg-gray-100 p-2 rounded truncate">
                {payment.id}
              </p>
            </div>

            <div className="mt-4 flex justify-center">
              <StatusBadge status={payment.status} />
            </div>

            {isPending && (
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center text-yellow-600">
                  <FaClock className="mr-2" />
                  <span>Time remaining: <strong>{formatTime(timeRemaining)}</strong></span>
                </div>
              </div>
            )}

            {isWaitingRetry && payment.nextRetryAt && (
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center text-blue-600">
                  <FaHourglassHalf className="mr-2" />
                  <span>Retry at: <strong>{formatDate(payment.nextRetryAt)}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="card mt-4">
            {isPending && (
              <button
                onClick={processPayment}
                className="w-full btn-primary mb-2"
              >
                Simulate Payment
              </button>
            )}

            {showRetryOption && canRetry && (
              <button
                onClick={handleRetry}
                className="w-full btn-success mb-2 flex items-center justify-center"
              >
                <FaSync className="mr-2" /> 
                {isWaitingRetry ? 'Retry Now' : 'Retry Payment'}
              </button>
            )}

            {isWaitingRetry && canRetry && (
              <button
                onClick={scheduleRetry}
                className="w-full btn-primary mb-2 flex items-center justify-center"
              >
                <FaClock className="mr-2" /> Schedule Retry (15min)
              </button>
            )}

            {!isSuccess && !isAborted && (
              <button
                onClick={handleAbort}
                className="w-full btn-danger flex items-center justify-center"
              >
                <FaTimesCircle className="mr-2" /> Abort Payment
              </button>
            )}

            {!isSuccess && !isAborted && (
              <button
                onClick={fetchPayment}
                className="w-full btn-secondary mt-2 flex items-center justify-center"
              >
                <FaSync className="mr-2" /> Refresh Status
              </button>
            )}
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="md:col-span-2">
          {/* Payment Details */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="text-2xl font-bold text-primary-600">
                  ₹{payment.amount}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-semibold">
                  <StatusBadge status={payment.status} compact />
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-sm">{payment.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="text-sm">{formatDate(payment.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Retry Count</p>
                <p className="text-sm">{payment.retryCount} / {payment.maxRetries}</p>
              </div>
              {payment.failureReason && (
                <div>
                  <p className="text-sm text-gray-500">Failure Reason</p>
                  <p className="text-sm text-red-600">{payment.failureReason}</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Recommendation */}
          {aiRecommendation && (
            <div className="card mt-4 border-blue-200 bg-blue-50">
              <div className="flex items-start">
                <FaBrain className="text-2xl text-primary-500 mr-3 mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">AI Recommendation</h4>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="text-xs text-gray-500">Classification</p>
                      <p className="text-sm font-medium">{aiRecommendation.classification}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Confidence</p>
                      <p className="text-sm font-medium">{aiRecommendation.confidence}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Action</p>
                      <p className="text-sm font-medium">{aiRecommendation.suggestedAction}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Reason</p>
                      <p className="text-sm">{aiRecommendation.reason}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Failure History */}
          {payment.failureHistory && payment.failureHistory.length > 0 && (
            <div className="card mt-4">
              <h4 className="font-semibold text-gray-800 mb-3">Attempt History</h4>
              <div className="space-y-2">
                {payment.failureHistory.map((attempt, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">#{attempt.attempt}</span>
                      <span className="text-sm text-red-600">{attempt.reason}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(attempt.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Messages */}
          {isSuccess && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <FaCheckCircle className="text-green-500 mr-3 text-xl" />
              <div>
                <p className="font-semibold text-green-700">Payment Successful!</p>
                <p className="text-sm text-green-600">Completed at {formatDate(payment.completedAt)}</p>
              </div>
            </div>
          )}

          {isFailed && !isWaitingRetry && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <FaTimesCircle className="text-red-500 mr-3 text-xl" />
              <div>
                <p className="font-semibold text-red-700">Payment Failed</p>
                <p className="text-sm text-red-600">Reason: {payment.failureReason || 'Unknown'}</p>
                {payment.retryCount >= payment.maxRetries && (
                  <p className="text-sm text-yellow-600 mt-1">
                    Max retries reached. Schedule a delayed retry.
                  </p>
                )}
              </div>
            </div>
          )}

          {isAborted && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center">
              <FaInfoCircle className="text-gray-500 mr-3 text-xl" />
              <div>
                <p className="font-semibold text-gray-700">Payment Aborted</p>
                <p className="text-sm text-gray-600">This payment was cancelled by the customer.</p>
              </div>
            </div>
          )}

          {isExpired && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center">
              <FaClock className="text-yellow-500 mr-3 text-xl" />
              <div>
                <p className="font-semibold text-yellow-700">Payment Expired</p>
                <p className="text-sm text-yellow-600">The payment window has expired.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;