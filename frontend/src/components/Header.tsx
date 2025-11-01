import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  User,
  MessageSquare,
  Heart,
  Compass,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './forms/Button';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: 'Discover', path: '/swipe', icon: Compass },
  { name: 'Matches', path: '/matches', icon: Heart },
  { name: 'Chats', path: '/chats', icon: MessageSquare },
  { name: 'Profile', path: '/profile', icon: User },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <header className="bg-white sticky top-0 z-50 py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center h-16 px-6">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <img
                  src="/images/Pairfect logo.png"
                  alt="Pairfect Logo"
                  className="h-10 w-auto"
                />
                <span className="ml-2 text-xl font-semibold text-[#000000] hidden sm:block">
                  Pairfect
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center border border-black rounded-full px-4 py-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-full ${
                    location.pathname === item.path
                      ? 'bg-black text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-1.5" />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
                aria-expanded={isMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/settings"
                    className="p-1 rounded-full text-gray-500 hover:text-gray-700"
                    title="Settings"
                  >
                    <Settings className="h-6 w-6" />
                  </Link>
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    className="text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="h-5 w-5 mr-1" />
                    Logout
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/login')}
                    className="border border-gray-300"
                  >
                    Log in
                  </Button>
                  <Button onClick={() => navigate('/register')}>Sign up</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  location.pathname === item.path
                    ? 'bg-purple-50 border-purple-500 text-purple-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center">
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </div>
              </Link>
            ))}

            {user ? (
              <>
                <Link
                  to="/settings"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <Settings className="h-5 w-5 mr-3" />
                    Settings
                  </div>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-red-600 hover:bg-red-50 hover:border-red-300"
                >
                  <div className="flex items-center">
                    <LogOut className="h-5 w-5 mr-3" />
                    Logout
                  </div>
                </button>
              </>
            ) : (
              <div className="px-4 pt-2 pb-3 space-y-2">
                <Button
                  fullWidth
                  variant="ghost"
                  className="border border-gray-300"
                  onClick={() => {
                    navigate('/login');
                    setIsMenuOpen(false);
                  }}
                >
                  Log in
                </Button>
                <Button
                  fullWidth
                  onClick={() => {
                    navigate('/register');
                    setIsMenuOpen(false);
                  }}
                >
                  Sign up
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
