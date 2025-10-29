interface ProfileAboutProps {
  bio: string;
  isEditing: boolean;
  onBioChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const ProfileAbout = ({ bio, isEditing, onBioChange }: ProfileAboutProps) => {
  return (
    <div className="border-t border-gray-200 pt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">About Me</h3>
      {isEditing ? (
        <div>
          <label htmlFor="bio" className="sr-only">
            About
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
            placeholder="Tell others about yourself..."
            value={bio}
            onChange={onBioChange}
          />
        </div>
      ) : (
        <p className="text-gray-700 whitespace-pre-line">
          {bio || 'No bio provided.'}
        </p>
      )}
    </div>
  );
};
