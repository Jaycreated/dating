import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Upload, X, Loader } from 'lucide-react';
import { Button } from '../components/forms/Button';
import { Alert } from '../components/forms/Alert';
import { userAPI } from '../services/api';
import { uploadToCloudinary, validateImageFile } from '../utils/cloudinary';

const UploadPhotos = () => {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<string[]>(['', '']);
  const [uploading, setUploading] = useState<boolean[]>([false, false]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const handleFileSelect = async (index: number, file: File | null) => {
    if (!file) return;

    setError('');

    // Validate file
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Set uploading state
    const newUploading = [...uploading];
    newUploading[index] = true;
    setUploading(newUploading);

    try {
      // Upload to Cloudinary
      const result = await uploadToCloudinary(file);

      // Update photos array
      const newPhotos = [...photos];
      newPhotos[index] = result.secure_url;
      setPhotos(newPhotos);
    } catch (err) {
      setError('Failed to upload image. Please try again.');
    } finally {
      const newUploading = [...uploading];
      newUploading[index] = false;
      setUploading(newUploading);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos[index] = '';
    setPhotos(newPhotos);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check if at least 2 photos are uploaded
    const uploadedPhotos = photos.filter((photo) => photo !== '');
    if (uploadedPhotos.length < 2) {
      setError('Please upload at least 2 photos');
      return;
    }

    setLoading(true);

    try {
      await userAPI.updateProfile({
        photos: uploadedPhotos,
      });

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to save photos. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
      {/* Header with Logo */}
      {/* <div className="p-6">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
          <span className="text-xl font-bold text-gray-900">Pairfect</span>
        </div>
      </div> */}

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-xl font-[26px] text-gray-900 mb-2">
            Add your first 2 photos
          </h1>
          <p className="text-gray-600">
            Make it easier for your match to find you
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <Alert type="error" message={error} />}

          {/* Photo Upload Boxes */}
          <div className="flex justify-center md:gap-6 gap-2 w-full">
            {[0, 1].map((index) => (
              <div key={index} className="relative w-40">
                <input
                  ref={fileInputRefs[index]}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(index, e.target.files?.[0] || null)}
                />

                {photos[index] ? (
                  // Show uploaded photo
                  <div className="relative w-40 lg:w-48 lg:h-64 md:w-48 md:h-64 h-48 rounded-2xl overflow-hidden border-2 border-gray-200 shadow-md group">
                    <img
                      src={photos[index]}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  // Show upload placeholder
                  <button
                    type="button"
                    onClick={() => fileInputRefs[index].current?.click()}
                    disabled={uploading[index]}
                    className="w-full md:w-48 h-60 md:h-64 rounded-2xl border-2 border-dashed border-gray-300 hover:border-purple-400 bg-white hover:bg-purple-50 transition-all flex flex-col items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading[index] ? (
                      <>
                        <Loader className="w-8 h-8 text-purple-600 animate-spin" />
                        <span className="text-sm text-gray-600">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-600 font-medium">
                          Upload your image
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Continue Button */}
          <div className="pt-8">
            <Button
              type="submit"
              loading={loading}
              fullWidth
              disabled={photos.filter((p) => p !== '').length < 2}
            >
              Continue
            </Button>
          </div>
        </form>

        {/* Progress indicator */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-1 bg-purple-600 rounded-full"></div>
            <div className="w-8 h-1 bg-purple-600 rounded-full"></div>
            <div className="w-8 h-1 bg-purple-600 rounded-full"></div>
          </div>
          <p className="text-sm text-gray-600">Step 3 of 3</p>
        </div>
      </div>
    </div>
  );
};

export default UploadPhotos;
