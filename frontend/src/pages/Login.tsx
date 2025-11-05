import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Input } from '../components/forms/Input';
import { PasswordInput } from '../components/forms/PasswordInput';
import { Button } from '../components/forms/Button';
import { Alert } from '../components/forms/Alert';
import { useAuth } from '../hooks/useAuth';
import { useForm } from '../hooks/useForm';
import { validators } from '../utils/validation';

const Login = () => {
  const navigate = useNavigate();
  const { login, loading, error, success } = useAuth();
  const { values, errors, handleChange, validate } = useForm({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = validate({
      email: validators.email,
      password: validators.password,
    });

    if (!isValid) return;

    try {
      await login(values.email, values.password);
    } catch (err) {
      // Error handled by useAuth hook
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to continue matching</p>
        </div>

        {/* Login Form */}
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
              value={values.email}
              onChange={handleChange}
              error={errors.email}
            />

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Password</span>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <PasswordInput
                id="password"
                name="password"
                label=""
                placeholder="••••••••"
                autoComplete="current-password"
                required
                value={values.password}
                onChange={handleChange}
                error={errors.password}
              />
            </div>

            <Button type="submit" loading={loading || !!success} fullWidth>
              {loading ? 'Signing in...' : success ? 'Success!' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-purple-800 font-semibold hover:underline"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
