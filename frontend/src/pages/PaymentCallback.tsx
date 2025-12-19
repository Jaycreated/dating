import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { paymentAPI, authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();

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
              'Payment verification is still processing. You can continue chatting.'
          );
          redirectToChats();
          return;
        }

        // 2. Refresh user session and update chat access
        try {
          const user = await authAPI.getMe();
          if (user) {
            // Update user in context
            setUser(user);
            
            // Force refresh chat access status
            try {
              const accessResponse = await paymentAPI.checkChatAccess();
              const hasAccess = accessResponse.hasAccess;
              // Update localStorage
              localStorage.setItem('hasChatAccess', hasAccess ? 'true' : 'false');
              
              // Force a hard refresh to ensure all components re-render with the new access state
              toast.success('Payment successful! Updating your chat access...');
              // Clear any cached data that might affect the chat access state
              localStorage.removeItem('chatAccessChecked');
              // Force a full page reload to reset all component states
              window.location.href = '/chats';
              return;
            } catch (e) {
              console.error('Error refreshing chat access:', e);
              // Still redirect even if this fails
              localStorage.removeItem('chatAccessChecked');
              toast.success('Payment successful! Loading your chats...');
              window.location.href = '/chats';
              return;
            }
          } else {
            throw new Error('User fetch failed');
          }
        } catch (authError) {
          console.error('❌ Session refresh failed:', authError);
          localStorage.removeItem('chatAccessChecked');
          toast.warning('Payment verified. Refreshing your session...');
          window.location.href = '/chats';
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

  const redirectToChats = (delay = 0) => {
    setTimeout(() => {
      window.location.replace('/chats');
    }, delay);
  };

  const redirectToLogin = () => {
    window.location.replace('/login?returnTo=/chats');
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
