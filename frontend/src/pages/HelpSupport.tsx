import { ArrowLeft, MessageSquare, User, Heart, Settings, Bell, Search, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HelpSupport = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 mr-4 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Getting Started</h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">1. Create Your Profile</h3>
                  <p className="text-gray-600">
                    Complete your profile with photos and details about yourself to help others get to know you better.
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-2">2. Discover Matches</h3>
                  <p className="text-gray-600">
                    Swipe right to like or left to pass on potential matches. When two people like each other, it's a match!
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Features</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center mb-2">
                    <User className="w-5 h-5 mr-2 text-purple-600" />
                    <h3 className="font-medium">Profile</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Customize your profile and control what information is visible to others.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center mb-2">
                    <Search className="w-5 h-5 mr-2 text-blue-600" />
                    <h3 className="font-medium">Discover</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Browse through potential matches and make connections.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center mb-2">
                    <MessageSquare className="w-5 h-5 mr-2 text-green-600" />
                    <h3 className="font-medium">Messages</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Chat with your matches and get to know each other better.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center mb-2">
                    <Settings className="w-5 h-5 mr-2 text-gray-600" />
                    <h3 className="font-medium">Settings</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Update your preferences, change password, and manage notifications.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Tips for Success</h2>
              <ul className="space-y-3 list-disc pl-5 text-gray-700">
                <li>Use high-quality photos that show your face clearly</li>
                <li>Write a bio that reflects your personality</li>
                <li>Be yourself and have fun meeting new people</li>
                <li>Stay safe by meeting in public places for the first time</li>
                <li>Report any suspicious behavior to our support team</li>
              </ul>
            </section>

            <section className="bg-yellow-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2 text-yellow-800">Need Help?</h2>
              <p className="text-yellow-700 mb-4">
                If you have any questions or need assistance, please contact our support team.
              </p>
              <button 
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                onClick={() => window.location.href = 'mailto:support@datingapp.com'}
              >
                Contact Support
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
