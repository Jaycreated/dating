import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, User, ArrowLeft, Sparkles } from 'lucide-react';
import MatchModal from '../components/MatchModal';
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
      console.log('🔍 [FRONTEND] Starting to load potential matches...');
      
      // Get and verify token
      const token = localStorage.getItem('token');
      console.log('🔑 [FRONTEND] Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'No token found');
      
      if (!token) {
        console.error('❌ [FRONTEND] No authentication token found in localStorage');
        setError('Authentication required. Please log in.');
        navigate('/login');
        return;
      }
      
      console.log('🔑 [FRONTEND] Found authentication token in localStorage');
      
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('🔍 [FRONTEND] Token payload:', {
            userId: payload.userId,
            email: payload.email,
            iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'N/A',
            exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'N/A',
            now: new Date().toISOString()
          });
          
          // Check if token is expired
          if (payload.exp && Date.now() >= payload.exp * 1000) {
            console.error('❌ [FRONTEND] Token has expired!');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setError('Your session has expired. Please log in again.');
            navigate('/login');
            return;
          }
        } else {
          console.error('❌ [FRONTEND] Invalid token format');
          setError('Invalid authentication token. Please log in again.');
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
      } catch (e) {
        console.error('❌ [FRONTEND] Error parsing token:', e);
        setError('Error processing authentication. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      
      // Log token details (without exposing the full token)
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        try {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('🔍 [FRONTEND] Token payload:', {
            userId: payload.userId,
            iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'N/A',
            exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'N/A',
            now: new Date().toISOString()
          });
        } catch (e) {
          console.error('❌ [FRONTEND] Error parsing token payload:', e);
        }
      }
      
      console.log('🚀 [FRONTEND] Fetching potential matches from API...');
      const response = await userAPI.getPotentialMatches();
      
      if (!response) {
        throw new Error('No response from server');
      }
      
      console.log('✅ [FRONTEND] Received response from API');
      console.log('📦 [FRONTEND] Response data:', response);
      
      const matches = response.matches || [];
      console.log(`📊 [FRONTEND] Found ${matches.length} potential matches`);
      console.log('📦 [FRONTEND] Raw matches data:', JSON.stringify(matches, null, 2));
      
      // Parse JSON fields if they're strings
      const parsedMatches = matches.map((match: any, index: number) => {
        console.log(`🔍 [MATCH-${index}] Raw match data:`, JSON.stringify(match, null, 2));
        try {
          const parsed = {
            ...match,
            photos: match.photos ? (typeof match.photos === 'string' ? JSON.parse(match.photos) : match.photos) : [],
            interests: match.interests ? (typeof match.interests === 'string' ? JSON.parse(match.interests) : match.interests) : [],
          };
          console.log(`👤 [MATCH-${index}] Processed:`, {
            id: parsed.id,
            name: parsed.name,
            photoCount: parsed.photos?.length || 0,
            interestCount: parsed.interests?.length || 0
          });
          return parsed;
        } catch (error) {
          console.error(`❌ [FRONTEND] Error parsing match data for match ${index}:`, error);
          return null;
        }
      }).filter(Boolean);

      console.log(`🎯 [FRONTEND] Successfully parsed ${parsedMatches.length} matches`);
      setPotentialMatches(parsedMatches);
    } catch (err: any) {
      console.error('❌ [SWIPE] Error loading matches:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        responseData: err.response?.data,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers,
          params: err.config?.params,
          data: err.config?.data
        },
        stack: err.stack
      });
      
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load potential matches';
      setError(`Error: ${errorMessage}`);
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        console.log('🔐 [SWIPE] Unauthorized - redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
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
      </header> */}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
       <div className='flex flex-col justify-center items-center'>
         <h2 className='text-xl font-bold'>Discover People around you</h2>
         <p className='text-sm font-sm'>Keep swiping to find your match</p>
       </div>
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
        <MatchModal 
          matchedUser={{
            id: matchedUser.id,
            name: matchedUser.name,
            photos: matchedUser.photos
          }}
          onClose={closeMatchModal}
        />
      )}
    </div>
  );
};

export default Swipe;
