import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, User as UserIcon, Lock } from 'lucide-react';
import { messageAPI, paymentAPI } from '../services/api';

interface Conversation {
  id: number;
  name: string;
  photos?: string[] | string;
  age?: number;
  location?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

const ChatList = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasChatAccess, setHasChatAccess] = useState<boolean | null>(() => {
    const storedAccess = localStorage.getItem('hasChatAccess');
    return storedAccess ? storedAccess === 'true' : null;
  });

  useEffect(() => {
    const checkAccess = async () => {
      try {
        console.log('🔍 Checking chat access...');
        const response = await paymentAPI.checkChatAccess();
        console.log('🔑 Chat access response:', response);
        setHasChatAccess(response.hasAccess);
        localStorage.setItem('hasChatAccess', response.hasAccess ? 'true' : 'false');
        if (response.hasAccess) {
          console.log('✅ User has chat access, loading conversations...');
          await loadConversations();
        } else {
          console.log('❌ User does not have chat access');
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ Error checking chat access:', err);
        // Fallback to localStorage if API call fails
        const storedAccess = localStorage.getItem('hasChatAccess') === 'true';
        setHasChatAccess(storedAccess);
        if (storedAccess) {
          await loadConversations();
        } else {
          setError('Failed to verify chat access. Please try again later.');
        }
        setLoading(false);
      }
    };

    checkAccess();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await messageAPI.getConversations();
      const conversationsData = response.conversations || [];
      setConversations(conversationsData);
      
      // Store in localStorage
      localStorage.setItem('conversations', JSON.stringify(conversationsData));
    } catch (err: any) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const getFirstPhoto = (photos?: string[] | string) => {
    if (!photos) return 'https://via.placeholder.com/100';
    
    // If it's an array, get the first element
    if (Array.isArray(photos)) {
      return photos[0] || 'https://via.placeholder.com/100';
    }
    
    // If it's a string, try to parse as JSON array
    if (typeof photos === 'string') {
      try {
        const parsed = JSON.parse(photos);
        return Array.isArray(parsed) ? parsed[0] : photos;
      } catch {
        // If not valid JSON, return the string as-is
        return photos;
      }
    }
    
    return 'https://via.placeholder.com/100';
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if ((hasChatAccess === null || loading) && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  if (hasChatAccess === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-[#651B55] rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Chat Locked</h2>
          <p className="text-gray-600 mb-6">
            Unlock chat access to start messaging with your matches. Choose between our daily or monthly subscription plans.
          </p>
          <button
            onClick={() => navigate('/pricing')}
            className="w-full bg-[#651B55] text-white py-3 px-6 rounded-lg font-medium"
          >
            Unlock Chat
          </button>
          <button
            onClick={() => navigate('/swipe')}
            className="mt-4 text-sm text-[#651B55]  font-medium"
          >
            Back to Swipe
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
      {/* Header */}
      {/* <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>

          <div className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-purple-600" />
            <span className="text-xl font-bold text-gray-900">Messages</span>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <UserIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </header> */}

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-center">
            {error}
          </div>
        )}

        {conversations.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-12 h-12 text-[#651B55]" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No conversations yet
            </h2>
            <p className="text-gray-600 mb-6">
              Start swiping to find matches and chat with them!
            </p>
            <button
              onClick={() => navigate('/swipe')}
              className="px-6 py-3 bg-[#651B55] text-[#F0F0F0] rounded-[24px] w-[349px] font-semibold"
            >
              Start Swiping
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => navigate(`/chat/${conversation.id}`)}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={getFirstPhoto(conversation.photos)}
                    alt={conversation.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  {/* Online indicator (optional) */}
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {conversation.name}
                      {conversation.age && `, ${conversation.age}`}
                    </h3>
                    {conversation.last_message_at && (
                      <span className="text-xs text-gray-500 ml-2">
                        {getTimeAgo(conversation.last_message_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {conversation.last_message || 'Tap to start chatting'}
                  </p>
                </div>

                {/* Unread Badge */}
                {conversation.unread_count ? (
                  <div className="flex-shrink-0 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">
                    {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                  </div>
                ) : (
                  <div className="flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatList;
