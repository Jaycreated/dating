import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Check } from 'lucide-react';
import { Input } from '../components/forms/Input';
import { PasswordInput } from '../components/forms/PasswordInput';
import { Button } from '../components/forms/Button';
import { Alert } from '../components/forms/Alert';
// No need to import Select since we're using the one from useForm
import { useAuth } from '../hooks/useAuth';
import { useForm } from '../hooks/useForm';
import { validators, calculatePasswordStrength } from '../utils/validation';

const Register = () => {
  const navigate = useNavigate();
  const { register, loading, error, success } = useAuth();
  const { values, errors, handleChange, validate, setFieldValue } = useForm({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    lookingFor: '',
  });
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    handleChange(e);
    setPasswordStrength(calculatePasswordStrength(password));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = validate({
      name: validators.name,
      email: validators.email,
      password: validators.password,
      confirmPassword: (value) => validators.confirmPassword(values.password, value),
      lookingFor: validators.lookingFor,
    });

    if (!isValid) return;

    try {
      await register({
        name: values.name,
        email: values.email,
        password: values.password,
        preferences: {
          lookingFor: values.lookingFor
        }
      });
    } catch (err) {
      // Error handled by useAuth hook
    }
  };

  const passwordsMatch = values.password && values.confirmPassword && values.password === values.confirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 flex items-center justify-center px-4 py-8 md:py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Start your Match Making Journey</p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="name"
              name="name"
              type="text"
              label="Full Name"
              placeholder="John Doe"
              autoComplete="name"
              required
              value={values.name}
              onChange={handleChange}
              error={errors.name}
            />

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
              <label className="block text-sm font-medium text-gray-700 mb-1">Sexual Orientation</label>
              <select
                name="lookingFor"
                value={values.lookingFor}
                onChange={(e) => setFieldValue('lookingFor', e.target.value)}
                className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border ${
                  errors.lookingFor ? 'border-red-300' : 'border-gray-300'
                } focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md`}
                required
              >
                <option value="">Select your identity</option>
                <option value="straight">Straight</option>
                <option value="gay">Gay</option>
                <option value="lesbian">Lesbian</option>
                <option value="bisexual">Bisexual</option>
                <option value="transgender">Transgender</option>
              </select>
              {errors.lookingFor && <p className="mt-1 text-sm text-red-600">{errors.lookingFor}</p>}
            </div>

            <PasswordInput
              id="password"
              name="password"
              label="Password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              value={values.password}
              onChange={handlePasswordChange}
              error={errors.password}
              showStrength
              strength={passwordStrength}
            />

            <div>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm Password"
                placeholder="••••••••"
                autoComplete="new-password"
                required
                value={values.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
              />
              {passwordsMatch && (
                <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Passwords match
                </p>
              )}
            </div>

            <Button type="submit" loading={loading || !!success} fullWidth>
              {loading ? 'Creating account...' : success ? 'Success!' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-purple-800 font-semibold hover:underline"
              >
                Sign in
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

export default Register;
