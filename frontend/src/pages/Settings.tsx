import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Lock, User, HelpCircle, CreditCard, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { userAPI, paymentAPI } from '../services/api';
import { ChangePasswordForm } from '../components/forms/ChangePasswordForm';

const Settings = () => {
  const navigate = useNavigate();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{hasAccess: boolean, plan?: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const response = await paymentAPI.checkChatAccess();
        setSubscriptionStatus({
          hasAccess: response.hasAccess,
          plan: response.planType || 'Free'
        });
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkSubscription();
  }, []);

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

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await userAPI.deleteAccount();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } catch (err) {
      console.error('Delete account error:', err);
      alert('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-['Poppins']">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 font-['Poppins']">Settings</h1>
          
          <div className="space-y-2">
            <button
              onClick={() => navigate('/profile')}
              className="w-full flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors text-left font-['Poppins']"
            >
              <User className="w-5 h-5 mr-3 text-gray-600" />
              <span>Edit Profile</span>
            </button>
            
            <button
              onClick={() => setShowChangePassword(true)}
              className="w-full flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors text-left font-['Poppins']"
            >
              <Lock className="w-5 h-5 mr-3 text-gray-600" />
              <span>Change Password</span>
            </button>
            
            <button
              onClick={() => navigate('/support')}
              className="w-full flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors text-left font-['Poppins']"
            >
              <HelpCircle className="w-5 h-5 mr-3 text-gray-600" />
              <span>Help & Support</span>
            </button>
            
            <button
              onClick={() => navigate('/pricing')}
              className="w-full flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <CreditCard className="w-5 h-5 mr-3 text-gray-600" />
              <div>
                <div>Subscription</div>
                <div className="text-sm text-gray-500">
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      Loading...
                    </div>
                  ) : subscriptionStatus ? (
                    `Current Plan: ${subscriptionStatus.plan}${subscriptionStatus.hasAccess ? ' (Active)' : ' (Inactive)'}`
                  ) : 'Unable to load subscription'}
                </div>
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center p-4 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-4 font-['Poppins']"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span>Logout</span>
            </button>

            <button
              onClick={() => setShowDeleteAccount(true)}
              className="w-full flex items-center p-4 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-['Poppins']"
            >
              <Trash2 className="w-5 h-5 mr-3" />
              <span>Delete Account</span>
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

      {/* Delete Account Confirmation Modal */}
      {showDeleteAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete Account</h2>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300 mb-3">
                Are you sure you want to delete your account? This action cannot be undone.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This will permanently delete:
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-400 mt-2 ml-4 list-disc">
                <li>Your profile information</li>
                <li>Your photos</li>
                <li>Your messages</li>
                <li>Your matches and swipes</li>
                <li>Your settings</li>
              </ul>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAccount(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
