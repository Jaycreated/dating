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
  };
  onLike: () => void;
  onPass: () => void;
}

export const SwipeCard = ({ user, onLike, onPass }: SwipeCardProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if user is trying to drag/swipe
    if (isDragging) {
      e.preventDefault();
      return;
    }
    // Navigate to the user's public profile
    navigate(`/profile/${user.id}`);
  };

  const photos = user.photos && user.photos.length > 0 
    ? user.photos 
    : ['https://via.placeholder.com/400x600?text=No+Photo'];

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

    // If dragged far enough, trigger action
    if (Math.abs(dragOffset.x) > 100) {
      if (dragOffset.x > 0) {
        onLike();
      } else {
        onPass();
      }
    }

    // Reset position
    setDragOffset({ x: 0, y: 0 });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStart({ 
      x: e.touches[0].clientX, 
      y: e.touches[0].clientY 
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
      <div
        className="relative bg-white rounded-3xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
        style={{
          transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`,
          opacity: opacity,
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
        onKeyDown={(e) => e.key === 'Enter' && handleCardClick(e as any)}
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
                  className={`h-1 flex-1 rounded-full transition-all ${
                    index === currentPhotoIndex
                      ? 'bg-white'
                      : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Photo navigation */}
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

          {/* Gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />
        </div>

        {/* User Info - Wrapped in a clickable div that navigates to profile */}
        <div 
          className="absolute bottom-0 left-0 right-0 p-6 text-white cursor-pointer"
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering the parent's onClick
            navigate(`/profile/${user.id}`);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate(`/profile/${user.id}`)}
        >
          <h2 className="text-3xl font-bold mb-2">
            {user.name}, {user.age}
          </h2>

          {user.location && (
            <div className="flex items-center gap-2 text-sm mb-2">
              <MapPin className="w-4 h-4" />
              <span>{user.location}</span>
            </div>
          )}

          {user.bio && (
            <p className="text-sm opacity-90 line-clamp-2 mb-3">
              {user.bio}
            </p>
          )}

          {user.interests && user.interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {user.interests.slice(0, 3).map((interest, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs"
                >
                  {interest}
                </span>
              ))}
            </div>
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

      {/* Action Buttons */}
      <div className="flex justify-center gap-6 mt-8">
        <button
          onClick={onPass}
          className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform border-2 border-red-500"
          aria-label="Pass"
        >
          <X className="w-8 h-8 text-red-500" />
        </button>

        <button
          onClick={onLike}
          className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform border-2 border-green-500"
          aria-label="Like"
        >
          <Heart className="w-8 h-8 text-green-500" />
        </button>
      </div>
    </div>
  );
};
