import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft, MessageCircle, User as UserIcon } from 'lucide-react';
import { matchAPI } from '../services/api';

interface Match {
  id: number;
  name: string;
  age: number;
  photos: string[];
  bio?: string;
}

const Matches = () => {
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
    } catch (err: any) {
      console.error('Error loading matches:', err);
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading matches...</p>
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
            <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />
            <span className="text-2xl font-bold text-gray-900">Your Matches</span>
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
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-center">
            {error}
          </div>
        )}

        {matches.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No matches yet
            </h2>
            <p className="text-gray-600 mb-6">
              Start swiping to find your perfect match!
            </p>
            <button
              onClick={() => navigate('/swipe')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
            >
              Start Swiping
            </button>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-6 text-center">
              You have {matches.length} {matches.length === 1 ? 'match' : 'matches'}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer group"
                  onClick={() => navigate(`/chat/${match.id}`)}
                >
                  <div className="relative aspect-[3/4]">
                    <img
                      src={match.photos[0] || 'https://via.placeholder.com/300x400?text=No+Photo'}
                      alt={match.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Hover overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform">
                      <div className="flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm rounded-full py-2">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Send Message</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900">
                      {match.name}, {match.age}
                    </h3>
                    {match.bio && (
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                        {match.bio}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Matches;
