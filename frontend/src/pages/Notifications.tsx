import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Check, Trash2 } from 'lucide-react';
import { notificationAPI } from '../services/api';

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

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationAPI.getNotifications();
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId: number) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type === 'match') return '💕';
    if (type === 'like') return '❤️';
    return '🔔';
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getFirstPhoto = (photos: string | string[]) => {
    if (typeof photos === 'string') {
      try {
        const parsed = JSON.parse(photos);
        return parsed[0] || 'https://via.placeholder.com/100';
      } catch {
        return 'https://via.placeholder.com/100';
      }
    }
    return photos[0] || 'https://via.placeholder.com/100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>

          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-purple-600" />
            <span className="text-xl font-bold text-gray-900">Notifications</span>
          </div>

          {notifications.some(n => !n.read) && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-purple-600 hover:text-purple-800 font-medium"
            >
              Mark all read
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="w-12 h-12 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No notifications yet
            </h2>
            <p className="text-gray-600 mb-6">
              You'll be notified when someone likes you or you get a match!
            </p>
            <button
              onClick={() => navigate('/swipe')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
            >
              Start Swiping
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow ${
                  !notification.read ? 'border-2 border-purple-200' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* User Photo */}
                  <div className="flex-shrink-0">
                    <img
                      src={getFirstPhoto(notification.from_user_photo)}
                      alt={notification.from_user_name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">
                          <span className="text-2xl mr-2">{getNotificationIcon(notification.type)}</span>
                          {notification.message}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {getTimeAgo(notification.created_at)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-2 hover:bg-gray-100 rounded-full transition"
                            title="Mark as read"
                          >
                            <Check className="w-5 h-5 text-green-600" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-2 hover:bg-gray-100 rounded-full transition"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </div>

                    {/* Action Button */}
                    {notification.type === 'match' && (
                      <button
                        onClick={() => navigate('/matches')}
                        className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                      >
                        View Match
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Notifications;
