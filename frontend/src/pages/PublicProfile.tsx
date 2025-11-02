import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { userAPI, matchAPI } from '../services/api';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileBasicInfo } from '../components/profile/ProfileBasicInfo';
import { ProfileAbout } from '../components/profile/ProfileAbout';
import { toast } from 'react-toastify';

interface UserProfile {
  id: number;
  name: string;
  age: number;
  gender: string;
  email?: string;
  bio?: string;
  location: string;
  photos: string[];
  interests?: string[];
  lookingFor?: string;
  interestedIn?: string;
  created_at: string;
}

const PublicProfile = () => {
  const { userId: id } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isLiking, setIsLiking] = useState(false);

  const nextPhoto = () => {
    if (profile && profile.photos.length > 0) {
      setCurrentPhotoIndex((prevIndex) => 
        prevIndex === profile.photos.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevPhoto = () => {
    if (profile && profile.photos.length > 0) {
      setCurrentPhotoIndex((prevIndex) => 
        prevIndex === 0 ? (profile.photos.length - 1) : prevIndex - 1
      );
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) {
        const errorMsg = 'No user ID provided';
        console.error('Profile Error:', errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError('');
        
        const userId = parseInt(id);
        console.log('Fetching profile for user ID:', userId);
        
        if (isNaN(userId) || userId <= 0) {
          const errorMsg = `Invalid user ID: ${id}`;
          console.error('Profile Error:', errorMsg);
          throw new Error(errorMsg);
        }
        
        console.log('Making API call to fetch profile...');
        const data = await userAPI.getPublicProfile(userId);
        console.log('Profile data received:', data);
        
        if (!data) {
          console.error('Empty profile data received');
          throw new Error('No profile data received');
        }
        
        setProfile(data);
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        const errorMessage = err.response?.data?.error || err.message || 'Failed to load profile. Please try again.';
        console.error('Profile fetch error:', {
          error: err,
          response: err.response,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data
        });
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-purple-700">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-xl shadow-md max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-purple-800 mb-4">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested profile could not be found.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-[#651B55] text-white rounded-[24px] hover:bg-purple-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleLike = async () => {
    if (!profile || isLiking) return;
    
    setIsLiking(true);
    try {
      await matchAPI.likeUser(profile.id);
      toast.success('Liked! You have a new match!', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      // Optional: Navigate to matches or show match success modal
    } catch (error: any) {
      console.error('Error liking user:', error);
      toast.error(error.response?.data?.message || 'Failed to like user. Please try again.', {
        position: 'top-center',
      });
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 pb-12">
      <div className="container mx-auto px-4 py-8">

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Photo Carousel */}
          <div className="relative h-96 bg-gray-100">
            {profile.photos && profile.photos.length > 0 ? (
              <>
                <img
                  src={profile.photos[currentPhotoIndex]}
                  alt={`${profile.name}'s photo ${currentPhotoIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Navigation Arrows */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevPhoto();
                    }}
                    className="bg-white/80 text-purple-600 p-2 rounded-full hover:bg-white transition-colors"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextPhoto();
                    }}
                    className="bg-white/80 text-purple-600 p-2 rounded-full hover:bg-white transition-colors"
                    aria-label="Next photo"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
                
                {/* Like Button */}
                <div className="absolute bottom-4 right-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike();
                    }}
                    disabled={isLiking}
                    className={`p-3 rounded-full shadow-lg transition-all transform hover:scale-110 ${
                      isLiking 
                        ? 'bg-gray-300' 
                        : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700'
                    }`}
                    aria-label="Like profile"
                  >
                    <Heart 
                      className={`w-8 h-8 ${isLiking ? 'text-gray-500' : 'text-white'}`} 
                      fill={isLiking ? 'currentColor' : 'none'}
                    />
                  </button>
                </div>
                
                {/* Photo Indicators */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                  {profile.photos.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPhotoIndex(idx);
                      }}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentPhotoIndex
                          ? 'w-6 bg-white'
                          : 'w-2 bg-white/50 hover:bg-white/75'
                      }`}
                      aria-label={`Go to photo ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-gray-400">No photos available</div>
              </div>
            )}
          </div>
          
          {/* Profile Content */}
          <div className="p-6">
            <ProfileHeader 
              name={profile.name}
              age={profile.age}
              profilePhoto={profile.photos?.[0]}
              isEditing={false}
            />
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <ProfileAbout 
                  bio={profile.bio || ''} 
                  isEditing={false} 
                  onBioChange={() => {}} 
                />
              </div>
              
              <div className="md:col-span-1">
                <ProfileBasicInfo 
                  name={profile.name}
                  email={profile.email || 'Email not provided'}
                  gender={profile.gender}
                  age={profile.age}
                  location={profile.location}
                  lookingFor={profile.lookingFor}
                  interestedIn={profile.interests?.[0] || profile.interestedIn}
                  isEditing={false}
                  onUpdate={() => {}}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
