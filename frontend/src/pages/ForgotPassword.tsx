import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/forms/Input';
import { Button } from '../components/forms/Button';
import { Alert } from '../components/forms/Alert';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email) {
      setError('Please enter your email');
      return;
    }

    try {
      setLoading(true);
      const resp = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (resp.ok) {
        setSuccess("If an account exists for that email, we've sent a reset link.");
      } else {
        const data = await resp.json();
        setError(data.error || 'Failed to request password reset');
      }
    } catch (err) {
      setError('Failed to request password reset. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
          <p className="text-gray-600 mt-2">Enter your email and we'll send reset instructions.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              id="email"
              name="email"
              type="email"
              label="Email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Button type="submit" loading={loading} fullWidth>
              Send reset link
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Remembered your password?{' '}
              <button onClick={() => navigate('/login')} className="text-purple-800 font-semibold hover:underline">
                Sign in
              </button>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <button onClick={() => navigate('/')} className="text-gray-600 hover:text-gray-900 text-sm">← Back to home</button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
