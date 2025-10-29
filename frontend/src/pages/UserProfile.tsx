import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Save, X } from 'lucide-react';
import { Button } from '../components/forms/Button';
import { Alert } from '../components/forms/Alert';
import { userAPI } from '../services/api';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileBasicInfo } from '../components/profile/ProfileBasicInfo';
import { ProfileAbout } from '../components/profile/ProfileAbout';

interface UserProfileData {
  id: number;
  name: string;
  email: string;
  age: number;
  gender: string;
  bio?: string;
  location?: string;
  profilePhoto?: string;
}

const UserProfile = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userEmail, setUserEmail] = useState('');
  
  const [formData, setFormData] = useState<Omit<UserProfileData, 'id' | 'email'>>({
    name: '',
    age: 0,
    gender: '',
    bio: '',
    location: '',
    profilePhoto: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Get user data from localStorage for immediate UI update
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setUserEmail(user.email || '');
          
          // Set initial form data from localStorage (for faster initial render)
          setFormData(prev => ({
            ...prev,
            name: user.name || '',
            age: user.age || 0,
            gender: user.gender || '',
            location: user.location || '',
          }));
        }

        // Then fetch fresh data from the server
        const response = await userAPI.getProfile();
        console.log('Fetched profile data:', response);
        
        // Extract user data from the response (handle both nested and flat structures)
        const userData = response.user || response;
        const profilePhoto = userData.photos?.[0] || userData.profilePhoto || userData.avatar || '';
        
        // Update form data with server data
        setFormData({
          name: userData.name || '',
          age: userData.age || 0,
          gender: userData.gender || '',
          bio: userData.bio || 'Tell others something about yourself...',
          location: userData.location || '',
          profilePhoto: profilePhoto,
        });
        
        // Update localStorage with fresh data
        if (storedUser) {
          const user = JSON.parse(storedUser);
          localStorage.setItem('user', JSON.stringify({
            ...user,
            ...userData,
            age: userData.age || user.age,
            gender: userData.gender || user.gender,
            location: userData.location || user.location,
            profilePhoto: profilePhoto,
          }));
        }
      } catch (err: any) {
        console.error('Profile fetch error:', err);
        setError(err.response?.data?.message || 'Failed to load profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name?.trim()) {
      setError('Name is required');
      return false;
    }
    if (formData.age && (formData.age < 18 || formData.age > 100)) {
      setError('Age must be between 18 and 100');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      
      // Prepare the data to send to the server
      const profileData = {
        name: formData.name.trim(),
        age: Number(formData.age),
        gender: formData.gender,
        bio: formData.bio?.trim(),
        location: formData.location?.trim(),
        profilePhoto: formData.profilePhoto,
      };
      
      console.log('Updating profile with:', profileData);
      const updatedProfile = await userAPI.updateProfile(profileData);
      
      // Update local storage with new user data
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const updatedUser = {
          ...user,
          name: updatedProfile.name || user.name,
          age: updatedProfile.age || user.age,
          gender: updatedProfile.gender || user.gender,
          bio: updatedProfile.bio || user.bio,
          location: updatedProfile.location || user.location,
          profilePhoto: updatedProfile.profilePhoto || updatedProfile.avatar || user.profilePhoto,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Refresh the profile data to ensure consistency
      const response = await userAPI.getProfile();
      const userData = response.user || response;
      const profilePhoto = userData.photos?.[0] || userData.profilePhoto || userData.avatar || '';
      
      setFormData(prev => ({
        ...prev,
        name: userData.name || '',
        age: userData.age || 0,
        gender: userData.gender || '',
        bio: userData.bio || '',
        location: userData.location || '',
        profilePhoto: profilePhoto,
      }));
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full transition"
            title="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
        </div>
      </header>
      
      <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {/* Header */}
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">My Profile</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {isEditing ? 'Edit your profile information' : 'Your personal details'}
              </p>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            ) : (
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button
                  type="submit"
                  form="profile-form"
                  disabled={isSubmitting}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    isSubmitting 
                      ? 'bg-purple-400' 
                      : 'bg-purple-600 hover:bg-purple-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Profile Content */}
          <div className="px-4 py-5 sm:p-6">
            {error && <Alert type="error" message={error} />}
            {success && <Alert type="success" message={success} />}

            <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
              <ProfileHeader
                name={formData.name}
                age={formData.age}
                profilePhoto={formData.profilePhoto}
                isEditing={isEditing}
                onNameChange={(name) => setFormData({ ...formData, name })}
              />

              <ProfileBasicInfo
                email={userEmail}
                gender={formData.gender}
                age={formData.age}
                location={formData.location || ''}
                isEditing={isEditing}
                onInputChange={handleInputChange}
              />

              <ProfileAbout
                bio={formData.bio || ''}
                isEditing={isEditing}
                onBioChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </form>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
