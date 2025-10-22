export const validators = {
  email: (value: string): string | undefined => {
    if (!value) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  },

  password: (value: string, minLength = 6): string | undefined => {
    if (!value) return 'Password is required';
    if (value.length < minLength) {
      return `Password must be at least ${minLength} characters`;
    }
    return undefined;
  },

  name: (value: string, minLength = 2): string | undefined => {
    if (!value.trim()) return 'Name is required';
    if (value.trim().length < minLength) {
      return `Name must be at least ${minLength} characters`;
    }
    return undefined;
  },

  confirmPassword: (password: string, confirmPassword: string): string | undefined => {
    if (!confirmPassword) return 'Please confirm your password';
    if (password !== confirmPassword) return 'Passwords do not match';
    return undefined;
  },
};

export const calculatePasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.length >= 10) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z\d]/.test(password)) strength++;
  return strength;
};
