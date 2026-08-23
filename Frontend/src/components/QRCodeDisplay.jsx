import { FaDownload } from 'react-icons/fa';

const QRCodeDisplay = ({ qrCode, amount }) => {
  const downloadQR = () => {
    if (!qrCode) return;
    
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `payment-qr-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!qrCode) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No QR Code available</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="bg-white p-4 rounded-lg inline-block">
        <img
          src={qrCode}
          alt="Payment QR Code"
          className="w-48 h-48 mx-auto"
        />
      </div>
      
      {amount && (
        <p className="mt-2 text-sm text-gray-600">
          Amount: <span className="font-bold text-primary-600">₹{amount}</span>
        </p>
      )}

      <button
        onClick={downloadQR}
        className="mt-3 text-sm text-primary-600 hover:text-primary-700 flex items-center justify-center mx-auto"
      >
        <FaDownload className="mr-1" /> Download QR
      </button>

      <p className="mt-2 text-xs text-gray-500">
        Scan this QR code with any UPI app to pay
      </p>
    </div>
  );
};

export default QRCodeDisplay;