import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { paymentAPI } from '../services/api';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();

  const reference =
    searchParams.get('reference') || searchParams.get('trxref');

  const redirectUrl =
    searchParams.get('redirect'); // e.g. myapp://payment-success

  useEffect(() => {
    const verify = async () => {
      if (!reference) {
        toast.error('Invalid payment reference');
        redirect();
        return;
      }

      try {
        await paymentAPI.verifyPayment({ reference });
        toast.info('Payment received. Activating access…');
      } catch (err) {
        console.error(err);
        toast.warning(
          'Payment received. Access will be activated shortly.'
        );
      } finally {
        redirect(1500);
      }
    };

    verify();
  }, [reference]);

  const redirect = (delay = 0) => {
    setTimeout(() => {
      try {
        if (redirectUrl) {
          // Mobile deep link
          window.location.href = redirectUrl;
        } else {
          // Web fallback - ensure proper URL formatting
          const baseUrl = window.location.origin;
          const redirectPath = '/chats'.replace(/^\/+/, ''); // Remove any leading slashes
          const targetUrl = new URL(redirectPath, baseUrl).toString();
          
          console.log('Redirecting to:', targetUrl);
          window.location.href = targetUrl;
        }
      } catch (error) {
        console.error('Redirect error:', error);
        // Fallback to root if there's an error with URL construction
        window.location.href = '/';
      }
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
          Please wait while we complete your subscription.
        </p>
      </div>
    </div>
  );
};

export default PaymentCallback;
