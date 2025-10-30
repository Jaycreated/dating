import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
          <ProfileHeader 
            name={profile.name}
            age={profile.age}
            profilePhoto={profile.photos?.[0]}
            isEditing={false}
          />
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
