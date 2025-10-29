import { Mail, User, Calendar, MapPin } from 'lucide-react';
import { Input } from '../forms/Input';

interface ProfileBasicInfoProps {
  email: string;
  gender: string;
  age: number | string;
  location: string;
  isEditing: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export const ProfileBasicInfo = ({
  email,
  gender,
  age,
  location,
  isEditing,
  onInputChange,
}: ProfileBasicInfoProps) => {
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
              onChange={onInputChange}
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
              onChange={onInputChange}
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
        <div>
          <label className="block text-sm font-medium text-gray-500">Location</label>
          {isEditing ? (
            <Input
              type="text"
              name="location"
              label="Location"
              value={location || ''}
              onChange={onInputChange}
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
