import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Download, FileText, Image, Video, File, Trash2, Edit, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatFileSize } from '@/utils/imageCompression';

interface FileDisplayItem {
  id: number;
  file_name: string;
  file_size: number;
  file_type: string;
  store_file_id: number;
  upload_date: string;
  description?: string;
  file_category?: string;
  file_url?: string;
  uploaded_by?: number;
}

interface FileDisplayProps {
  associatedTable: string;
  associatedRecordId: number;
  fileCategory?: string;
  allowDelete?: boolean;
  allowEdit?: boolean;
  showDescription?: boolean;
  className?: string;
  viewMode?: 'grid' | 'list';
}

const FileDisplay: React.FC<FileDisplayProps> = ({
  associatedTable,
  associatedRecordId,
  fileCategory,
  allowDelete = false,
  allowEdit = false,
  showDescription = true,
  className = "",
  viewMode = 'grid'
}) => {
  const [files, setFiles] = useState<FileDisplayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileDisplayItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFiles();
  }, [associatedTable, associatedRecordId, fileCategory]);

  const loadFiles = async () => {
    try {
      setLoading(true);

      const filters = [
      { name: "associated_table", op: "Equal", value: associatedTable },
      { name: "associated_record_id", op: "Equal", value: associatedRecordId },
      { name: "is_active", op: "Equal", value: true }];


      if (fileCategory) {
        filters.push({ name: "file_category", op: "Equal", value: fileCategory });
      }

      const { data, error } = await window.ezsite.apis.tablePage(26928, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: "upload_date",
        IsAsc: false,
        Filters: filters
      });

      if (error) throw error;

      setFiles(data.List || []);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Error loading files",
        description: typeof error === 'string' ? error : "Failed to load files",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (file: FileDisplayItem) => {
    if (!confirm(`Are you sure you want to delete "${file.file_name}"?`)) return;

    try {
      const { error } = await window.ezsite.apis.tableUpdate(26928, {
        id: file.id,
        is_active: false
      });

      if (error) throw error;

      toast({
        title: "File deleted",
        description: "File has been successfully deleted"
      });

      // Refresh the file list
      loadFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Delete failed",
        description: typeof error === 'string' ? error : "Failed to delete file",
        variant: "destructive"
      });
    }
  };

  const handleDownload = (file: FileDisplayItem) => {
    if (file.file_url) {
      window.open(file.file_url, '_blank');
    }
  };

  const handlePreview = (file: FileDisplayItem) => {
    setSelectedFile(file);
    setPreviewOpen(true);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-600" />;
    } else if (fileType.startsWith('video/')) {
      return <Video className="h-5 w-5 text-purple-600" />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-600" />;
    } else {
      return <File className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatFileType = (type: string) => {
    return type.split('/')[1]?.toUpperCase() || 'FILE';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      document: 'bg-blue-100 text-blue-800',
      image: 'bg-green-100 text-green-800',
      receipt: 'bg-yellow-100 text-yellow-800',
      invoice: 'bg-purple-100 text-purple-800',
      report: 'bg-orange-100 text-orange-800',
      license: 'bg-indigo-100 text-indigo-800',
      certificate: 'bg-pink-100 text-pink-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  const renderFilePreview = (file: FileDisplayItem) => {
    if (file.file_type.startsWith('image/')) {
      return (
        <img
          src={file.file_url}
          alt={file.file_name}
          className="max-w-full max-h-96 object-contain rounded-lg" />);


    } else if (file.file_type === 'application/pdf') {
      return (
        <iframe
          src={file.file_url}
          className="w-full h-96 rounded-lg border"
          title={file.file_name} />);


    } else {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
          {getFileIcon(file.file_type)}
          <p className="mt-2 text-sm text-gray-600">Preview not available</p>
          <p className="text-xs text-gray-500">Click download to view this file</p>
        </div>);

    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>);

  }

  if (files.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <File className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No files uploaded</h3>
          <p className="text-sm text-gray-500">Files will appear here once uploaded</p>
        </CardContent>
      </Card>);

  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Uploaded Files</span>
            <Badge variant="secondary">{files.length} files</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
            {files.map((file) =>
            <div
              key={file.id}
              className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${
              viewMode === 'list' ? 'flex items-center gap-4' : ''}`
              }>

                <div className={`${viewMode === 'list' ? 'flex items-center gap-3 flex-1' : ''}`}>
                  <div className="flex items-center gap-3 mb-2">
                    {getFileIcon(file.file_type)}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{file.file_name}</h4>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.file_size)} • {formatFileType(file.file_type)}
                      </p>
                    </div>
                  </div>

                  {showDescription && file.description &&
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{file.description}</p>
                }

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {file.file_category &&
                    <Badge variant="secondary" className={`text-xs ${getCategoryColor(file.file_category)}`}>
                          {file.file_category}
                        </Badge>
                    }
                      <Badge variant="outline" className="text-xs">
                        {formatDate(file.upload_date)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className={`flex gap-2 ${viewMode === 'list' ? 'flex-shrink-0' : 'mt-3'}`}>
                  <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePreview(file)}>

                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(file)}>

                    <Download className="h-4 w-4" />
                  </Button>
                  {allowDelete &&
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(file)}
                  className="text-red-600 hover:text-red-700">

                      <Trash2 className="h-4 w-4" />
                    </Button>
                }
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedFile && getFileIcon(selectedFile.file_type)}
                <div>
                  <h3 className="font-medium">{selectedFile?.file_name}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedFile && formatFileSize(selectedFile.file_size)} • {selectedFile && formatFileType(selectedFile.file_type)}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedFile &&
            <>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {selectedFile.file_category &&
                  <Badge className={getCategoryColor(selectedFile.file_category)}>
                        {selectedFile.file_category}
                      </Badge>
                  }
                    <Badge variant="outline">
                      {formatDate(selectedFile.upload_date)}
                    </Badge>
                  </div>
                  <Button onClick={() => handleDownload(selectedFile)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>

                {selectedFile.description &&
              <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">{selectedFile.description}</p>
                  </div>
              }

                <div className="flex justify-center">
                  {renderFilePreview(selectedFile)}
                </div>
              </>
            }
          </div>
        </DialogContent>
      </Dialog>
    </div>);

};

export default FileDisplay;