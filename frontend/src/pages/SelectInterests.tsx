import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Users, Smile } from 'lucide-react';
import { Button } from '../components/forms/Button';
import { Alert } from '../components/forms/Alert';
import { userAPI } from '../services/api';

const interests = [
  { id: 'relationship', label: 'Relationship', icon: Heart },
  { id: 'casual', label: 'Casual Frienship', icon: Users },
  { id: 'hookup', label: 'Hookup', icon: Smile },
  { id: 'chat', label: 'Chat Buddy', icon: MessageCircle },
];

const SelectInterests = () => {
  const navigate = useNavigate();
  const [selectedInterest, setSelectedInterest] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedInterest) {
      setError('Please select what you\'re interested in');
      return;
    }

    setLoading(true);

    try {
      await userAPI.updateProfile({
        preferences: { 
          interestedIn: selectedInterest,  
        },
      });

      // Redirect to next step (step 3)
      navigate('/upload-photos');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to save. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
      {/* Header with Logo */}
      {/* <div className="p-6">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
          <span className="text-xl font-bold text-gray-900">Pairfect</span>
        </div>
      </div> */}

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            One last thing, What are you interested in?
          </h1>
          <p className="text-gray-600">
            State what you're interested in and find match faster
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <Alert type="error" message={error} />}

          {/* Interest Options */}
          <div className="space-y-4">
            {interests.map((interest) => {
              const Icon = interest.icon;
              const isSelected = selectedInterest === interest.id;

              return (
                <button
                  key={interest.id}
                  type="button"
                  onClick={() => setSelectedInterest(interest.id)}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-purple-100' : 'bg-gray-100'
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          isSelected ? 'text-purple-600' : 'text-gray-600'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-lg font-medium ${
                        isSelected ? 'text-purple-900' : 'text-gray-900'
                      }`}
                    >
                      {interest.label}
                    </span>
                  </div>

                  {/* Radio button */}
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? 'border-purple-600 bg-purple-600'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Continue Button */}
          <div className="pt-8">
            <Button
              type="submit"
              loading={loading}
              fullWidth
              disabled={!selectedInterest}
            >
              Continue
            </Button>
          </div>
        </form>

        {/* Progress indicator */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-1 bg-purple-600 rounded-full"></div>
            <div className="w-8 h-1 bg-purple-600 rounded-full"></div>
            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
          </div>
          <p className="text-sm text-gray-600">Step 2 of 3</p>
        </div>
      </div>
    </div>
  );
};

export default SelectInterests;
