import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, X } from 'react-icons/fi';

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
  const navigate = useNavigate();

  const plans: Plan[] = [
    {
      name: 'Free',
      price: '₦0',
      description: 'Basic features to get started',
      features: [
        '✓ Match with other users',
        '✓ Swipe through profiles',
        '✓ Basic profile viewing',
        '✗ No chat access',
        '✗ Limited daily likes'
      ],
      buttonText: 'Continue Free',
      buttonVariant: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    },
    {
      name: 'Daily Chat',
      price: '₦300',
      description: '24-hour chat access',
      features: [
        '✓ All Free features',
        '✓ Unlimited chat for 24 hours',
        '✓ See who liked you',
        '✓ Read receipts',
        '✗ No long-term commitment'
      ],
      popular: true,
      buttonText: 'Get Daily Chat',
      buttonVariant: 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700',
    },
    {
      name: 'Monthly Chat',
      price: '₦3,000',
      description: '30-day chat access',
      features: [
        '✓ All Daily Chat features',
        '✓ 30 days of unlimited chat',
        '✓ Save 67% vs daily rate',
        '✓ Priority support',
        '✓ Cancel anytime'
      ],
      buttonText: 'Get Monthly Chat',
      buttonVariant: 'bg-purple-600 hover:bg-purple-700',
    },
  ];

  const handleSubscribe = (plan: string) => {
    // Handle subscription logic here
    console.log(`Subscribed to ${plan} plan`);
    // navigate('/payment/chat'); // Uncomment and modify this line to handle navigation
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Choose Your Plan
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-xl text-gray-500">
            Start free or unlock full chat access
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
              } rounded-2xl shadow-sm flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-semibold py-1 px-3 rounded-full">
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
                  className={`w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${plan.buttonVariant} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
                >
                  {plan.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Need help choosing?</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Contact our support team and we'll help you find the right plan for your needs.</p>
            </div>
            <div className="mt-5">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
