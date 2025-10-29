import { User } from 'lucide-react';
import { Input } from '../forms/Input';

interface ProfileHeaderProps {
  name: string;
  age: number;
  profilePhoto?: string;
  isEditing: boolean;
  onNameChange?: (name: string) => void;
}

export const ProfileHeader = ({
  name,
  age,
  profilePhoto,
  isEditing,
  onNameChange = () => {},
}: ProfileHeaderProps) => {
  return (
    <div className="flex items-center space-x-6">
      <div className="relative">
        <img
          className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
          src={profilePhoto || 'https://via.placeholder.com/150'}
          alt="Profile"
        />
        {isEditing && (
          <button
            type="button"
            className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-full shadow-md text-purple-600 hover:text-purple-700 focus:outline-none"
          >
            <User className="h-4 w-4" />
          </button>
        )}
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? (
            <Input
              name="name"
              label="Name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="text-2xl font-bold"
              required
            />
          ) : (
            name
          )}
        </h2>
        <p className="text-gray-500">
          {age ? `${age} years old` : 'Age not specified'}
        </p>
      </div>
    </div>
  );
};
