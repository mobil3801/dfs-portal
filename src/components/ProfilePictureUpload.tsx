import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Image, Loader2, Edit, X, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { compressImage, formatFileSize, isImageFile, type CompressionResult } from '@/utils/imageCompression';
import ProfilePicture from '@/components/ProfilePicture';

interface ProfilePictureUploadProps {
  onFileSelect: (file: File | null) => void;
  firstName?: string;
  lastName?: string;
  imageId?: number | null;
  previewFile?: File | null;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
  showRemoveButton?: boolean;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  onFileSelect,
  firstName = '',
  lastName = '',
  imageId,
  previewFile,
  maxSize = 5,
  className = '',
  disabled = false,
  showRemoveButton = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `File size must be less than ${maxSize}MB`,
        variant: "destructive"
      });
      return false;
    }

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, GIF)",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const processFile = async (file: File) => {
    setIsCompressing(true);

    try {
      // Always try to optimize images for profile pictures
      const result = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 800, // Good size for profile pictures
        quality: 0.85,
        initialQuality: 0.85
      });

      setCompressionResult(result);

      if (result.wasCompressed) {
        toast({
          title: "Image optimized",
          description: `File size reduced from ${formatFileSize(result.originalSize)} to ${formatFileSize(result.compressedSize)}`,
          duration: 5000
        });
      }

      onFileSelect(result.file);
      setIsOpen(false);
    } catch (error) {
      console.error('Compression failed:', error);
      toast({
        title: "Optimization failed",
        description: "Using original file instead",
        variant: "destructive"
      });
      onFileSelect(file);
      setIsOpen(false);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && validateFile(file)) {
      await processFile(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onFileSelect(null);
    toast({
      title: "Profile picture removed",
      description: "The profile picture will be removed when you save."
    });
  };

  const hasImage = imageId || previewFile;

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Profile Picture Display */}
      <div className="relative group">
        <ProfilePicture
          imageId={imageId}
          firstName={firstName}
          lastName={lastName}
          size="xl"
          className="border-4 border-gray-200 transition-all group-hover:border-blue-300"
          previewFile={previewFile} />

        
        {/* Edit overlay button */}
        <Button
          type="button"
          size="sm"
          variant="default"
          onClick={() => setIsOpen(true)}
          disabled={disabled}
          className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 shadow-lg bg-blue-600 hover:bg-blue-700">

          <Edit className="w-4 h-4" />
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          disabled={disabled}
          className="flex items-center space-x-2">

          <Upload className="w-4 h-4" />
          <span>{hasImage ? 'Change Picture' : 'Upload Picture'}</span>
        </Button>
        
        {showRemoveButton && hasImage &&
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRemove}
          disabled={disabled}
          className="text-red-600 hover:text-red-700 hover:bg-red-50">

            <Trash2 className="w-4 h-4" />
          </Button>
        }
      </div>

      {/* Preview info */}
      {previewFile &&
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 w-full max-w-sm">
          <p className="text-sm font-medium text-blue-800">New picture selected:</p>
          <p className="text-sm text-blue-600">{previewFile.name}</p>
          <p className="text-xs text-blue-500 mt-1">
            This will replace the current picture when saved.
          </p>
        </div>
      }

      {/* Upload Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Upload Profile Picture
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current picture preview */}
            <div className="flex justify-center">
              <ProfilePicture
                imageId={imageId}
                firstName={firstName}
                lastName={lastName}
                size="lg"
                className="border-2 border-gray-200"
                previewFile={previewFile} />

            </div>

            {/* Upload area */}
            <Card
              className="cursor-pointer hover:bg-gray-50 transition-colors border-dashed border-2"
              onClick={() => fileInputRef.current?.click()}>

              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="p-4 bg-blue-100 rounded-full">
                    <Upload className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Choose Profile Picture</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Click here or drag and drop an image
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compression status */}
            {isCompressing &&
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">Optimizing image...</p>
                      <p className="text-sm text-blue-600">Preparing for upload</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            }

            {/* File requirements */}
            <div className="text-center text-sm text-gray-500 space-y-1">
              <p>Supported formats: JPG, PNG, GIF</p>
              <p>Maximum file size: {maxSize}MB</p>
              <p>Recommended: Square image, at least 200x200 pixels</p>
              
              <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <Image className="h-4 w-4" />
                  <span className="text-xs font-medium">Images are automatically optimized</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden" />

    </div>);

};

export default ProfilePictureUpload;