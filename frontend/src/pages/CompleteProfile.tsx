import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, User, Calendar } from 'lucide-react';
import { Input } from '../components/forms/Input';
import { Button } from '../components/forms/Button';
import { Alert } from '../components/forms/Alert';
import { userAPI } from '../services/api';

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!formData.age || parseInt(formData.age) < 18 || parseInt(formData.age) > 100) {
      setError('Please enter a valid age (18-100)');
      return;
    }

    if (!formData.gender) {
      setError('Please select your gender');
      return;
    }

    setLoading(true);

    try {
      await userAPI.updateProfile({
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
      });

      // Redirect to step 2
      navigate('/select-interests');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to update profile. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Tell us about yourself</h1>
          <p className="text-gray-600 mt-2">Help us find your perfect match</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && <Alert type="error" message={error} />}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <Input
              id="name"
              label="What's your name?"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              icon={<User className="w-5 h-5 text-gray-400" />}
              required
            />

            {/* Age */}
            <div>
              <Input
                id="age"
                label="How old are you?"
                type="number"
                placeholder="Enter your age"
                min="18"
                max="100"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                icon={<Calendar className="w-5 h-5 text-gray-400" />}
                required
              />
              <p className="mt-1 text-xs text-gray-500">You must be 18 or older</p>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose your gender
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'male' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.gender === 'male'
                      ? 'border-purple-600 bg-purple-50 shadow-md'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-4xl mb-2">👨</div>
                  <div className="font-semibold text-gray-900">Male</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'female' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.gender === 'female'
                      ? 'border-purple-600 bg-purple-50 shadow-md'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-4xl mb-2">👩</div>
                  <div className="font-semibold text-gray-900">Female</div>
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} fullWidth>
              {loading ? 'Saving...' : 'Continue'}
            </Button>
          </form>
        </div>

        {/* Progress indicator */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-1 bg-purple-600 rounded-full"></div>
            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
          </div>
          <p className="text-sm text-gray-600">Step 1 of 3</p>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
