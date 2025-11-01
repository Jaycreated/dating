import { Mail, User, Heart } from 'lucide-react';
import { Input } from '../forms/Input';

interface ProfileBasicInfoProps {
  name: string;
  email: string;
  gender: string;
  age: number | string;
  location?: string;
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'lookingFor' || name === 'interestedIn') {
      const newPreferences = { 
        ...(onUpdate as any).preferences, 
        [name]: value 
      };
      onUpdate({ preferences: newPreferences });
    } else {
      onUpdate({ [name]: value });
    }
  };

  const renderField = (
    label: string,
    value: string,
    icon: React.ReactNode,
    name: 'lookingFor' | 'interestedIn'
  ) => {
    if (isEditing) {
      const options =
        name === 'lookingFor'
          ? [
              { value: 'straight', label: 'Straight' },
              { value: 'gay', label: 'Gay' },
              { value: 'lesbian', label: 'Lesbian' },
              { value: 'bisexual', label: 'Bisexual' },
              { value: 'transgender', label: 'Transgender' },
            ]
          : [
              { value: 'dating', label: 'Dating' },
              { value: 'relationship', label: 'Relationship' },
              { value: 'hookup', label: 'Hookup' },
              { value: 'friends', label: 'Friends' },
            ];

      return (
        <div className="mb4">
          <label className="block text-sm font-medium text-gray-500">{label}</label>
          <select
            name={name}
            value={value || ''}
            onChange={handleInputChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 
                       focus:outline-none focus:ring-purple-500 focus:border-purple-500 
                       sm:text-sm rounded-md border"
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

    // Hide labels in view mode
    return (
      <div className="flex items-center text-gray-900">
        {icon}
        <span>{value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Not specified'}</span>
      </div>
    );
  };

  return (
    <div className="border-t border-gray-200 gap-2 space-y-2">
      {/* Show Age input ONLY in edit mode (not in view mode) */}
      {isEditing && (
        <div className="">
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
        </div>
      )}

      {/* I Am / Interested In */}
      {renderField('I Am', lookingFor || '', <User className="mr-2 h-5 w-5 text-[#651B55]" />, 'lookingFor')}
      {renderField('Interested In', interestedIn || '', <Heart className="mr-2 h-5 w-5 text-[#651B55]" />, 'interestedIn')}

      {/* Location */}
      <div>
        {/* Show location input ONLY in edit mode (not in view mode) */}
        {isEditing && (
          <div className="">
            <label className="block text-sm font-medium text-gray-500">Location</label>
            <Input
              type="text"
              name="location"
              value={location || ''}
              onChange={handleInputChange}
              placeholder="Enter your location"
            />
          </div>
        )}
      </div>

      {/* Email (no label, just icon + value) */}
      <div className="mt-1 flex items-center text-gray-900">
        <Mail className="mr-2 h-5 w-5 text-[#651B55]" />
        <span className="truncate text-sm font-semibold">{email}</span>
      </div>
    </div>
  );
};
