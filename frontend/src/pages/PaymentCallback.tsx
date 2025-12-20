import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { paymentAPI, authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const { user, setUser } = useAuth();

  const reference = searchParams.get('reference') || searchParams.get('trxref');
  // Get email from URL params or use the one from auth context
  const email = searchParams.get('email') || user?.email;

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
        // Include email in case session is lost
        const verification = await paymentAPI.verifyPayment({
          reference,
          email
        });
        console.log('✅ Payment verification response:', verification);

        if (!verification?.success) {
          toast.info(
            verification?.error ||
              'Payment verification is still processing. You can continue chatting.'
          );
          redirectToChats();
          return;
        }

        // 2. Refresh user session and update chat access
        try {
          // If there's no token in localStorage, avoid calling getMe() because the
          // axios interceptor will auto-redirect on 401 (causing a logout). In
          // that case, just check chat access and redirect.
          const token = localStorage.getItem('token');
          if (!token) {
            try {
              const accessResponse = await paymentAPI.checkChatAccess();
              const hasAccess = accessResponse.hasAccess;
              localStorage.setItem('hasChatAccess', hasAccess ? 'true' : 'false');
              localStorage.removeItem('chatAccessChecked');
              toast.success('Payment successful! Loading your chats...');
              redirectToChats();
              return;
            } catch (e) {
              console.error('Error checking chat access without token:', e);
              localStorage.removeItem('chatAccessChecked');
              toast.success('Payment successful! Loading your chats...');
              redirectToChats();
              return;
            }
          }

          const user = await authAPI.getMe();
          if (user) {
            setUser(user);
            try {
              const accessResponse = await paymentAPI.checkChatAccess();
              const hasAccess = accessResponse.hasAccess;
              localStorage.setItem('hasChatAccess', hasAccess ? 'true' : 'false');
              localStorage.removeItem('chatAccessChecked');
              toast.success('Payment successful! Updating your chat access...');
              redirectToChats();
              return;
            } catch (e) {
              console.error('Error refreshing chat access:', e);
              localStorage.removeItem('chatAccessChecked');
              toast.success('Payment successful! Loading your chats...');
              redirectToChats();
              return;
            }
          } else {
            throw new Error('User fetch failed');
          }
        } catch (authError) {
          console.error('❌ Session refresh failed:', authError);
          localStorage.removeItem('chatAccessChecked');
          toast.warning('Payment verified. Refreshing your session...');
          redirectToChats();
          return;
        }
      } catch (error) {
        console.error('❌ Payment verification error:', error);
        toast.error(
          'Something went wrong while verifying your payment. You can still access chats.'
        );
        redirectToChats();
      }
    };

    verifyPayment();
  }, [reference]);

  const getBaseUrl = () => {
    // In production, use VITE_APP_URL from environment variables
    // In development, use the current origin (http://localhost:3000)
    const envUrl = import.meta.env.VITE_APP_URL;
    
    // If VITE_APP_URL is set and we're in production, use it
    if (import.meta.env.PROD && envUrl) {
      // Ensure the URL doesn't end with a slash
      return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
    }
    
    // Fall back to current origin for development
    return window.location.origin;
  };

  const redirectToChats = (delay = 0) => {
    setTimeout(() => {
      const baseUrl = getBaseUrl();
      const targetUrl = `${baseUrl}/chats`;
      console.log('Redirecting to:', targetUrl);
      window.location.replace(targetUrl);
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
