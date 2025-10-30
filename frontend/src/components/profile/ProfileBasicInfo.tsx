import { Mail, User, Calendar, MapPin, Heart } from 'lucide-react';
import { Input } from '../forms/Input';

interface ProfileBasicInfoProps {
  name: string;
  email: string;
  gender: string;
  age: number | string;
  location: string;
  lookingFor?: string;
  interestedIn?: string;
  isEditing: boolean;
  onUpdate: (updates: { [key: string]: any }) => void;
}

export const ProfileBasicInfo = ({
  name,
  email,
  gender,
  age,
  location,
  lookingFor = '',
  interestedIn = '',
  isEditing,
  onUpdate,
}: ProfileBasicInfoProps) => {
  console.log('[ProfileBasicInfo] Props:', {
    name,
    email,
    gender,
    age,
    location,
    lookingFor,
    interestedIn,
    isEditing
  });
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(`[ProfileBasicInfo] Field changed - Name: ${name}, Value: ${value}`);
    
    if (name === 'lookingFor' || name === 'interestedIn') {
      const newPreferences = { 
        ...(onUpdate as any).preferences, 
        [name]: value 
      };
      console.log('[ProfileBasicInfo] Updating preferences:', newPreferences);
      onUpdate({ 
        preferences: newPreferences
      });
    } else {
      console.log(`[ProfileBasicInfo] Updating field ${name}:`, value);
      onUpdate({ [name]: value });
    }
  };

  const renderField = (label: string, value: string, icon: React.ReactNode, name: 'lookingFor' | 'interestedIn') => {
    console.log(`[ProfileBasicInfo] Rendering field ${name}:`, { label, value });
    if (isEditing) {
      const options = name === 'lookingFor' ? [
        { value: 'straight', label: 'Straight' },
        { value: 'gay', label: 'Gay' },
        { value: 'lesbian', label: 'Lesbian' },
        { value: 'bisexual', label: 'Bisexual' },
        { value: 'transgender', label: 'Transgender' }
      ] : [
        { value: 'dating', label: 'Dating' },
        { value: 'relationship', label: 'Relationship' },
        { value: 'hookup', label: 'Hookup' },
        { value: 'friends', label: 'Friends' }
      ];
      console.log(`[ProfileBasicInfo] Options for ${name}:`, options);

      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-500">{label}</label>
          <select
            name={name}
            value={value || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md border"
          >
            <option value="">Select {label.toLowerCase()}</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    }
    
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-500">{label}</label>
        <div className="mt-1 flex items-center text-gray-900">
          {icon}
          <span>{value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Not specified'}</span>
        </div>
      </div>
    );
  };
  return (
    <div className="border-t border-gray-200 pt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
      <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6">
        <div>
          <label className="block text-sm font-medium text-gray-500">Email</label>
          <div className="mt-1 flex items-center text-gray-900">
            <Mail className="flex-shrink-0 mr-2 h-5 w-5 text-gray-400" />
            <span className="truncate">{email}</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Gender</label>
          {isEditing ? (
            <select
              name="gender"
              value={gender}
              onChange={handleInputChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md border"
              required
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          ) : (
            <div className="mt-1 flex items-center text-gray-900">
              <User className="flex-shrink-0 mr-2 h-5 w-5 text-gray-400" />
              <span className="capitalize">{gender || 'Not specified'}</span>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Age</label>
          {isEditing ? (
            <Input
              type="number"
              name="age"
              label="Age"
              value={age || ''}
              onChange={handleInputChange}
              min="18"
              max="100"
              required
            />
          ) : (
            <div className="mt-1 flex items-center text-gray-900">
              <Calendar className="flex-shrink-0 mr-2 h-5 w-5 text-gray-400" />
              <span>{age || 'Not specified'}</span>
            </div>
          )}
        </div>
        {renderField('I Am', lookingFor || '', <User className="flex-shrink-0 mr-2 h-5 w-5 text-gray-400" />, 'lookingFor')}
        {renderField('Interested In', interestedIn || '', <Heart className="flex-shrink-0 mr-2 h-5 w-5 text-gray-400" />, 'interestedIn')}
        <div>
          <label className="block text-sm font-medium text-gray-500">Location</label>
          {isEditing ? (
            <Input
              type="text"
              name="location"
              label="Location"
              value={location || ''}
              onChange={handleInputChange}
              placeholder="Enter your location"
            />
          ) : (
            <div className="mt-1 flex items-center text-gray-900">
              <MapPin className="flex-shrink-0 mr-2 h-5 w-5 text-gray-400" />
              <span>{location || 'Not specified'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
