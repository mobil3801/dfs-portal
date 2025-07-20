import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  X,
  Eye,
  Download,
  AlertCircle,
  Image,
  Loader2 } from
'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentPreviewProps {
  file?: File | null;
  fileId?: number | null;
  fileName?: string;
  documentName?: string;
  className?: string;
  onRemove?: () => void;
  showRemoveButton?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  aspectRatio?: 'square' | 'landscape' | 'auto';
  showDownload?: boolean;
  showFullscreen?: boolean;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  file,
  fileId,
  fileName,
  documentName = 'Document',
  className = '',
  onRemove,
  showRemoveButton = true,
  disabled = false,
  size = 'lg',
  aspectRatio = 'landscape',
  showDownload = false,
  showFullscreen = true
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isImage, setIsImage] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  // Create preview URL for uploaded file
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setIsImage(file.type.startsWith('image/'));
      setImageError(false);
      setIsLoading(true);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else if (fileId) {
      const url = `${window.location.origin}/api/files/${fileId}`;
      setPreviewUrl(url);
      setIsImage(true); // Assume existing files are images for preview
      setImageError(false);
      setIsLoading(true);
    } else {
      setPreviewUrl(null);
      setIsImage(false);
      setImageError(false);
      setIsLoading(false);
    }
  }, [file, fileId]);

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-24';
      case 'md':
        return 'h-32';
      case 'lg':
        return 'h-48';
      case 'xl':
        return 'h-80';
      default:
        return 'h-48';
    }
  };

  // Get aspect ratio classes
  const getAspectRatioClasses = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case 'landscape':
        return 'aspect-[3/2]';
      case 'auto':
        return '';
      default:
        return 'aspect-[3/2]';
    }
  };

  // Handle image load success
  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  // Handle image load error
  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  // Handle full screen view
  const handleFullScreenView = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  // Handle download
  const handleDownload = () => {
    if (previewUrl) {
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = fileName || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Get display name
  const getDisplayName = () => {
    if (fileName) return fileName;
    if (file) return file.name;
    return documentName;
  };

  // Get file size
  const getFileSize = () => {
    if (file) {
      const sizeInMB = (file.size / 1024 / 1024).toFixed(1);
      return `${sizeInMB} MB`;
    }
    return '';
  };

  if (!file && !fileId) {
    return null;
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-0">
        {/* Preview Area */}
        <div className={cn(
          'relative w-full bg-gray-50 border-b',
          getSizeClasses(),
          getAspectRatioClasses()
        )}>
          {/* Loading state */}
          {isLoading &&
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          }

          {/* Image preview - only show when showPreview is true */}
          {previewUrl && isImage && !imageError && showPreview &&
          <img
            src={previewUrl}
            alt={getDisplayName()}
            className={cn(
              'w-full h-full object-contain hover:object-cover transition-all duration-200 cursor-pointer',
              isLoading && 'opacity-0'
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
            onClick={showFullscreen ? handleFullScreenView : undefined} />

          }


          {/* Preview button or file display */}
          {!showPreview && !isLoading &&
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-dashed border-blue-300 rounded-lg">
              <div className="text-center p-6">
                <div className="relative mb-4">
                  <FileText className="w-16 h-16 text-blue-500 mx-auto mb-3 drop-shadow-sm" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Eye className="w-3 h-3 text-white" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-blue-800 mb-1">Document Preview</p>
                <p className="text-xs text-blue-600 mb-3">
                  {imageError ? 'Image preview unavailable' : 'Click to preview document'}
                </p>
                <div className="flex flex-col space-y-2">
                  <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                  onClick={() => setShowPreview(true)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Document
                    </Button>
                  {showDownload &&
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                }
                </div>
              </div>
            </div>
          }

          {/* Non-image file fallback when preview is shown */}
          {showPreview && (!isImage || imageError) && !isLoading &&
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center p-6">
                <div className="relative mb-4">
                  <FileText className="w-16 h-16 text-gray-500 mx-auto mb-3 drop-shadow-sm" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-3 h-3 text-white" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">Document Preview</p>
                <p className="text-xs text-gray-600 mb-3">
                  {imageError ? 'Image preview unavailable' : 'Document preview not available'}
                </p>
                <div className="flex flex-col space-y-2">
                  <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                  onClick={() => setShowPreview(false)}>
                      <X className="w-4 h-4 mr-2" />
                      Close Preview
                    </Button>
                  {showFullscreen &&
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                  onClick={handleFullScreenView}>
                      <Eye className="w-4 h-4 mr-2" />
                      Open in New Tab
                    </Button>
                }
                </div>
              </div>
            </div>
          }


          {/* Action buttons overlay */}
          <div className="absolute top-3 right-3 flex space-x-2">
            {/* Preview indicator for new files */}
            {file && !showPreview &&
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-300 shadow-sm">
                Click to Preview
              </Badge>
            }

            {/* Uploaded indicator for existing files */}
            {fileId && !file && !showPreview &&
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-300 shadow-sm">
                Click to Preview
              </Badge>
            }

            {/* Previewing indicator */}
            {showPreview &&
            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 border-gray-300 shadow-sm">
                Previewing
              </Badge>
            }

            {/* Remove button */}
            {showRemoveButton && onRemove &&
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onRemove}
              disabled={disabled}
              className="h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white border-red-500">

                <X className="w-3 h-3" />
              </Button>
            }
          </div>


          {/* Close preview button overlay */}
          {showPreview && previewUrl &&
          <div className="absolute bottom-3 left-3 opacity-0 hover:opacity-100 transition-opacity duration-200">
              <Button
              type="button"
              variant="secondary"
              size="sm"
              className="text-xs bg-white/90 hover:bg-white shadow-sm"
              onClick={() => setShowPreview(false)}>

                <X className="w-3 h-3 mr-1" />
                Close Preview
              </Button>
            </div>
          }

          {/* Full screen button overlay */}
          {showFullscreen && previewUrl && showPreview &&
          <div className="absolute bottom-3 right-3 opacity-0 hover:opacity-100 transition-opacity duration-200">
              <Button
              type="button"
              variant="secondary"
              size="sm"
              className="text-xs bg-white/90 hover:bg-white shadow-sm"
              onClick={handleFullScreenView}>

                <Eye className="w-3 h-3 mr-1" />
                View Full Size
              </Button>
            </div>
          }


          {/* Download button */}
          {showDownload && previewUrl && showPreview &&
          <div className="absolute top-3 left-3 opacity-0 hover:opacity-100 transition-opacity duration-200">
              <Button
              type="button"
              variant="secondary"
              size="sm"
              className="text-xs bg-white/90 hover:bg-white shadow-sm"
              onClick={handleDownload}>

                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
            </div>
          }

        </div>

        {/* File Information */}
        <div className="p-4 space-y-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 truncate">
              {getDisplayName()}
            </p>
            <Badge
              variant="secondary"
              className={cn(
                'text-xs',
                file ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-green-100 text-green-700 border-green-300'
              )}>

              {file ? 'Ready for upload' : 'Uploaded'}
            </Badge>
          </div>

          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span className="flex items-center space-x-1">
              {isImage && !imageError ?
              <Image className="w-3 h-3" /> :

              <FileText className="w-3 h-3" />
              }
              <span>{isImage && !imageError ? 'Image file' : 'Document file'}</span>
            </span>

            {file &&
            <span>{getFileSize()}</span>
            }

            <span className="flex items-center space-x-1">
              <span>✓ {file ? 'Ready to save' : 'Saved'}</span>
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex space-x-2">
              {!showPreview &&
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(true)}
                className="text-xs">

                  <Eye className="w-3 h-3 mr-1" />
                  Preview
                </Button>
              }

              {showPreview &&
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(false)}
                className="text-xs">

                  <X className="w-3 h-3 mr-1" />
                  Close
                </Button>
              }

              {showFullscreen &&
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFullScreenView}
                className="text-xs">

                  <Eye className="w-3 h-3 mr-1" />
                  View
                </Button>
              }

              {showDownload &&
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="text-xs">

                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              }
            </div>


            {showRemoveButton && onRemove &&
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRemove}
              disabled={disabled}
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50">

                <X className="w-3 h-3 mr-1" />
                Remove
              </Button>
            }
          </div>
        </div>
      </CardContent>
    </Card>);

};

export default DocumentPreview;