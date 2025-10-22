import { useNavigate } from 'react-router-dom';
import { Heart, Sparkles } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 relative overflow-hidden">
      {/* Decorative floating hearts */}
      <div className="absolute top-20 left-10 animate-bounce">
        <Heart className="w-8 h-8 text-pink-400 fill-pink-400" />
      </div>
      <div className="absolute top-40 right-20 animate-pulse">
        <Sparkles className="w-6 h-6 text-purple-400" />
      </div>
      <div className="absolute bottom-40 left-1/4 animate-bounce delay-100">
        <Heart className="w-6 h-6 text-pink-300 fill-pink-300" />
      </div>
      <div className="absolute top-60 right-1/3 animate-pulse delay-200">
        <Sparkles className="w-8 h-8 text-pink-400" />
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center justify-center pt-12">
          <div className="mb-4">
            <div className="relative w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center">
              <svg
                viewBox="0 0 100 100"
                className="w-14 h-14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M30 45C30 35 35 25 45 25C50 25 53 28 55 32C57 28 60 25 65 25C75 25 80 35 80 45C80 60 55 75 55 75C55 75 30 60 30 45Z"
                  fill="#ec4899"
                  className="animate-pulse"
                />
                <circle cx="50" cy="50" r="35" stroke="#c026d3" strokeWidth="3" strokeDasharray="5,5" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-16">Pairfect</h1>
        </div>

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 leading-tight">
            Match Simply
          </h2>
          <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Ready to find your match?
          </h3>
          <p className="text-lg text-gray-700 mb-10">
            Where real people connect & match simply
          </p>

          {/* CTA Button */}
          <button
            onClick={() => navigate('/register')}
            className="bg-purple-800 hover:bg-purple-900 text-white font-semibold px-10 py-4 rounded-full text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
          >
            Let's meet your match
          </button>
        </div>

        {/* Profile Cards */}
        <div className="max-w-3xl mx-auto mt-16 relative">
          <div className="flex items-center justify-center gap-8">
            {/* Left Card - Jerry */}
            <div className="relative transform -rotate-6 hover:rotate-0 transition-transform duration-300">
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-64 h-80">
                <div className="h-72 bg-gradient-to-br from-gray-200 to-gray-300 relative">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop"
                    alt="Jerry"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 bg-white">
                  <p className="text-xl font-semibold text-gray-900">Jerry</p>
                </div>
              </div>
            </div>

            {/* Heart Icon */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="bg-white rounded-full p-4 shadow-2xl animate-pulse">
                <Heart className="w-12 h-12 text-red-500 fill-red-500" />
              </div>
            </div>

            {/* Right Card - Jessica */}
            <div className="relative transform rotate-6 hover:rotate-0 transition-transform duration-300">
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-64 h-80">
                <div className="h-72 bg-gradient-to-br from-gray-200 to-gray-300 relative">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop"
                    alt="Jessica"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 bg-white">
                  <p className="text-xl font-semibold text-gray-900">Jessica</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Login Link */}
        <div className="text-center mt-12">
          <p className="text-gray-700">
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
    </div>
  );
};

export default LandingPage;
