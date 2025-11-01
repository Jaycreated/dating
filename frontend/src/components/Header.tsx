import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { notificationAPI } from '../services/api';
import {
  Menu,
  X,
  User,
  MessageSquare,
  Heart,
  Compass,
  Settings,
  LogOut,
  Bell,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './forms/Button';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: 'Discover', path: '/swipe', icon: Compass },
  { name: 'Matches', path: '/matches', icon: Heart },
  { name: 'Chats', path: '/chats', icon: MessageSquare },
  { name: 'Profile', path: '/profile', icon: User },
];

interface Notification {
  id: number;
  from_user_id: number;
  from_user_name: string;
  from_user_photo: string | string[];
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch notifications
  const fetchNotifications = async () => {
    if (user) {
      try {
        const [countResponse, { notifications: notificationsData }] = await Promise.all([
          notificationAPI.getUnreadCount(),
          notificationAPI.getNotifications() // Get all notifications
        ]);
        
        setUnreadCount(countResponse.count || 0);
        // Take only the first 5 notifications for the dropdown
        setNotifications(Array.isArray(notificationsData) ? notificationsData.slice(0, 5) : []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle click outside to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleNotificationClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const handleViewAllNotifications = () => {
    navigate('/notifications');
    setIsNotificationOpen(false);
  };

  const formatNotificationTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Just now';
      
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Just now';
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <header className="bg-white sticky top-0 z-50 py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center h-16 px-4 sm:px-6">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <img
                  src="/images/Pairfect logo.png"
                  alt="Pairfect Logo"
                  className="h-10 w-auto"
                />
                <span className="ml-2 text-xl font-semibold text-black hidden sm:block">
                  Pairfect
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center border border-black rounded-full px-4 py-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-full ${
                    location.pathname === item.path
                      ? 'bg-black text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-1.5" />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  <div className="relative" ref={notificationRef}>
                    <button
                      onClick={handleNotificationClick}
                      className="p-2 relative text-gray-600 hover:text-gray-900 focus:outline-none"
                      aria-label="Notifications"
                      aria-expanded={isNotificationOpen}
                    >
                      <Bell className="h-6 w-6" />
                      {!isLoading && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                    
                    {/* Notification Dropdown */}
                    {isNotificationOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                        <div className="p-2 border-b border-gray-200 bg-gray-50">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium text-sm text-gray-900">Notifications</h3>
                            {unreadCount > 0 && (
                              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                {unreadCount} new
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="max-h-72 overflow-y-auto">
                          {isLoading ? (
                            <div className="p-4 text-center text-gray-500">Loading...</div>
                          ) : notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">No notifications yet</div>
                          ) : (
                            <div className="divide-y divide-gray-100">
                              {notifications.map((notification) => (
                                <div 
                                  key={notification.id}
                                  className={`p-3 hover:bg-gray-50 cursor-pointer relative ${!notification.read ? 'bg-blue-50' : ''}`}
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    
                                    try {
                                      // Mark as read if unread
                                      if (!notification.read) {
                                        await notificationAPI.markAsRead(notification.id);
                                        // Update local state
                                        setNotifications(prev => 
                                          prev.map(n => 
                                            n.id === notification.id 
                                              ? { ...n, read: true } 
                                              : n
                                          )
                                        );
                                        setUnreadCount(prev => Math.max(0, prev - 1));
                                      }
                                      
                                      // Navigate based on notification type
                                      if (notification.type === 'like' || notification.type === 'match') {
                                        navigate(`/user/${notification.from_user_id}`);
                                        setIsNotificationOpen(false);
                                      }
                                    } catch (error) {
                                      console.error('Error handling notification click:', error);
                                    }
                                  }}
                                >
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-gray-200 relative">
                                      {notification.from_user_photo ? (
                                        <img 
                                          src={Array.isArray(notification.from_user_photo) 
                                            ? notification.from_user_photo[0] 
                                            : notification.from_user_photo.startsWith('http')
                                              ? notification.from_user_photo
                                              : `${import.meta.env.VITE_API_URL || ''}${notification.from_user_photo}`
                                          } 
                                          alt={notification.from_user_name}
                                          className="h-full w-full object-cover"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null;
                                            target.src = '';
                                            target.parentElement!.innerHTML = `
                                              <div class="h-full w-full bg-gray-300 flex items-center justify-center text-gray-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                  <circle cx="12" cy="7" r="4"></circle>
                                                </svg>
                                              </div>
                                            `;
                                          }}
                                        />
                                      ) : (
                                        <div className="h-full w-full bg-gray-300 flex items-center justify-center text-gray-500">
                                          <User className="h-4 w-4" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{notification.from_user_name}</p>
                                      <p className="text-xs text-gray-500 line-clamp-2">{notification.message}</p>
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        {formatNotificationTime(notification.created_at)}
                                      </p>
                                    </div>
                                    {!notification.read && (
                                      <div className="ml-1 flex-shrink-0">
                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block"></span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-center">
                          <button
                            onClick={handleViewAllNotifications}
                            className="block w-full px-3 py-1.5 text-xs text-center text-blue-600 hover:bg-gray-50 border-t border-gray-100"
                          >
                            View all notifications
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <Link
                    to="/settings"
                    className="p-1 rounded-full text-gray-500 hover:text-gray-700"
                    title="Settings"
                  >
                    <Settings className="h-6 w-6" />
                  </Link>
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    className="text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="h-5 w-5 mr-1" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="border border-gray-300"
                    onClick={() => navigate('/login')}
                  >
                    Log in
                  </Button>
                  <Button onClick={() => navigate('/register')}>Sign up</Button>
                </>
              )}
            </div>

            {/* Mobile Header Controls */}
            <div className="flex items-center space-x-2 md:hidden">
              {/* Notification bell - Mobile */}
              {user && (
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={handleNotificationClick}
                    className="p-2 relative text-gray-600 hover:text-gray-900 focus:outline-none"
                    aria-label="Notifications"
                    aria-expanded={isNotificationOpen}
                  >
                    <Bell className="h-6 w-6" />
                    {!isLoading && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {/* Mobile Notification Dropdown - Matches Desktop */}
                  {isNotificationOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 md:hidden">
                      <div className="p-2 border-b border-gray-200 bg-gray-50">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium text-sm text-gray-900">Notifications</h3>
                          {unreadCount > 0 && (
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                          {isLoading ? (
                            <div className="p-4 text-center text-gray-500">Loading...</div>
                          ) : notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">No notifications yet</div>
                          ) : (
                            <div className="divide-y divide-gray-100">
                              {notifications.map((notification) => (
                                <div 
                                  key={notification.id}
                                  className={`p-3 hover:bg-gray-50 cursor-pointer relative ${!notification.read ? 'bg-blue-50' : ''}`}
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    
                                    try {
                                      if (!notification.read) {
                                        await notificationAPI.markAsRead(notification.id);
                                        setNotifications(prev => 
                                          prev.map(n => 
                                            n.id === notification.id 
                                              ? { ...n, read: true } 
                                              : n
                                          )
                                        );
                                        setUnreadCount(prev => Math.max(0, prev - 1));
                                      }
                                      
                                      if (notification.type === 'like' || notification.type === 'match') {
                                        navigate(`/user/${notification.from_user_id}`);
                                        setIsNotificationOpen(false);
                                      }
                                    } catch (error) {
                                      console.error('Error handling notification click:', error);
                                    }
                                  }}
                                >
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-gray-200 relative">
                                      {notification.from_user_photo ? (
                                        <img 
                                          src={Array.isArray(notification.from_user_photo) 
                                            ? notification.from_user_photo[0] 
                                            : notification.from_user_photo.startsWith('http')
                                              ? notification.from_user_photo
                                              : `${import.meta.env.VITE_API_URL || ''}${notification.from_user_photo}`
                                          } 
                                          alt={notification.from_user_name}
                                          className="h-full w-full object-cover"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null;
                                            target.src = '';
                                            target.parentElement!.innerHTML = `
                                              <div class="h-full w-full bg-gray-300 flex items-center justify-center text-gray-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                  <circle cx="12" cy="7" r="4"></circle>
                                                </svg>
                                              </div>
                                            `;
                                          }}
                                        />
                                      ) : (
                                        <div className="h-full w-full bg-gray-300 flex items-center justify-center text-gray-500">
                                          <User className="h-4 w-4" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0 ml-3">
                                      <p className="text-sm font-medium text-gray-900">{notification.from_user_name}</p>
                                      <p className="text-xs text-gray-500">{notification.message}</p>
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        {formatNotificationTime(notification.created_at)}
                                      </p>
                                    </div>
                                    {!notification.read && (
                                      <div className="ml-1 flex-shrink-0">
                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block"></span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-3">
                          <Button 
                            onClick={handleViewAllNotifications}
                            fullWidth
                            variant="ghost"
                            className="border border-gray-300"
                          >
                            View all notifications
                          </Button>
                        </div>
                      </div>
                  )}
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ${
          isMenuOpen ? 'visible' : 'invisible'
        }`}
      >
        {/* Overlay */}
        <div
          className={`fixed inset-0 bg-black transition-opacity duration-300 ${
            isMenuOpen ? 'opacity-50' : 'opacity-0'
          }`}
          onClick={() => setIsMenuOpen(false)}
        ></div>

        {/* Slide-out Menu */}
        <div
          className={`fixed inset-y-0 right-0 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-out ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col">
            <div className="flex justify-end items-center p-2 border-b border-gray-200">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`block px-4 py-3 mx-2 rounded-lg text-base font-medium ${
                    location.pathname === item.path
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </div>
                </Link>
              ))}

              {user ? (
                <div className="mt-2 border-t border-gray-100 pt-2">
                  <Link
                    to="/settings"
                    className="block px-4 py-3 mx-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Settings className="h-5 w-5 mr-3" />
                      Settings
                    </div>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 mx-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    <div className="flex items-center">
                      <LogOut className="h-5 w-5 mr-3" />
                      Logout
                    </div>
                  </button>
                </div>
              ) : (
                <div className="px-4 pt-2 pb-3 space-y-2 mt-2 border-t border-gray-100">
                  <Button
                    fullWidth
                    variant="ghost"
                    className="border border-gray-300"
                    onClick={() => {
                      navigate('/login');
                      setIsMenuOpen(false);
                    }}
                  >
                    Log in
                  </Button>
                  <Button
                    fullWidth
                    onClick={() => {
                      navigate('/register');
                      setIsMenuOpen(false);
                    }}
                  >
                    Sign up
                  </Button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
