import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, User as UserIcon } from 'lucide-react';
import { matchAPI } from '../services/api';

interface Match {
  id: number;
  name: string;
  age: number;
  photos: string[];
  bio?: string;
  matched_at?: string;
}

const ChatList = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await matchAPI.getMatches();
      const matchesData = response.matches || [];
      
      // Parse JSON fields if they're strings
      const parsedMatches = matchesData.map((match: any) => ({
        ...match,
        photos: typeof match.photos === 'string' ? JSON.parse(match.photos) : match.photos || [],
      }));

      setMatches(parsedMatches);
      
      // Store in localStorage for chat page to access
      localStorage.setItem('matches', JSON.stringify(parsedMatches));
    } catch (err: any) {
      console.error('Error loading matches:', err);
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const getFirstPhoto = (photos: string[]) => {
    return photos[0] || 'https://via.placeholder.com/100';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chats...</p>
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

        {matches.length === 0 ? (
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
            {matches.map((match) => (
              <div
                key={match.id}
                onClick={() => navigate(`/chat/${match.id}`)}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={getFirstPhoto(match.photos)}
                    alt={match.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  {/* Online indicator (optional) */}
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {match.name}, {match.age}
                    </h3>
                    {match.matched_at && (
                      <span className="text-xs text-gray-500 ml-2">
                        {getTimeAgo(match.matched_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    Tap to start chatting
                  </p>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatList;
