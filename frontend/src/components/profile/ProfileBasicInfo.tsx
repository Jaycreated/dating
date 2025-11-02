import { Mail, User, Heart, ChevronDown } from 'lucide-react';
import { Input } from '../forms/Input';
import { cn } from '../../lib/utils';

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
              { value: 'queer', label: 'Queer' },
              { value: 'non-binary', label: 'Non-binary' },
            ]
          : [
              { value: 'dating', label: 'Dating' },
              { value: 'relationship', label: 'Serious Relationship' },
              { value: 'hookup', label: 'Casual Hookup' },
              { value: 'friends', label: 'New Friends' },
              { value: 'networking', label: 'Networking' },
              { value: 'something_casual', label: 'Something Casual' },
            ];

      return (
        <div className="mb-4 group relative">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
          <div className="relative">
            <select
              name={name}
              value={value || ''}
              onChange={handleInputChange}
              className={cn(
                'appearance-none w-full pl-4 pr-10 py-3 text-sm rounded-[24px] border border-gray-200',
                'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
                'transition-all duration-200 ease-in-out',
                'bg-transparent text-gray-900 placeholder-gray-400',
                'hover:border-gray-300',
                'focus:shadow-lg focus:shadow-purple-100',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'dark:border-gray-600 dark:text-white',
                'dark:focus:ring-purple-600 dark:focus:shadow-purple-900/20'
              )}
            >
              <option value="">Select {label.toLowerCase()}</option>
              {options.map((option) => (
                <option 
                  key={option.value} 
                  value={option.value}
                  className="py-2"
                >
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </div>
          </div>
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
    <div className="space-y-4">
      {/* Show Age input ONLY in edit mode (not in view mode) */}
      {isEditing && (
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Age
            </label>
            <Input
              type="number"
              name="age"
              value={age || ''}
              onChange={handleInputChange}
              placeholder="Enter your age"
              min="18"
              max="100"
              className="w-full px-4 py-3 text-sm rounded-[24px] border border-gray-200 bg-transparent focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-gray-300 dark:border-gray-600"
              required
            />
          </div>
        </div>
      )}

      {/* I Am / Interested In */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          {renderField(
            'Looking for',
            lookingFor,
            <Heart className="flex-shrink-0 mr-2 h-5 w-5 text-[#651B55]" />,
            'lookingFor'
          )}
        </div>
        <div>
          {renderField(
            'Interested in',
            interestedIn,
            <User className="flex-shrink-0 mr-2 h-5 w-5 text-[#651B55]" />,
            'interestedIn'
          )}
        </div>
      </div>

      {/* Show gender selection in edit mode */}
      {isEditing && (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Gender
          </label>
          <div className="relative">
            <select
              name="gender"
              value={gender || ''}
              onChange={handleInputChange}
              className={cn(
                'appearance-none w-full pl-4 pr-10 py-3 text-sm rounded-[24px] border border-gray-300',
                'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
                'transition-all duration-200 ease-in-out',
                'bg-white text-gray-900 placeholder-gray-400',
                'hover:border-gray-400',
                'focus:shadow-lg focus:shadow-purple-100',
                'border-gray-700 dark:text-white',
                'dark:focus:ring-purple-600 dark:focus:shadow-purple-900/20'
              )}
            >
              <option value="">Select your gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="transgender">Transgender</option>
              <option value="genderqueer">Genderqueer</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
              <option value="other">Other</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>
      )}

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
