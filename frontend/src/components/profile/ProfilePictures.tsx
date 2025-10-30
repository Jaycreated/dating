import { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useToast } from '../ui/use-toast';
import { userAPI } from '../../services/api';

export default function ProfilePictures({ photos: initialPhotos, onUpdate }: { photos: string[], onUpdate: () => void }) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos || []);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setPhotos(initialPhotos || []);
  }, [initialPhotos]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (JPEG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'dating-app/profiles');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const newPhotos = [...photos, data.secure_url];
      
      // Update user's photos in the database
      await userAPI.updateProfile({ photos: newPhotos });
      setPhotos(newPhotos);
      onUpdate();
      
      toast({
        title: 'Success',
        description: 'Photo uploaded successfully',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading your photo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async (index: number) => {
    if (photos.length <= 1) {
      toast({
        title: 'Cannot remove',
        description: 'You must have at least one profile photo',
        variant: 'destructive',
      });
      return;
    }

    if (window.confirm('Are you sure you want to remove this photo?')) {
      setIsRemoving(index);
      try {
        const newPhotos = [...photos];
        newPhotos.splice(index, 1);
        
        await userAPI.updateProfile({ photos: newPhotos });
        setPhotos(newPhotos);
        onUpdate();
        
        toast({
          title: 'Success',
          description: 'Photo removed successfully',
        });
      } catch (error) {
        console.error('Remove error:', error);
        toast({
          title: 'Error',
          description: 'Failed to remove photo',
          variant: 'destructive',
        });
      } finally {
        setIsRemoving(null);
      }
    }
  };

  const handleSetAsPrimary = (index: number) => {
    if (index === 0) return; // Already primary
    
    const newPhotos = [...photos];
    const [movedPhoto] = newPhotos.splice(index, 1);
    newPhotos.unshift(movedPhoto);
    
    userAPI.updateProfile({ photos: newPhotos })
      .then(() => {
        setPhotos(newPhotos);
        onUpdate();
        toast({
          title: 'Success',
          description: 'Primary photo updated',
        });
      })
      .catch(error => {
        console.error('Update error:', error);
        toast({
          title: 'Error',
          description: 'Failed to update primary photo',
          variant: 'destructive',
        });
      });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Profile Photos</h3>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            disabled={isUploading}
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Photo
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div key={index} className="relative group">
            <div className="aspect-square rounded-lg overflow-hidden border-2 border-transparent group-hover:border-primary transition-colors">
              <img
                src={photo}
                alt={`Profile ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  Main
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {index !== 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={() => handleSetAsPrimary(index)}
                    disabled={isRemoving === index}
                  >
                    Set as Main
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                  onClick={() => handleRemovePhoto(index)}
                  disabled={isRemoving === index}
                >
                  {isRemoving === index ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}

        {photos.length < 6 && (
          <div 
            className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center p-4">
              <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Add Photo</p>
              <p className="text-xs text-muted-foreground">
                {6 - photos.length} remaining
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
