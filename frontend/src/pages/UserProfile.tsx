import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, MapPin, Plus, X, Settings } from 'lucide-react';
import { Button } from '../components/forms/Button';
import { userAPI } from '../services/api';
import { ProfileBasicInfo } from '../components/profile/ProfileBasicInfo';
import { ProfileAbout } from '../components/profile/ProfileAbout';
import { useToast } from '../components/ui/use-toast';
import { User } from 'lucide-react';

interface UserProfileData {
  id: number;
  name: string;
  email: string;
  age: number;
  gender: string;
  bio?: string;
  location?: string;
  photos: string[];
  preferences?: {
    looking_for?: string;
    [key: string]: any;
  };
}

const UserProfile = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_error, setError] = useState<string>('');

  const [formData, setFormData] = useState<UserProfileData>({
    id: 0,
    name: '',
    email: '',
    age: 0,
    gender: '',
    bio: '',
    location: '',
    photos: [],
    preferences: {},
  });

  const { toast } = useToast();

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError('');

        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setFormData(prev => ({
            ...prev,
            email: user.email || '',
            name: user.name || '',
            age: user.age || 0,
            gender: user.gender || '',
            location: user.location || '',
            preferences: user.preferences || {},
          }));
        }

        const response = await userAPI.getProfile();
        const userData = response.user || response;
        const profilePhoto = userData.photos?.[0] || userData.profilePhoto || userData.avatar || '';

        setFormData({
          id: userData.id || 0,
          email: userData.email || '',
          name: userData.name || '',
          age: userData.age || 0,
          gender: userData.gender || '',
          bio: userData.bio || 'Tell others something about yourself...',
          location: userData.location || '',
          photos: userData.photos || [],
          preferences: userData.preferences || {},
        });

        if (storedUser) {
          const user = JSON.parse(storedUser);
          localStorage.setItem('user', JSON.stringify({
            ...user,
            ...userData,
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

  const validateForm = (): boolean => {
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
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      // Create a new object with only the fields we want to send
      const updateData = { ...formData };

      // Ensure we're not sending empty strings for optional fields
      const cleanUpdateData = Object.entries(updateData).reduce((acc, [key, value]) => {
        if (value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      const updatedProfile = await userAPI.updateProfile(cleanUpdateData);

      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const updatedUser = {
          ...user,
          ...updatedProfile,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      toast({ title: 'Success', description: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (err: any) {
      console.error('Update error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update profile';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const data = new FormData();
        data.append('file', file);
        data.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
        data.append('folder', 'dating-app/profiles');

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: 'POST', body: data }
        );
        if (!res.ok) throw new Error('Upload failed');
        return res.json();
      });

      const results = await Promise.all(uploadPromises);
      const newPhotos = [...formData.photos, ...results.map(r => r.secure_url)].slice(0, 6);

      await userAPI.updateProfile({ photos: newPhotos });
      setFormData(prev => ({ ...prev, photos: newPhotos }));

      toast({ title: 'Success', description: 'Photos uploaded successfully' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload photos',
        variant: 'destructive',
      });
    } finally {
      e.target.value = '';
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
    <div className="mx-[20px] md:mx-au py-8">
                <h2 className='font-bold text-xl mb-4'>My Profile</h2>

      <div className="space-y-6 mx-auto flex flex-col justify-center items-center">
        <div className="flex justify-between lg:w-[500px]">
          <div className="">
        <div className='flex gap-[20px]'>
           <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {formData.photos ? (
                <img
                  src={formData.photos}
                  alt={`${formData.name}'s profile`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-300">
                  <User className="w-8 h-8 text-gray-500" />
                </div>
              )}
            </div>
             <div className=" items-center justify-center gap-4">
              <div>             
                 <h1 className="text-xl font-bold text-[#651B55]">{formData.name}, {formData.age}</h1>
              </div>
              <div>
                 <div className='flex'>
                  <MapPin className="flex-shrink-0 mr-2 h-5 w-5 text-[#651B55]" />

                {formData.location && <p className="text-sm font-semibold text-[#651B55]">{formData.location}</p>}
              </div>

                 <ProfileBasicInfo
            name={formData.name}
            email={formData.email || ''}
            age={formData.age}
            gender={formData.gender}
            location={formData.location}
            lookingFor={formData.preferences?.lookingFor}
            interestedIn={formData.preferences?.interestedIn}
            isEditing={isEditing}
            onUpdate={(updates) => {
              if (updates.preferences) {
                setFormData({
                  ...formData,
                  preferences: {
                    ...formData.preferences,
                    ...updates.preferences
                  }
                });
              } else {
                setFormData({ ...formData, ...updates });
              }
            }}
           />
              </div>

            </div>
           

        </div>
        
          </div>
          <div className='flex gap-[8px]'>
            {!isEditing && (
              <div className="cursor-pointer" onClick={() => navigate('/settings')}>
                <Settings className="h-[24px] w-[24px] text-[#651B55]"/>
              </div>
            )}

            {!isEditing && (
              <div>
                <Edit 
                  className="h-[24px] w-[24px] text-[#651B55]"  
                  onClick={() => setIsEditing(true)}
                />
              </div>
            )}
            <div>

            </div>

          </div>
        </div>

        <div className="space-y-6">
          <ProfileAbout
            bio={formData.bio || ''}
            isEditing={isEditing}
            onBioChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, bio: e.target.value })}
          />
        </div>

        <div className="space-y-4 ">
          <h2 className="text-xl font-semibold">Photos</h2>
          <div className="md:flex gap-[16px] justify-center shadow-sm">
            {formData.photos?.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={photo}
                  alt={`${formData.name}'s photo ${index + 1}`}
                  className="w-full h-48 object-contain rounded-lg"
                />
                {isEditing && (
                  <button
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      const updatedPhotos = formData.photos.filter((_, i) => i !== index);
                      setFormData({ ...formData, photos: updatedPhotos });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {index === 0 && (
                  <span className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    Main Photo
                  </span>
                )}
              </div>
            ))}

            {isEditing && formData.photos?.length < 6 && (
              <label className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 h-48">
                <Plus className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Add Photo</p>
                <p className="text-xs text-gray-400">
                  {6 - (formData.photos?.length || 0)} remaining
                </p>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                />
              </label>
            )}
          </div>
        </div>
      </div>
      {/* Bottom buttons for edit mode */}
      {isEditing && (
        <div className="mt-8 border-t border-gray-200 pt-6">
          <div className="flex justify-end gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setIsEditing(false)} 
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              className="bg-[#651B55] hover:bg-[#4f1550]"
              onClick={handleSubmit} 
              disabled={isSubmitting} 
              loading={isSubmitting}
            >
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
