import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  AlertCircle,
  Loader2,
  Edit,
  Upload,
  Image,
  X,
  Trash2,
  Check } from
'lucide-react';
import { cn } from '@/lib/utils';
import { compressImage, formatFileSize, type CompressionResult } from '@/utils/imageCompression';

interface ProfilePictureProps {
  imageId?: number | null;
  firstName?: string;
  lastName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showFallbackIcon?: boolean;
  previewFile?: File | null;
  showLoadingState?: boolean;
  enableHover?: boolean;
  rounded?: 'full' | 'md' | 'lg' | 'xl';
  alt?: string;
  // Edit functionality props
  allowEdit?: boolean;
  onImageUpdate?: (imageId: number | null) => void;
  userId?: number;
  employeeId?: number;
  tableName?: string; // 'user_profiles' or 'employees'
  recordId?: number; // The ID of the record to update
  disabled?: boolean;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({
  imageId,
  firstName = '',
  lastName = '',
  size = 'md',
  className = '',
  showFallbackIcon = true,
  previewFile = null,
  showLoadingState = true,
  enableHover = false,
  rounded = 'full',
  alt,
  allowEdit = false,
  onImageUpdate,
  userId,
  employeeId,
  tableName,
  recordId,
  disabled = false
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);

  const maxRetries = 2;
  const { toast } = useToast();

  // Create preview URL for uploaded file
  useEffect(() => {
    if (previewFile) {
      const url = URL.createObjectURL(previewFile);
      setPreviewUrl(url);
      setImageLoaded(false);
      setImageError(false);
      setIsLoading(true);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
      setImageLoaded(false);
      setImageError(false);
      setIsLoading(false);
    }
  }, [previewFile]);

  // Reset states when imageId changes
  useEffect(() => {
    if (imageId) {
      setIsLoading(true);
      setImageLoaded(false);
      setImageError(false);
      setRetryCount(0);
    } else {
      setIsLoading(false);
      setImageLoaded(false);
      setImageError(false);
    }
  }, [imageId]);

  // Generate initials from first and last name
  const getInitials = () => {
    if (!firstName && !lastName) return 'U';

    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();

    if (firstInitial && lastInitial) {
      return `${firstInitial}${lastInitial}`;
    }

    return firstInitial || lastInitial || 'U';
  };

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-xs';
      case 'md':
        return 'w-10 h-10 text-sm';
      case 'lg':
        return 'w-16 h-16 text-lg';
      case 'xl':
        return 'w-24 h-24 text-xl';
      case '2xl':
        return 'w-32 h-32 text-2xl';
      default:
        return 'w-10 h-10 text-sm';
    }
  };

  // Get rounded classes
  const getRoundedClasses = () => {
    switch (rounded) {
      case 'md':
        return 'rounded-md';
      case 'lg':
        return 'rounded-lg';
      case 'xl':
        return 'rounded-xl';
      case 'full':
      default:
        return 'rounded-full';
    }
  };

  // Get image URL if imageId exists
  const getImageUrl = () => {
    if (!imageId) return undefined;
    const timestamp = Date.now();

    // Handle different types of imageId values
    if (typeof imageId === 'string' && imageId.startsWith('http')) {
      // If imageId is already a complete URL, use it directly
      return imageId;
    }

    // Otherwise, construct the API URL
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/files/${imageId}?t=${timestamp}`;
  };

  // Determine which image to show (preview takes priority)
  const imageToShow = previewUrl || getImageUrl();

  // Handle image load success
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    setIsLoading(false);
  };

  // Handle image load error with retry logic
  const handleImageError = () => {
    setImageLoaded(false);
    setIsLoading(false);

    if (retryCount < maxRetries && imageId) {
      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        setImageError(false);
        setIsLoading(true);
      }, 1000 + retryCount * 500);
    } else {
      setImageError(true);
    }
  };

  // Handle image load start
  const handleImageLoadStart = () => {
    if (showLoadingState) {
      setIsLoading(true);
    }
  };

  // Determine if we should show fallback
  const shouldShowFallback = !imageToShow || imageError || !imageLoaded && !isLoading;

  // Get fallback icon size
  const getFallbackIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-3 h-3';
      case 'md':
        return 'w-4 h-4';
      case 'lg':
        return 'w-6 h-6';
      case 'xl':
        return 'w-8 h-8';
      case '2xl':
        return 'w-12 h-12';
      default:
        return 'w-4 h-4';
    }
  };

  // Get edit button size
  const getEditButtonSize = () => {
    switch (size) {
      case 'sm':
        return 'w-6 h-6';
      case 'md':
        return 'w-7 h-7';
      case 'lg':
        return 'w-8 h-8';
      case 'xl':
        return 'w-10 h-10';
      case '2xl':
        return 'w-12 h-12';
      default:
        return 'w-7 h-7';
    }
  };

  // Generate alt text
  const getAltText = () => {
    if (alt) return alt;
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim() || 'Profile picture';
    }
    return 'Profile picture';
  };

  // Validate file
  const validateFile = (file: File): boolean => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size must be less than 5MB",
        variant: "destructive"
      });
      return false;
    }

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

  // Process file with compression
  const processFile = async (file: File) => {
    setIsCompressing(true);

    try {
      const result = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 800,
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

      return result.file;
    } catch (error) {
      console.error('Compression failed:', error);
      toast({
        title: "Optimization failed",
        description: "Using original file instead",
        variant: "destructive"
      });
      return file;
    } finally {
      setIsCompressing(false);
    }
  };

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && validateFile(file)) {
      const processedFile = await processFile(file);
      setSelectedFile(processedFile);
    }

    // Reset input
    event.target.value = '';
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      const { data: fileId, error } = await window.ezsite.apis.upload({
        filename: selectedFile.name,
        file: selectedFile
      });

      if (error) throw error;

      // Update the record with the new image ID
      if (tableName && recordId) {
        const updateData: any = { ID: recordId };

        if (tableName === 'employees') {
          updateData.profile_image_id = fileId;
        } else if (tableName === 'user_profiles') {
          updateData.profile_image_id = fileId;
        }

        const tableId = tableName === 'employees' ? '11727' : '11725';
        const { error: updateError } = await window.ezsite.apis.tableUpdate(tableId, updateData);

        if (updateError) throw updateError;
      }

      // Call the update callback
      if (onImageUpdate) {
        onImageUpdate(fileId);
      }

      toast({
        title: "Upload successful",
        description: "Profile picture updated successfully"
      });

      // Close dialog and reset state
      setIsEditDialogOpen(false);
      setSelectedFile(null);
      setCompressionResult(null);

    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle image removal
  const handleRemove = async () => {
    try {
      setIsUploading(true);

      if (tableName && recordId) {
        const updateData: any = { ID: recordId };

        if (tableName === 'employees') {
          updateData.profile_image_id = null;
        } else if (tableName === 'user_profiles') {
          updateData.profile_image_id = null;
        }

        const tableId = tableName === 'employees' ? '11727' : '11725';
        const { error: updateError } = await window.ezsite.apis.tableUpdate(tableId, updateData);

        if (updateError) throw updateError;
      }

      // Call the update callback
      if (onImageUpdate) {
        onImageUpdate(null);
      }

      toast({
        title: "Image removed",
        description: "Profile picture removed successfully"
      });

      // Close dialog and reset state
      setIsEditDialogOpen(false);
      setSelectedFile(null);
      setCompressionResult(null);

    } catch (error) {
      console.error('Remove failed:', error);
      toast({
        title: "Remove failed",
        description: error instanceof Error ? error.message : "Failed to remove image",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const avatarClasses = cn(
    getSizeClasses(),
    getRoundedClasses(),
    'border-2 border-gray-200 transition-all duration-200',
    enableHover && 'hover:border-blue-300 hover:shadow-md cursor-pointer',
    className
  );

  const fallbackClasses = cn(
    'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 font-medium',
    'flex items-center justify-center',
    imageError && 'bg-red-50 text-red-400'
  );

  return (
    <div className="relative inline-block group">
      <Avatar className={avatarClasses}>
        {/* Loading skeleton overlay */}
        {isLoading && showLoadingState &&
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-full">
            <Loader2 className={cn(getFallbackIconSize(), 'animate-spin text-gray-400')} />
          </div>
        }

        {/* Main image */}
        {imageToShow &&
        <AvatarImage
          src={imageToShow}
          alt={getAltText()}
          className={cn(
            'object-cover transition-opacity duration-200',
            isLoading && showLoadingState && 'opacity-0',
            imageLoaded && 'opacity-100'
          )}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onLoadStart={handleImageLoadStart} />

        }

        {/* Fallback content */}
        {shouldShowFallback &&
        <AvatarFallback className={fallbackClasses}>
            {imageError ?
          <div className="flex flex-col items-center justify-center space-y-1">
                <AlertCircle className={getFallbackIconSize()} />
                {(size === 'xl' || size === '2xl') &&
            <span className="text-xs text-center">Error</span>
            }
              </div> :

          getInitials() !== 'U' ?
          <span className="font-semibold tracking-wider">
                  {getInitials()}
                </span> :

          showFallbackIcon ?
          <User className={getFallbackIconSize()} /> :

          <span className="font-semibold">U</span>


          }
          </AvatarFallback>
        }
      </Avatar>

      {/* Edit button */}
      {allowEdit && !disabled &&
      <Button
        type="button"
        size="sm"
        variant="default"
        onClick={() => setIsEditDialogOpen(true)}
        className={cn(
          'absolute -bottom-1 -right-1 rounded-full p-0 shadow-lg bg-blue-600 hover:bg-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200',
          getEditButtonSize()
        )}>

          <Edit className="w-3 h-3" />
        </Button>
      }

      {/* Loading indicator for large sizes */}
      {isLoading && showLoadingState && (size === 'xl' || size === '2xl') &&
      <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
          <Loader2 className="w-3 h-3 animate-spin text-white" />
        </div>
      }

      {/* Error indicator */}
      {imageError && (size === 'xl' || size === '2xl') &&
      <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1">
          <AlertCircle className="w-3 h-3 text-white" />
        </div>
      }

      {/* Preview indicator */}
      {previewFile &&
      <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
        </div>
      }

      {/* Edit Dialog */}
      {allowEdit &&
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Edit Profile Picture
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Current picture preview */}
              <div className="flex justify-center">
                <Avatar className="w-24 h-24 border-2 border-gray-200">
                  {selectedFile ?
                <AvatarImage
                  src={URL.createObjectURL(selectedFile)}
                  alt="New profile picture"
                  className="object-cover" /> :

                imageToShow ?
                <AvatarImage
                  src={imageToShow}
                  alt={getAltText()}
                  className="object-cover" /> :


                <AvatarFallback className={fallbackClasses}>
                      {getInitials() !== 'U' ?
                  <span className="font-semibold tracking-wider text-lg">
                          {getInitials()}
                        </span> :

                  <User className="w-8 h-8" />
                  }
                    </AvatarFallback>
                }
                </Avatar>
              </div>

              {/* Upload area */}
              <Card className="cursor-pointer hover:bg-gray-50 transition-colors border-dashed border-2">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="p-4 bg-blue-100 rounded-full">
                      <Upload className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Choose Profile Picture</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Click here to select an image
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

              {/* Selected file info */}
              {selectedFile &&
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-800">New picture selected:</p>
                  <p className="text-sm text-green-600">{selectedFile.name}</p>
                  {compressionResult &&
              <p className="text-xs text-green-500 mt-1">
                      {compressionResult.wasCompressed ?
                `Optimized to ${formatFileSize(compressionResult.compressedSize)}` :
                `File size: ${formatFileSize(compressionResult.originalSize)}`
                }
                    </p>
              }
                </div>
            }

              {/* Action buttons */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('profile-picture-input')?.click()}
                  disabled={isUploading || isCompressing}>

                    <Upload className="w-4 h-4 mr-2" />
                    Select Image
                  </Button>
                  
                  {(imageId || selectedFile) &&
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemove}
                  disabled={isUploading || isCompressing}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50">

                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                }
                </div>
                
                <div className="flex space-x-2">
                  <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isUploading || isCompressing}>

                    Cancel
                  </Button>
                  
                  <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading || isCompressing}>

                    {isUploading ?
                  <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </> :

                  <>
                        <Check className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                  }
                  </Button>
                </div>
              </div>

              {/* File requirements */}
              <div className="text-center text-sm text-gray-500 space-y-1">
                <p>Supported formats: JPG, PNG, GIF</p>
                <p>Maximum file size: 5MB</p>
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
      }

      {/* Hidden file input */}
      <input
        id="profile-picture-input"
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden" />

    </div>);

};

export default ProfilePicture;