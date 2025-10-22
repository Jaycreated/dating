import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, User, ArrowLeft, Sparkles } from 'lucide-react';
import { SwipeCard } from '../components/SwipeCard';
import { userAPI, matchAPI } from '../services/api';

interface PotentialMatch {
  id: number;
  name: string;
  age: number;
  gender: string;
  bio?: string;
  location?: string;
  photos: string[];
  interests?: string[];
}

const Swipe = () => {
  const navigate = useNavigate();
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState<PotentialMatch | null>(null);

  useEffect(() => {
    loadPotentialMatches();
  }, []);

  const loadPotentialMatches = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await userAPI.getPotentialMatches();
      const matches = response.matches || [];
      
      // Parse JSON fields if they're strings
      const parsedMatches = matches.map((match: any) => ({
        ...match,
        photos: typeof match.photos === 'string' ? JSON.parse(match.photos) : match.photos || [],
        interests: typeof match.interests === 'string' ? JSON.parse(match.interests) : match.interests || [],
      }));

      setPotentialMatches(parsedMatches);
    } catch (err: any) {
      console.error('Error loading matches:', err);
      setError('Failed to load potential matches');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (currentIndex >= potentialMatches.length) return;

    const currentUser = potentialMatches[currentIndex];

    try {
      const response = await matchAPI.likeUser(currentUser.id);
      
      // Check if it's a match
      if (response.matched) {
        setMatchedUser(currentUser);
        setShowMatchModal(true);
      }

      // Move to next card
      setCurrentIndex((prev) => prev + 1);
    } catch (err) {
      console.error('Error liking user:', err);
    }
  };

  const handlePass = async () => {
    if (currentIndex >= potentialMatches.length) return;

    const currentUser = potentialMatches[currentIndex];

    try {
      await matchAPI.passUser(currentUser.id);
      
      // Move to next card
      setCurrentIndex((prev) => prev + 1);
    } catch (err) {
      console.error('Error passing user:', err);
    }
  };

  const closeMatchModal = () => {
    setShowMatchModal(false);
    setMatchedUser(null);
  };

  const currentUser = potentialMatches[currentIndex];
  const hasMoreUsers = currentIndex < potentialMatches.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Finding matches...</p>
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
            <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />
            <span className="text-2xl font-bold text-gray-900">Pairfect</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/chats')}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <MessageCircle className="w-6 h-6 text-gray-600" />
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <User className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-center">
            {error}
          </div>
        )}

        {hasMoreUsers ? (
          <div className="flex flex-col items-center">
            <SwipeCard
              user={currentUser}
              onLike={handleLike}
              onPass={handlePass}
            />

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {potentialMatches.length - currentIndex} potential matches remaining
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-12 h-12 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No more profiles
            </h2>
            <p className="text-gray-600 mb-6">
              Check back later for new matches!
            </p>
            <button
              onClick={() => navigate('/matches')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              View Your Matches
            </button>
          </div>
        )}
      </main>

      {/* Match Modal */}
      {showMatchModal && matchedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center animate-bounce-in">
            <div className="mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                It's a Match!
              </h2>
              <p className="text-gray-600">
                You and {matchedUser.name} liked each other
              </p>
            </div>

            <div className="flex justify-center gap-4 mb-6">
              {matchedUser.photos && matchedUser.photos[0] && (
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-pink-500">
                  <img
                    src={matchedUser.photos[0]}
                    alt={matchedUser.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeMatchModal}
                className="flex-1 px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition font-semibold"
              >
                Keep Swiping
              </button>
              <button
                onClick={() => navigate('/matches')}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
              >
                View Matches
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Swipe;
