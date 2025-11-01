import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
}

export const Button = ({
  size,
  children,
  loading,
  variant = 'primary',
  fullWidth,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles = 'font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';
  
  const variantStyles = {
    primary: 'bg-purple-800 hover:bg-purple-900 text-white hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none',
    secondary: 'bg-white hover:bg-gray-50 text-purple-800 border-2 border-purple-800',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};
