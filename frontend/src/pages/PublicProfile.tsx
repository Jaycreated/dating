import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { userAPI } from '../services/api';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileBasicInfo } from '../components/profile/ProfileBasicInfo';
import { ProfileAbout } from '../components/profile/ProfileAbout';

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
  created_at: string;
}

const PublicProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

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
        setError('No user ID provided');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError('');
        
        const userId = parseInt(id);
        if (isNaN(userId) || userId <= 0) {
          throw new Error('Invalid user ID');
        }
        
        const data = await userAPI.getPublicProfile(userId);
        setProfile(data);
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err.response?.data?.error || 'Failed to load profile. Please try again later.');
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
            className="px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 pb-12">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-purple-700 hover:text-purple-900 mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2" size={20} />
          Back
        </button>

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
                {profile.photos.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        prevPhoto();
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        nextPhoto();
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      aria-label="Next photo"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
                
                {/* Photo Indicators */}
                {profile.photos.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    {profile.photos.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentPhotoIndex(index);
                        }}
                        className={`h-2 w-2 rounded-full transition-colors ${
                          index === currentPhotoIndex
                            ? 'bg-white w-6'
                            : 'bg-white/50 hover:bg-white/75'
                        }`}
                        aria-label={`Go to photo ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
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
                  email={profile.email || 'Email not provided'}
                  gender={profile.gender}
                  age={profile.age}
                  location={profile.location}
                  isEditing={false}
                  onInputChange={() => {}}
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
