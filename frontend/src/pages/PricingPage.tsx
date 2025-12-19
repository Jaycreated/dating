import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck} from 'react-icons/fi';
import { paymentAPI } from '../services/api';

type Plan = {
  name: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  popular?: boolean;
  buttonVariant: string;
};

const PricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  const plans: Plan[] = [
    {
      name: 'Free',
      price: '₦0',
      description: 'You can enjoy Swiping and match with other users',
      features: [
        'Match',
        'Swipe',
      ],
      buttonText: 'Continue Free',
      buttonVariant: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    },
    {
      name: 'Monthly Chat',
      price: '₦3000',
      description: '30-day chat access',
      features: [
        'Unlock chats for a month',
        'Match',
        'Swipe',
      ],
      popular: true,
      buttonText: 'Get Monthly Chat',
      buttonVariant: 'bg-[#651B55] rounded-lg',
    },
    {
      name: 'Daily Chat',
      price: '₦300',
      description: 'Daily chat access',
      features: [
       'Unlock chats for a day',
        'Match',
        'Swipe',
      ],
      buttonText: 'Get Daily Chat',
      buttonVariant: 'bg-[#651B55]',
    },
  ];

  const handleSubscribe = async (planName: string) => {
    try {
      setIsLoading(planName);
      // Determine the plan type and amount based on the plan name
      const planType = planName.toLowerCase().includes('daily') ? 'daily' : 'monthly';
      const amount = planType === 'daily' ? 300 : 3000;
      
      // Initialize payment
      const response = await paymentAPI.initializeChatPayment(amount, planType);
      
      if (response.success && response.data?.payment_url) {
        // Store the reference in localStorage for verification after redirect
        if (response.data.reference) {
          localStorage.setItem('payment_reference', response.data.reference);
        }
        // Redirect to payment page
        window.location.href = response.data.payment_url;
      } else {
        throw new Error(response.error || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Error initializing payment:', error);
      // You might want to show an error toast or message to the user
      alert('Failed to initialize payment. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Get Pairfect Premium
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-xl text-gray-500">
            Go Premium Now , your mactch shouldn't wait
          </p>
          
          {/* Billing Toggle */}
          {/* <div className="mt-8 flex items-center justify-center">
            <span className="text-gray-700 font-medium mr-3">Monthly</span>
            <button
              type="button"
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${billingCycle === 'monthly' ? 'bg-gray-200' : 'bg-purple-600'}`}
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            >
              <span className="sr-only">Toggle billing</span>
              <span
                className={`${billingCycle === 'monthly' ? 'translate-x-1 bg-white' : 'translate-x-6 bg-white'} inline-block w-4 h-4 transform rounded-full transition-transform`}
              />
            </button>
            <span className="ml-3 text-gray-700 font-medium">
              Yearly <span className="text-purple-600">(Save 20%)</span>
            </span>
          </div> */}
        </div>

        <div className="mt-12 space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-8 bg-white border-2 ${
                plan.popular ? 'border-purple-500' : 'border-gray-200'
              } rounded-2xl shadow-sm flex flex-col cursor-pointer hover:shadow-md transition-shadow`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#651B55] text-white text-xs font-semibold py-1 px-3 rounded-full cursor-pointer">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                <p className="mt-4 flex items-baseline text-gray-900">
                  <span className="text-5xl font-extrabold tracking-tight">
                    {plan.price}
                  </span>
                  <span className="ml-1 text-xl font-semibold">
                    {billingCycle === 'monthly' ? '/month' : '/year'}
                  </span>
                </p>
                <p className="mt-2 text-gray-500">{plan.description}</p>
                
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex">
                      <FiCheck className="flex-shrink-0 w-6 h-6 text-green-500" />
                      <span className="ml-3 text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => handleSubscribe(plan.name)}
                  className={`w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${plan.buttonVariant} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 cursor-pointer disabled:opacity-70 disabled:cursor-wait`}
                  disabled={isLoading === plan.name}
                >
                  {isLoading === plan.name ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    plan.buttonText
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
