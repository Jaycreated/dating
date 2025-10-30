import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Bell, Lock, User, Heart, Shield, HelpCircle, Moon } from 'lucide-react';
import { Alert } from '../components/forms/Alert';
import { userAPI } from '../services/api';
import { ChangePasswordForm } from '../components/forms/ChangePasswordForm';

const Settings = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [notifications, setNotifications] = useState({
    matches: true,
    messages: true,
    promotions: false,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        // In a real app, you would fetch these from your API
        const response = await userAPI.getSettings();
        if (response.settings) {
          setDarkMode(response.settings.darkMode || false);
          setNotifications(prev => ({
            ...prev,
            ...response.settings.notifications
          }));
        }
      } catch (err: any) {
        console.error('Error fetching settings:', err);
        setError('Failed to load settings. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleLogout = async () => {
    try {
      await userAPI.logout();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to log out. Please try again.');
    }
  };

  const handleNotificationChange = (type: string) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type as keyof typeof prev]
    }));
    // In a real app, you would save this to your API
    saveSettings({ notifications: { ...notifications, [type]: !notifications[type as keyof typeof notifications] } });
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    // In a real app, you would save this to your API
    saveSettings({ darkMode: newDarkMode });
    // Toggle dark mode class on document element
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const saveSettings = async (settings: any) => {
    try {
      await userAPI.updateSettings(settings);
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const SettingItem = ({ 
    icon: Icon, 
    title, 
    description, 
    action, 
    toggle = false, 
    toggleValue = false,
    onToggle = () => {}
  }: {
    icon: any;
    title: string;
    description: string;
    action?: () => void;
    toggle?: boolean;
    toggleValue?: boolean;
    onToggle?: () => void;
  }) => (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-4">
        <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
          <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      {toggle ? (
        <button
          type="button"
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            toggleValue ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
          }`}
          onClick={onToggle}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              toggleValue ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      ) : (
        <button
          onClick={action}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Manage
        </button>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handlePasswordChangeSuccess = () => {
    setPasswordChangeSuccess(true);
    setShowChangePassword(false);
    setTimeout(() => setPasswordChangeSuccess(false), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>
          
          {error && <div className="mb-4"><Alert type="error" message={error} /></div>}
          {success && <div className="mb-4"><Alert type="success" message={success} /></div>}
          {passwordChangeSuccess && (
            <div className="mb-4">
              <Alert type="success" message="Password changed successfully!" />
            </div>
          )}
          
          <div className="space-y-1">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-4 py-2">ACCOUNT</h2>
            
            <SettingItem
              icon={User}
              title="Edit Profile"
              description="Update your personal information"
              action={() => navigate('/profile')}
            />
            
            <SettingItem
              icon={Lock}
              title="Change Password"
              description="Update your password"
              action={() => setShowChangePassword(true)}
            />
            
            <SettingItem
              icon={Heart}
              title="Dating Preferences"
              description="Manage who you want to see and be seen by"
              action={() => navigate('/preferences')}
            />
          </div>
          
          <div className="mt-8 space-y-1">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-4 py-2">PREFERENCES</h2>
            
            <SettingItem
              icon={Moon}
              title="Dark Mode"
              description="Switch between light and dark theme"
              toggle
              toggleValue={darkMode}
              onToggle={toggleDarkMode}
            />
            
            <SettingItem
              icon={Bell}
              title="Notifications"
              description="Manage your notification preferences"
              toggle
              toggleValue={notifications.matches}
              onToggle={() => handleNotificationChange('matches')}
            />
            
            <SettingItem
              icon={Shield}
              title="Privacy"
              description="Control your privacy settings"
              action={() => navigate('/privacy')}
            />
          </div>
          
          <div className="mt-8 space-y-1">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-4 py-2">SUPPORT</h2>
            
            <SettingItem
              icon={HelpCircle}
              title="Help & Support"
              description="Get help or contact support"
              action={() => navigate('/help')}
            />
            
            <SettingItem
              icon={LogOut}
              title="Log Out"
              description="Sign out of your account"
              action={handleLogout}
            />
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
              onSuccess={handlePasswordChangeSuccess}
              onCancel={() => setShowChangePassword(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
