import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { paymentAPI } from '../services/api';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reference =
    searchParams.get('reference') || searchParams.get('trxref');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference) {
        toast.error('Invalid payment reference');
        redirectToChats();
        return;
      }

      try {
        console.log('🔍 Verifying payment:', reference);

        // 1. Verify payment with backend
        const verification = await paymentAPI.verifyPayment(reference);
        console.log('✅ Payment verification response:', verification);

        if (!verification?.success) {
          toast.info(
            verification?.error ||
              'Payment is still processing. You can continue chatting.'
          );
          redirectToChats();
          return;
        }

        // 2. Mark chat access locally
        localStorage.setItem('hasChatAccess', 'true');
        localStorage.removeItem('chatAccessChecked');

        toast.success('Payment successful! Redirecting to your chats…');

        // 3. Redirect (SPA navigation — no hard reload)
        redirectToChats(800);
      } catch (error) {
        console.error('❌ Payment verification error:', error);
        toast.error(
          'Something went wrong while verifying your payment. Redirecting…'
        );
        redirectToChats();
      }
    };

    verifyPayment();
  }, [reference]);

  const redirectToChats = (delay = 0) => {
    setTimeout(() => {
      navigate('/chats', { replace: true });
    }, delay);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800">
          Verifying your payment…
        </h2>
        <p className="text-gray-600 mt-2">
          Please wait while we confirm your payment.
        </p>
      </div>
    </div>
  );
};

export default PaymentCallback;
