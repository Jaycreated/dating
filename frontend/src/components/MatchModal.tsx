import { motion } from 'framer-motion';
import { X, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MatchModalProps {
  matchedUser: {
    id: number;
    name: string;
    photos: string[];
  } | null;
  onClose: () => void;
}

const MatchModal = ({ matchedUser, onClose }: MatchModalProps) => {
  const navigate = useNavigate();
  
  if (!matchedUser) return null;

  const handleChatClick = () => {
    onClose();
    navigate(`/chat/${matchedUser.id}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
      <motion.div 
        className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 text-center relative overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 30 }}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        {/* Match content */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-pink-500">It's a match!</h2>
          <p className="text-gray-600">You and {matchedUser.name} have liked each other</p>
          
          <div className="flex justify-center items-center space-x-8 my-6">
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-pink-400">
                <img 
                  src={matchedUser.photos?.[0] || '/default-avatar.png'} 
                  alt={matchedUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1">
                <div className="bg-green-400 w-6 h-6 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-pink-400">
                <img 
                  src="/default-avatar.png" 
                  alt="You"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1">
                <div className="bg-green-400 w-6 h-6 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handleChatClick}
              className="w-full bg-[#651B55] text-white font-medium py-3 px-6 rounded-[24px] flex items-center justify-center space-x-2"
            >
              <MessageCircle size={20} />
              <span>Say Hello</span>
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-[24px]"
            >
              Keep Swiping
            </button>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-pink-200 rounded-full opacity-20"></div>
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-purple-200 rounded-full opacity-20"></div>
      </motion.div>
    </div>
  );
};

export default MatchModal;
