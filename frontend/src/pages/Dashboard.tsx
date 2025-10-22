import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, User, MessageCircle, LogOut, Bell } from 'lucide-react';
import { notificationAPI } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Load unread notification count
    loadUnreadCount();
  }, [navigate]);

  const loadUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.count || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />
            <span className="text-2xl font-bold text-gray-900">Pairfect</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/notifications')}
              className="p-2 hover:bg-gray-100 rounded-full transition relative"
            >
              <Bell className="w-6 h-6 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate('/chats')}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <MessageCircle className="w-6 h-6 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition">
              <User className="w-6 h-6 text-gray-600" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-full transition"
              title="Logout"
            >
              <LogOut className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full mx-auto flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {user.name}! 🎉
          </h1>
          <p className="text-gray-600 mb-8">
            Your profile is complete and you're ready to start matching!
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <button
              onClick={() => navigate('/swipe')}
              className="p-6 bg-pink-50 rounded-xl hover:bg-pink-100 transition-colors text-center"
            >
              <Heart className="w-8 h-8 text-pink-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Start Matching</h3>
              <p className="text-sm text-gray-600">
                Discover people who share your interests
              </p>
            </button>

            <button
              onClick={() => navigate('/matches')}
              className="p-6 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors text-center"
            >
              <MessageCircle className="w-8 h-8 text-purple-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Your Matches</h3>
              <p className="text-sm text-gray-600">
                Connect with your matches
              </p>
            </button>

            <button
              onClick={() => alert('Profile editing coming soon!')}
              className="p-6 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-center"
            >
              <User className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Profile</h3>
              <p className="text-sm text-gray-600">
                Update your information anytime
              </p>
            </button>
          </div>

          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              ✅ Your account is fully set up!
            </p>
            <p className="text-sm text-green-600 mt-1">
              Email: {user.email}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
