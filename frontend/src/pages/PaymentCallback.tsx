import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { paymentAPI } from '../services/api';

const PaymentCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference) {
        toast.error('No reference found in URL');
        navigate('/chats');
        return;
      }

      try {
        console.log('Verifying payment with reference:', reference);
        const response = await paymentAPI.verifyPayment(reference);
        console.log('Payment verification response:', response);
        
        if (response.success) {
          toast.success('Payment successful! You now have chat access.');
        } else {
          toast.error(response.error || 'Payment verification is still in progress. You can still access chat.');
        }
        // Always redirect to chats after verification attempt
        navigate('/chats');
      } catch (error) {
        console.error('Error verifying payment:', error);
        toast.error('An error occurred while verifying your payment. You can still access chat.');
        navigate('/chats');
      }
    };

    verifyPayment();
  }, [reference, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800">Verifying your payment...</h2>
        <p className="text-gray-600 mt-2">Please wait while we confirm your payment.</p>
      </div>
    </div>
  );
};

export default PaymentCallback;
