import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Image, Loader2, Zap, Eye, Download, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { compressImage, formatFileSize, isImageFile, type CompressionResult } from '@/utils/imageCompression';

interface FileUploadResult {
  fileId: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  storeFileId: number;
  uploadDate: string;
  fileUrl: string;
}

interface EnhancedFileUploadProps {
  onFileSelect?: (file: File) => void;
  onFileUpload?: (result: FileUploadResult) => void;
  accept?: string;
  label?: string;
  currentFile?: string;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
  useDatabaseStorage?: boolean;
  associatedTable?: string;
  associatedRecordId?: number;
  fileCategory?: string;
  showPreview?: boolean;
}

const EnhancedFileUpload: React.FC<EnhancedFileUploadProps> = ({
  onFileSelect,
  onFileUpload,
  accept = "image/*",
  label = "Upload File",
  currentFile,
  maxSize = 10,
  className = "",
  disabled = false,
  useDatabaseStorage = false,
  associatedTable = "",
  associatedRecordId = 0,
  fileCategory = "general",
  showPreview = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [uploadResult, setUploadResult] = useState<FileUploadResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  // Check if the accept type includes images
  const isImageUpload = accept.includes('image');

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

    // Check file type if accept is specified
    if (accept && accept !== "*/*") {
      const acceptedTypes = accept.split(',').map((type) => type.trim());
      const isAccepted = acceptedTypes.some((type) => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        } else if (type.includes('*')) {
          const baseType = type.split('/')[0];
          return file.type.startsWith(baseType);
        } else {
          return file.type === type;
        }
      });

      if (!isAccepted) {
        toast({
          title: "Invalid file type",
          description: `Please select a file of type: ${accept}`,
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const uploadToDatabase = async (file: File): Promise<FileUploadResult> => {
    try {
      // Upload file to storage
      const { data: storeFileId, error: uploadError } = await window.ezsite.apis.upload({
        filename: file.name,
        file: file
      });

      if (uploadError) throw uploadError;

      // Save file metadata to database
      const fileData = {
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        store_file_id: storeFileId,
        uploaded_by: 1, // This should be the current user ID
        upload_date: new Date().toISOString(),
        associated_table: associatedTable,
        associated_record_id: associatedRecordId,
        file_category: fileCategory,
        is_active: true,
        description: "",
        file_url: `${window.location.origin}/file/${storeFileId}`
      };

      const { data: insertResult, error: insertError } = await window.ezsite.apis.tableCreate(26928, fileData);

      if (insertError) throw insertError;

      return {
        fileId: insertResult.id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        storeFileId: storeFileId,
        uploadDate: fileData.upload_date,
        fileUrl: fileData.file_url
      };
    } catch (error) {
      console.error('Database upload failed:', error);
      throw error;
    }
  };

  const processFile = async (file: File) => {
    // Check if it's an image and larger than 1MB
    const needsCompression = isImageFile(file) && file.size > 1024 * 1024;

    if (needsCompression) {
      setIsCompressing(true);
      try {
        const result = await compressImage(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          quality: 0.8,
          initialQuality: 0.8
        });

        setCompressionResult(result);

        if (result.wasCompressed) {
          toast({
            title: "Image compressed",
            description: `File size reduced from ${formatFileSize(result.originalSize)} to ${formatFileSize(result.compressedSize)} (${result.compressionRatio.toFixed(1)}x smaller)`,
            duration: 5000
          });
        }

        // Choose between database upload or file selection
        if (useDatabaseStorage) {
          setIsUploading(true);
          try {
            const uploadResult = await uploadToDatabase(result.file);
            setUploadResult(uploadResult);
            if (onFileUpload) onFileUpload(uploadResult);
            toast({
              title: "File uploaded successfully",
              description: `${result.file.name} has been uploaded to the database`
            });
          } catch (error) {
            toast({
              title: "Upload failed",
              description: typeof error === 'string' ? error : "Failed to upload file to database",
              variant: "destructive"
            });
          } finally {
            setIsUploading(false);
          }
        } else {
          if (onFileSelect) onFileSelect(result.file);
        }
        setIsOpen(false);
      } catch (error) {
        console.error('Compression failed:', error);
        toast({
          title: "Compression failed",
          description: "Using original file instead",
          variant: "destructive"
        });

        if (useDatabaseStorage) {
          setIsUploading(true);
          try {
            const uploadResult = await uploadToDatabase(file);
            setUploadResult(uploadResult);
            if (onFileUpload) onFileUpload(uploadResult);
            toast({
              title: "File uploaded successfully",
              description: `${file.name} has been uploaded to the database`
            });
          } catch (error) {
            toast({
              title: "Upload failed",
              description: typeof error === 'string' ? error : "Failed to upload file to database",
              variant: "destructive"
            });
          } finally {
            setIsUploading(false);
          }
        } else {
          if (onFileSelect) onFileSelect(file);
        }
        setIsOpen(false);
      } finally {
        setIsCompressing(false);
      }
    } else {
      if (useDatabaseStorage) {
        setIsUploading(true);
        try {
          const uploadResult = await uploadToDatabase(file);
          setUploadResult(uploadResult);
          if (onFileUpload) onFileUpload(uploadResult);
          toast({
            title: "File uploaded successfully",
            description: `${file.name} has been uploaded to the database`
          });
        } catch (error) {
          toast({
            title: "Upload failed",
            description: typeof error === 'string' ? error : "Failed to upload file to database",
            variant: "destructive"
          });
        } finally {
          setIsUploading(false);
        }
      } else {
        if (onFileSelect) onFileSelect(file);
        toast({
          title: "File selected",
          description: `${file.name} has been selected successfully`
        });
      }
      setIsOpen(false);
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

  const closeDialog = () => {
    setIsOpen(false);
    setCompressionResult(null);
    setUploadResult(null);
  };

  const getFileIcon = () => {
    if (isImageUpload) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const handlePreview = () => {
    if (uploadResult?.fileUrl) {
      window.open(uploadResult.fileUrl, '_blank');
    }
  };

  const handleDownload = () => {
    if (uploadResult?.fileUrl) {
      const link = document.createElement('a');
      link.href = uploadResult.fileUrl;
      link.download = uploadResult.fileName;
      link.click();
    }
  };

  return (
    <div className={className}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className="w-full flex items-center gap-2">
            {getFileIcon()}
            {label}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getFileIcon()}
              {label}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current file display */}
            {currentFile &&
            <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Current file:</span>
                    <Badge variant="secondary">{currentFile}</Badge>
                  </div>
                </CardContent>
              </Card>
            }

            {/* Upload result display */}
            {uploadResult && showPreview &&
            <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">File uploaded successfully!</p>
                      <p className="text-sm text-green-600">{uploadResult.fileName}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handlePreview}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            }

            {/* Upload option */}
            <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
              <CardContent className="p-6">
                <Button
                  variant="ghost"
                  className="w-full h-auto p-0 flex flex-col items-center gap-3"
                  onClick={() => fileInputRef.current?.click()}>
                  <div className="p-4 bg-blue-100 rounded-full">
                    <Upload className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold">
                      {useDatabaseStorage ? 'Upload to Database' : 'Upload From File'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {useDatabaseStorage ? 'Upload and store in database' : 'Choose a file from your device'}
                    </p>
                  </div>
                </Button>
              </CardContent>
            </Card>

            {/* Upload status */}
            {isUploading &&
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">Uploading to database...</p>
                      <p className="text-sm text-blue-600">Please wait while your file is being processed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            }

            {/* Compression status */}
            {isCompressing &&
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">Compressing image...</p>
                      <p className="text-sm text-blue-600">Optimizing file size for better performance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            }

            {/* File type info */}
            <div className="text-center text-sm text-gray-500">
              <p>Accepted file types: {accept}</p>
              <p>Maximum file size: {maxSize}MB</p>
              {isImageFile({ type: accept } as File) &&
              <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <Zap className="h-4 w-4" />
                    <span className="text-xs font-medium">Auto-compression enabled for images &gt;1MB</span>
                  </div>
                </div>
              }
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden" />
    </div>);

};

export default EnhancedFileUpload;