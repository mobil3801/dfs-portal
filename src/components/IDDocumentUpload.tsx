import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Upload, X, FileText, Eye, Image, File, Download } from 'lucide-react';
import DocumentPreview from '@/components/DocumentPreview';

interface IDDocumentUploadProps {
  label: string;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  existingFileId?: number | null;
  selectedFile?: File | null;
  preview?: string | null;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

const IDDocumentUpload: React.FC<IDDocumentUploadProps> = ({
  label,
  onFileSelect,
  onRemove,
  existingFileId,
  selectedFile,
  preview,
  disabled = false,
  required = false,
  className = ''
}) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return FileText;

    if (fileType.startsWith('image/')) {
      return Image;
    } else if (fileType === 'application/pdf') {
      return FileText;
    } else {
      return File;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasContent = selectedFile || existingFileId;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="flex items-center space-x-2">
          <FileText className="w-4 h-4" />
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
        </Label>
        
        {hasContent &&
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRemoveClick}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 px-2 border-red-200 transition-colors"
          disabled={disabled}
          title={`Remove ${label} - will be permanently deleted when you save`}>

            <X className="w-3 h-3" />
          </Button>
        }
      </div>

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-400 cursor-pointer'}
          ${hasContent ? 'bg-gray-50' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!disabled && !hasContent ? handleBrowseClick : undefined}>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,image/*"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled} />


        {!hasContent ?
        <div className="space-y-2">
            <Upload className="w-8 h-8 text-gray-400 mx-auto" />
            <div>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-blue-600 hover:text-blue-500">
                  Click to browse
                </span>
                {' or drag and drop'}
              </p>
              <p className="text-xs text-gray-500">
                PDF, JPG, PNG up to 10MB
              </p>
            </div>
          </div> :

        <div className="space-y-2">
            <div className="flex items-center justify-center text-green-600">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm text-green-600 font-medium">
              {selectedFile ? 'New file selected' : 'Document uploaded'}
            </p>
            <p className="text-xs text-gray-500">
              {selectedFile ? `${selectedFile.name} (${formatFileSize(selectedFile.size)})` : 'Existing document'}
            </p>
          </div>
        }
      </div>

      {/* File Preview */}
      {selectedFile &&
      <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">New Document Preview</span>
            <Badge variant="secondary" className="text-xs">
              Will be saved when you update employee
            </Badge>
          </div>
          <DocumentPreview
          file={selectedFile}
          fileName={selectedFile.name}
          documentName={label}
          size="lg"
          aspectRatio="landscape"
          showRemoveButton={false}
          showDownload={false}
          showFullscreen={true}
          className="border border-blue-200 bg-blue-50" />

        </div>
      }

      {/* Existing File Preview */}
      {existingFileId && !selectedFile &&
      <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Current Document</span>
            <Badge variant="outline" className="text-xs">
              Existing file
            </Badge>
          </div>
          <DocumentPreview
          fileId={existingFileId}
          fileName={`Current ${label}`}
          documentName={label}
          size="lg"
          aspectRatio="landscape"
          showRemoveButton={false}
          showDownload={true}
          showFullscreen={true}
          className="border border-gray-200" />

        </div>
      }

      {/* Instructions */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Supported formats: PDF, JPG, PNG (Maximum 10MB per file)</p>
        <p>• Images will show instant preview</p>
        <p>• Click the × button to remove and upload a new document</p>
      </div>
    </div>);

};

export default IDDocumentUpload;