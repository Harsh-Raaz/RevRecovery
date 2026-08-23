import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaClock, 
  FaSpinner,
  FaHourglassHalf,
  FaBan,
  FaExclamationCircle
} from 'react-icons/fa';

const StatusBadge = ({ status, compact = false }) => {
  const statusConfig = {
    PENDING: {
      icon: FaClock,
      color: 'bg-yellow-100 text-yellow-800',
      label: 'Pending',
      dotColor: 'bg-yellow-500'
    },
    PROCESSING: {
      icon: FaSpinner,
      color: 'bg-blue-100 text-blue-800',
      label: 'Processing',
      dotColor: 'bg-blue-500 animate-pulse'
    },
    SUCCESS: {
      icon: FaCheckCircle,
      color: 'bg-green-100 text-green-800',
      label: 'Success',
      dotColor: 'bg-green-500'
    },
    FAILED: {
      icon: FaTimesCircle,
      color: 'bg-red-100 text-red-800',
      label: 'Failed',
      dotColor: 'bg-red-500'
    },
    RETRYING: {
      icon: FaSpinner,
      color: 'bg-purple-100 text-purple-800',
      label: 'Retrying',
      dotColor: 'bg-purple-500 animate-pulse'
    },
    WAITING_FOR_RETRY: {
      icon: FaHourglassHalf,
      color: 'bg-indigo-100 text-indigo-800',
      label: 'Waiting for Retry',
      dotColor: 'bg-indigo-500'
    },
    ABORTED: {
      icon: FaBan,
      color: 'bg-gray-100 text-gray-800',
      label: 'Aborted',
      dotColor: 'bg-gray-500'
    },
    EXPIRED: {
      icon: FaExclamationCircle,
      color: 'bg-orange-100 text-orange-800',
      label: 'Expired',
      dotColor: 'bg-orange-500'
    }
  };

  const config = statusConfig[status] || statusConfig.PENDING;
  const Icon = config.icon;

  if (compact) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="mr-1" size={12} />
        {config.label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      <span className={`w-2 h-2 rounded-full mr-2 ${config.dotColor}`}></span>
      <Icon className="mr-1.5" size={14} />
      {config.label}
    </span>
  );
};

export default StatusBadge;