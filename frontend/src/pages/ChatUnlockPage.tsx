import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Check } from 'lucide-react';
import { paymentAPI } from '../services/api';

export default function ChatUnlockPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentInitialized, setPaymentInitialized] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    accountNumber: '',
    bankName: 'Wema Bank',
    accountName: 'Dating App Ltd',
    amount: 1000,
    reference: ''
  });

  const initializePayment = async () => {
    try {
      setIsLoading(true);
      // Default to daily plan with 1000 amount for backward compatibility
      const response = await paymentAPI.initializeChatPayment(1000, 'daily');
      setPaymentDetails(prev => ({
        ...prev,
        reference: response.reference
      }));
      setPaymentInitialized(true);
      
      // Start polling for payment verification
      startPaymentVerification(response.reference);
    } catch (error) {
      console.error('Error initializing payment:', error);
      alert('Failed to initialize payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startPaymentVerification = (reference: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await paymentAPI.verifyPayment(reference);
        if (response.verified) {
          clearInterval(interval);
          // Redirect to chat after successful payment
          navigate('/chat');
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
      }
    }, 5000); // Check every 5 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // You might want to show a toast notification here
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 p-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-purple-600 hover:text-purple-800 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-1" /> Back
        </button>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-purple-600 p-6 text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <Lock className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center">Unlock Chat Access</h1>
            <p className="text-center text-purple-100 mt-2">
              One-time payment to access all chat features
            </p>
          </div>

          {!paymentInitialized ? (
            <div className="p-6">
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">What You'll Get</h2>
                <ul className="space-y-3">
                  {[
                    'Unlimited messaging with all your matches',
                    'Read receipts and typing indicators',
                    'Photo and file sharing',
                    'Priority customer support'
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">One-time payment</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-700">₦1,000</div>
                    <div className="text-sm text-gray-500">One-time fee</div>
                  </div>
                </div>
              </div>

              <button
                onClick={initializePayment}
                disabled={isLoading}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-white ${
                  isLoading ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'
                } transition-colors`}
              >
                {isLoading ? 'Processing...' : 'Unlock Chat Access'}
              </button>

              <p className="text-sm text-gray-500 mt-4 text-center">
                Secure payment processed by our payment partner
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-green-800 mb-2">Payment Instructions</h3>
                <p className="text-sm text-green-700 mb-4">
                  Please make a transfer to the account below and your chat access will be activated automatically.
                </p>
                
                <div className="space-y-3">
                  {[
                    { label: 'Bank Name', value: paymentDetails.bankName },
                    { label: 'Account Number', value: paymentDetails.accountNumber || 'Loading...' },
                    { label: 'Account Name', value: paymentDetails.accountName },
                    { label: 'Amount', value: `₦${paymentDetails.amount.toLocaleString()}` },
                    { label: 'Reference', value: paymentDetails.reference || 'Loading...' }
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{item.label}</span>
                      <div className="flex items-center">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                          {item.value}
                        </span>
                        <button 
                          onClick={() => handleCopy(item.value)}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                          title="Copy to clipboard"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                <p className="font-medium mb-1">Important:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Please use the reference number as the transfer description</li>
                  <li>Your chat access will be activated within 2 minutes of payment</li>
                  <li>Contact support if you encounter any issues</li>
                </ul>
              </div>

              <button
                onClick={() => navigate('/chat')}
                className="w-full mt-6 py-3 px-6 bg-white border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium"
              >
                I've made the payment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
