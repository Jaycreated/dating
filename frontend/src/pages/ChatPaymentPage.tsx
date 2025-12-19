import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { paymentAPI } from '../services/api';

type SubscriptionPlan = 'daily' | 'monthly';

const ChatPaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('daily');

  // Check for payment reference in URL or localStorage (callback from Paystack)
  useEffect(() => {
    const urlReference = searchParams.get('reference') || searchParams.get('trxref');
    const storedReference = localStorage.getItem('payment_reference');
    
    if (urlReference) {
      // Clear the stored reference if we have one in the URL
      if (storedReference) {
        localStorage.removeItem('payment_reference');
      }
      verifyPayment(urlReference);
    } else if (storedReference) {
      // If no URL reference but we have a stored one, check if payment is complete
      verifyPayment(storedReference);
    }
  }, [searchParams]);

  // Initialize payment and redirect to Paystack
  const initializePayment = async () => {
    try {
      setLoading(true);
      const amount = selectedPlan === 'daily' ? 300 : 3000;
      const response = await paymentAPI.initializeChatPayment(amount, selectedPlan);
      
      if (response.success && response.data?.payment_url) {
        // Store the reference in localStorage for verification after redirect
        if (response.data.reference) {
          localStorage.setItem('payment_reference', response.data.reference);
        }
        // Redirect to Paystack payment page
        window.location.href = response.data.payment_url;
      } else {
        throw new Error(response.error || 'Failed to initialize payment');
      }
    } catch (error: any) {
      console.error('Error initializing payment:', error);
      toast.error(error.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (reference: string) => {
    try {
      setVerifying(true);
      // Get user email from localStorage or auth context
      const userEmail = localStorage.getItem('userEmail') || '';
      const response = await paymentAPI.verifyPayment({
        reference,
        email: userEmail
      });
      
      if (response.success && response.data?.status === 'success') {
        // Check if payment was successful and grant access
        const accessResponse = await paymentAPI.checkChatAccess();
        if (accessResponse.hasAccess) {
          setHasAccess(true);
          toast.success('Payment verified successfully! You now have access to chat.');
          navigate('/chat');
        } else {
          throw new Error('Failed to verify chat access after payment');
        }
      } else {
        toast.info('Payment not yet completed. Please try again.');
      }
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      toast.error(error.message || 'Failed to verify payment');
    } finally {
      setVerifying(false);
    }
  };

  // Check if user already has chat access on component mount
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await paymentAPI.checkChatAccess();
        if (response.hasAccess) {
          setHasAccess(true);
          navigate('/chat');
        }
      } catch (error) {
        console.error('Error checking chat access:', error);
      }
    };

    checkAccess();
  }, [navigate]);

  // If already has access, redirect to chat
  if (hasAccess) {
    return null; // Will be redirected by the effect
  }

  return (
    <div className="max-w-2xl mx-auto my-8 p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Unlock Chat Access</h1>
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Choose Your Plan</h2>
        
        <div className="grid grid-cols-1 gap-4 mb-6">
          <button
            type="button"
            onClick={() => setSelectedPlan('daily')}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              selectedPlan === 'daily' 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 hover:border-purple-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">Daily Access</span>
              <span className="text-lg font-bold">₦300</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">24 hours of unlimited chat</p>
          </button>
          
          <button
            type="button"
            onClick={() => setSelectedPlan('monthly')}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              selectedPlan === 'monthly'
                ? 'border-pink-500 bg-pink-50'
                : 'border-gray-200 hover:border-pink-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="font-medium">Monthly Access</span>
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                  Save 67%
                </span>
              </div>
              <span className="text-lg font-bold">₦3,000</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">30 days of unlimited chat</p>
          </button>
        </div>
        
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <p className="text-blue-700">
            <span className="font-medium">Best Value:</span> The monthly plan saves you ₦6,000 compared to daily payments!
          </p>
        </div>
        
        <button
          onClick={initializePayment}
          disabled={loading || verifying}
          className={`w-full py-3 px-4 rounded-md text-white font-medium ${
            (loading || verifying) 
              ? 'bg-blue-400' 
              : selectedPlan === 'daily' 
                ? 'bg-purple-600 hover:bg-purple-700' 
                : 'bg-pink-600 hover:bg-pink-700'
          } transition-colors`}
        >
          {verifying 
            ? 'Verifying...' 
            : loading 
              ? 'Processing...' 
              : 'Unlock Chat'}
        </button>
        
        {verifying ? (
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <p className="text-blue-700 text-center">Verifying your payment, please wait...</p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500 text-center">
            You'll be redirected to Paystack to complete your payment securely
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatPaymentPage;
