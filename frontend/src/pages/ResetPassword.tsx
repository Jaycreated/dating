import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from '../components/forms/Input';
import { Button } from '../components/forms/Button';
import { Alert } from '../components/forms/Alert';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ResetPassword = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const token = query.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!token) return setError('Missing token');
    if (!password || password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirm) return setError('Passwords do not match');

    try {
      setLoading(true);
      const resp = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });

      if (resp.ok) {
        setSuccess('Password reset successful. Redirecting to login...');
        setTimeout(() => navigate('/login'), 1200);
      } else {
        const data = await resp.json();
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-600 mt-2">Set a new password for your account.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input id="password" name="password" type="password" label="New password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <Input id="confirm" name="confirm" type="password" label="Confirm password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />

            <Button type="submit" loading={loading} fullWidth>Set new password</Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Remembered your password?{' '}
              <button onClick={() => navigate('/login')} className="text-purple-800 font-semibold hover:underline">Sign in</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
