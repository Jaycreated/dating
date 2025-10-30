import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Lock, User, HelpCircle } from 'lucide-react';
import { userAPI } from '../services/api';
import { ChangePasswordForm } from '../components/forms/ChangePasswordForm';

const Settings = () => {
  const navigate = useNavigate();
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleLogout = async () => {
    try {
      await userAPI.logout();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
          
          <div className="space-y-2">
            <button
              onClick={() => navigate('/profile')}
              className="w-full flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors text-left"
            >
              <User className="w-5 h-5 mr-3 text-gray-600" />
              <span>Edit Profile</span>
            </button>
            
            <button
              onClick={() => setShowChangePassword(true)}
              className="w-full flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors text-left"
            >
              <Lock className="w-5 h-5 mr-3 text-gray-600" />
              <span>Change Password</span>
            </button>
            
            <button
              onClick={() => navigate('/support')}
              className="w-full flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors text-left"
            >
              <HelpCircle className="w-5 h-5 mr-3 text-gray-600" />
              <span>Help & Support</span>
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center p-4 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-4"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Change Password</h2>
              <button
                onClick={() => setShowChangePassword(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ChangePasswordForm 
              onSuccess={() => setShowChangePassword(false)}
              onCancel={() => setShowChangePassword(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
