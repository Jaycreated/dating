import { useState } from 'react';
import { MapPin, Heart, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SwipeCardProps {
  user: {
    id: number;
    name: string;
    age: number;
    bio?: string;
    location?: string;
    photos: string[];
    interests?: string[];
    preferences?: {
      lookingFor?: 'relationship' | 'casual' | 'hookup' | 'chat';
      [key: string]: any;
    };
  };
  onLike: () => void;
  onPass: () => void;
}

export const SwipeCard = ({ user, onLike, onPass }: SwipeCardProps) => {
  console.log('=== SWIPE CARD RENDER ===');
  console.log('SwipeCard user data:', {
    id: user.id,
    name: user.name,
    location: user.location,
    interests: user.interests,
    hasPhotos: user.photos && user.photos.length > 0,
    photoCount: user.photos?.length || 0,
    allProps: user
  });
  console.log('Component props:', { onLike, onPass });
  
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    console.log('=== CARD CLICK EVENT ===');
    console.log('User ID:', user.id);
    console.log('Is dragging:', isDragging);
    console.log('Event target:', e.target);
    
    if (isDragging) {
      console.log('Preventing navigation due to drag action');
      e.preventDefault();
      return;
    }
    
    console.log('Attempting to navigate to profile with ID:', user.id);
    console.log('Current path:', window.location.pathname);
    console.log('Navigation target URL:', `/profile/${user.id}`);
    
    try {
      navigate(`/profile/${user.id}`);
      console.log('Navigation initiated successfully');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const photos =
    user.photos && user.photos.length > 0
      ? user.photos
      : ['https://via.placeholder.com/400x600?text=No+Photo'];
      
  // Get interest from preferences.interestedIn (fallback to lookingFor for backward compatibility)
  const userInterest = user.preferences?.interestedIn || user.preferences?.lookingFor || '';
  
  // Map the interest ID to a display label
  type InterestType = 'relationship' | 'casual' | 'hookup' | 'chat' | 'dating' | 'friends' | 'networking' | 'something_casual';
  const interestMap: Record<InterestType, string> = {
    relationship: 'Looking for a relationship',
    casual: 'Casual friendship',
    hookup: 'Looking to hookup',
    chat: 'Chat buddy',
    dating: 'Looking to date',
    friends: 'Looking for friends',
    networking: 'Networking',
    something_casual: 'Something casual'
  };
  
  const interestDisplay = interestMap[userInterest as InterestType] || '';
  
  console.log('Processed photos:', photos);
  console.log('User preferences:', user.preferences);
  console.log('User interest:', userInterest);
  console.log('User location:', user.location);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const offsetX = e.clientX - dragStart.x;
    const offsetY = e.clientY - dragStart.y;
    setDragOffset({ x: offsetX, y: offsetY });
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (Math.abs(dragOffset.x) > 100) {
      if (dragOffset.x > 0) {
        onLike();
      } else {
        onPass();
      }
    }

    setDragOffset({ x: 0, y: 0 });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const offsetX = e.touches[0].clientX - dragStart.x;
    const offsetY = e.touches[0].clientY - dragStart.y;
    setDragOffset({ x: offsetX, y: offsetY });
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const rotation = dragOffset.x * 0.1;
  const opacity = 1 - Math.abs(dragOffset.x) / 300;

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Swipeable Card */}
      <div
        className="relative bg-white shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none w-full"
        style={{
          height: 400,
          borderRadius: 24,
          padding: 10,
          opacity: 1,
          transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`,
          transition: isDragging ? 'none' : 'all 0.3s ease-out',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
      >

        {/* Photo */}
        <div className="relative h-[500px]">
          <img
            src={photos[currentPhotoIndex]}
            alt={user.name}
            className="w-full h-full object-cover"
            draggable={false}
          />

          {/* Photo indicators */}
          {photos.length > 1 && (
            <div className="absolute top-4 left-0 right-0 flex justify-center gap-2 px-4">
              {photos.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-all ${index === currentPhotoIndex ? 'bg-white' : 'bg-white/40'
                    }`}
                />
              ))}
            </div>
          )}

          {/* Navigation zones */}
          {photos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-0 top-0 bottom-0 w-1/3"
                aria-label="Previous photo"
              />
              <button
                onClick={nextPhoto}
                className="absolute right-0 top-0 bottom-0 w-1/3"
                aria-label="Next photo"
              />
            </>
          )}
        </div>

        {/* Swipe indicators */}
        {dragOffset.x > 50 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform rotate-12">
            <div className="bg-green-500 text-white px-8 py-4 rounded-2xl font-bold text-2xl border-4 border-white shadow-xl">
              LIKE
            </div>
          </div>
        )}
        {dragOffset.x < -50 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform -rotate-12">
            <div className="bg-red-500 text-white px-8 py-4 rounded-2xl font-bold text-2xl border-4 border-white shadow-xl">
              NOPE
            </div>
          </div>
        )}
      </div>

      {/* User Info - Now below the card */}
      <div
        className="p-6 mt-16px cursor-pointer"
        onClick={() => navigate(`/profile/${user.id}`)}
      >
        <h2 className="text-xl font-bold mb-1 text-[#651B55]">
          {user.name}, {user.age}
        </h2>

        <div className="space-y-1">
          {user.location && (
            <div className="flex items-center gap-2 text-[#651B55] text-sm">
              <MapPin className="w-4 h-4" />
              <span>{user.location}</span>
            </div>
          )}
          {interestDisplay && (
            <div className="flex items-center gap-2 text-[#651B55] text-sm">
              <Heart className="w-4 h-4" />
              <span>{interestDisplay}</span>
            </div>
          )}
        </div>

       
        {user.interests && user.interests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {user.interests.slice(0, 3).map((interest, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={onPass}
          className="w-[56px] h-[56px] p-[16px] rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform border-2 bg-[#E03131]"
        >
          <X className="w-8 h-8 text-red-500" />
        </button>

        <button
          onClick={onLike}
          className="w-[56px] h-[56px] p-[16px] bg-[#FFCFF4] rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform border-2"
        >
          <Heart className="w-8 h-8 " />
        </button>
      </div>
    </div>
  );
};
