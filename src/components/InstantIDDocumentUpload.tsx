import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Upload, X, FileText, Download, Image as ImageIcon, Eye, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InstantIDDocumentUploadProps {
  label: string;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  existingFileId?: number | null;
  selectedFile?: File | null;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

const InstantIDDocumentUpload: React.FC<InstantIDDocumentUploadProps> = ({
  label,
  onFileSelect,
  onRemove,
  existingFileId,
  selectedFile,
  disabled = false,
  required = false,
  className = ''
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [fileExists, setFileExists] = useState(false);
  const [checkingFile, setCheckingFile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Create preview URL for new files
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setIsImage(selectedFile.type.startsWith('image/'));
      setImageError(false);
      setImageLoading(true);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
      setIsImage(false);
      setImageError(false);
      setImageLoading(false);
    }
  }, [selectedFile]);

  // Check if file exists in database
  useEffect(() => {
    const checkFileExistence = async () => {
      if (existingFileId && !selectedFile) {
        setCheckingFile(true);
        try {
          // Check if file exists in file_uploads table
          const response = await window.ezsite.apis.tablePage(26928, {
            "PageNo": 1,
            "PageSize": 1,
            "Filters": [
            {
              "name": "store_file_id",
              "op": "Equal",
              "value": existingFileId
            }]

          });

          if (response.error) {
            console.error('Error checking file existence:', response.error);
            setFileExists(false);
          } else {
            const hasFile = response.data?.List?.length > 0;
            setFileExists(hasFile);

            if (hasFile) {
              // File exists, set up preview
              const url = `${window.location.origin}/api/files/${existingFileId}`;
              setPreviewUrl(url);
              setIsImage(true); // Assume existing files are images
              setImageError(false);
              setImageLoading(true);
            }
          }
        } catch (error) {
          console.error('Error checking file existence:', error);
          setFileExists(false);
        } finally {
          setCheckingFile(false);
        }
      } else {
        setFileExists(false);
        setCheckingFile(false);
      }
    };

    checkFileExistence();
  }, [existingFileId, selectedFile]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload PDF, JPG, or PNG files only.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload files smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    onFileSelect(file);

    toast({
      title: "File Selected",
      description: `${file.name} has been selected and will be uploaded when you save.`
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleBrowseClick = () => {
    inputRef.current?.click();
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Show confirmation for existing files
    if (existingFileId && !selectedFile) {
      const confirmDelete = window.confirm(
        `Are you sure you want to remove this ${label}? This action cannot be undone and the file will be permanently deleted when you save the employee.`
      );
      if (!confirmDelete) {
        return;
      }
    }

    onRemove();

    // Clear the input
    if (inputRef.current) {
      inputRef.current.value = '';
    }

    toast({
      title: "File Marked for Removal",
      description: `${label} has been marked for removal and will be permanently deleted when you save.`,
      variant: "destructive"
    });
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handleDownload = () => {
    if (previewUrl) {
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = selectedFile?.name || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Always show content - either file exists OR no file (always show the box)
  const hasContent = selectedFile || existingFileId && fileExists;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Label and Remove Button */}
      <div className="flex items-center justify-between">
        <Label className="flex items-center space-x-2">
          <FileText className="w-4 h-4" />
          <span className="text-sm sm:text-base">{label}</span>
          {required && <span className="text-red-500">*</span>}
        </Label>
        
        {hasContent &&
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRemoveClick}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 px-2 border-red-200 transition-colors touch-manipulation"
          disabled={disabled}
          title={`Remove ${label} - will be permanently deleted when you save`}>
            <X className="w-3 h-3" />
          </Button>
        }
      </div>

      {/* Always show display box - like profile picture */}
      <Card className={cn(
        "overflow-hidden border-2 transition-all duration-200",
        hasContent ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"
      )}>
        <CardContent className="p-0">
          {/* Preview Area - Always visible */}
          <div
            className={cn(
              "relative w-full h-48 transition-all duration-200",
              hasContent ? "bg-gradient-to-br from-blue-50 to-indigo-100" : "bg-gradient-to-br from-gray-50 to-gray-100"
            )}>


            {/* Loading state while checking file existence */}
            {checkingFile &&
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80">
                <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
                <span className="ml-2 text-sm text-gray-600">Checking file...</span>
              </div>
            }

            {/* Loading state */}
            {imageLoading && !checkingFile &&
            <div className="absolute inset-0 flex items-center justify-center bg-blue-100/80">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            }

            {/* Image preview - when file exists */}
            {previewUrl && isImage && !imageError && !checkingFile &&
            <img
              src={previewUrl}
              alt={selectedFile?.name || 'ID Document'}
              className={cn(
                'w-full h-full object-contain bg-white rounded-t-lg',
                imageLoading && 'opacity-0'
              )}
              onLoad={handleImageLoad}
              onError={handleImageError} />
            }

            {/* Non-image or error fallback - when file exists */}
            {hasContent && (!isImage || imageError) && !imageLoading && !checkingFile &&
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-blue-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-blue-800">
                    {imageError ? 'Preview not available' : 'Document selected'}
                  </p>
                  <p className="text-xs text-blue-600">
                    {selectedFile ? selectedFile.name : 'ID Document'}
                  </p>
                </div>
              </div>
            }

            {/* Empty state - when no file */}
            {!hasContent && !checkingFile &&
            <div
              className={cn(
                "w-full h-full flex items-center justify-center cursor-pointer transition-colors",
                dragActive ? 'bg-blue-50' : 'hover:bg-gray-100'
              )}
              onClick={!disabled ? handleBrowseClick : undefined}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}>


                <div className="text-center p-6">
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    No file uploaded
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    Click to browse or drag and drop
                  </p>
                  <p className="text-xs text-gray-400">
                    PDF, JPG, PNG up to 10MB
                  </p>
                </div>
              </div>
            }

            {/* Status Badge */}
            {hasContent && !checkingFile &&
            <div className="absolute top-3 left-3">
                <Badge
                variant="secondary"
                className="text-xs bg-white/90 text-blue-700 border-blue-300 shadow-sm">
                  {selectedFile ? 'Ready for Upload' : 'Uploaded'}
                </Badge>
              </div>
            }

            {/* Download Button - Only when file exists */}
            {hasContent && previewUrl && !checkingFile &&
            <div className="absolute top-3 right-3">
                <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleDownload}
                className="bg-white/90 hover:bg-white text-blue-600 shadow-sm touch-manipulation min-h-[32px]"
                disabled={!previewUrl}>
                  <Download className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </div>
            }
          </div>

          {/* File Information Area - Always visible */}
          <div className={cn(
            "p-4 bg-white border-t transition-colors",
            hasContent ? "border-blue-200" : "border-gray-200"
          )}>
            
            {/* File exists - show file info */}
            {hasContent && !checkingFile ?
            <>
                <div className="flex items-center justify-between mb-2 gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate flex-1 min-w-0">
                    {selectedFile ? selectedFile.name : `Current ${label}`}
                  </p>
                  <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs flex-shrink-0',
                    selectedFile ?
                    'bg-orange-100 text-orange-700 border-orange-300' :
                    'bg-green-100 text-green-700 border-green-300'
                  )}>
                    {selectedFile ? 'Pending Upload' : 'Saved'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center space-x-1">
                    {isImage && !imageError ?
                  <ImageIcon className="w-3 h-3" /> :
                  <FileText className="w-3 h-3" />
                  }
                    <span>{isImage && !imageError ? 'Image file' : 'Document file'}</span>
                  </span>

                  {selectedFile &&
                <span>{formatFileSize(selectedFile.size)}</span>
                }

                  <span className="flex items-center space-x-1">
                    <span>✓ {selectedFile ? 'Ready to save' : 'Saved'}</span>
                  </span>
                </div>

                {/* Upload a different file button */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBrowseClick}
                  className="w-full text-xs touch-manipulation min-h-[32px]"
                  disabled={disabled}>
                    <Upload className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Upload Different File</span>
                    <span className="sm:hidden">Change File</span>
                  </Button>
                </div>
              </> :
            !checkingFile ? (
            /* No file - show upload button */
            <>
                <div className="text-center mb-3">
                  <p className="text-sm text-gray-600 mb-1">
                    No {label.toLowerCase()} uploaded
                  </p>
                  <p className="text-xs text-gray-500">
                    Upload a file to get started
                  </p>
                </div>
                
                <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBrowseClick}
                className="w-full text-xs touch-manipulation min-h-[32px] border-dashed"
                disabled={disabled}>
                  <Upload className="w-3 h-3 mr-1" />
                  <span>Upload File</span>
                </Button>
              </>) : (

            /* Loading state in info area */
            <div className="text-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Loading file information...</p>
              </div>)
            }
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,image/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled} />

      {/* Instructions */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Supported formats: PDF, JPG, PNG (Maximum 10MB per file)</p>
        <p>• Images will show instant preview with download option</p>
        <p>• Files will be saved to storage when you save the employee</p>
        <p className="text-red-600">• Click the × button to mark files for deletion</p>
      </div>
    </div>);

};

export default InstantIDDocumentUpload;