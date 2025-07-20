import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Upload, Database, FileText, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EnhancedFileUpload from '@/components/EnhancedFileUpload';
import DatabaseFileUpload from '@/components/DatabaseFileUpload';
import FileDisplay from '@/components/FileDisplay';

interface FileUploadResult {
  fileId: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  storeFileId: number;
  uploadDate: string;
  fileUrl: string;
}

const FileUploadDemo: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadResult[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    toast({
      title: "File selected",
      description: `${file.name} has been selected for processing`
    });
  };

  const handleFileUpload = (result: FileUploadResult) => {
    setUploadedFiles((prev) => [...prev, result]);
    setRefreshKey((prev) => prev + 1);
    toast({
      title: "File uploaded successfully",
      description: `${result.fileName} has been uploaded to the database`
    });
  };

  const clearAll = () => {
    setSelectedFile(null);
    setUploadedFiles([]);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            File Upload System Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            This demo shows the enhanced file upload system with database storage integration.
            Files are uploaded to the storage system and metadata is saved in the database.
          </p>
          
          <div className="flex gap-2 mb-4">
            <Badge variant="secondary">Auto-compression for images</Badge>
            <Badge variant="secondary">Database storage</Badge>
            <Badge variant="secondary">File previews</Badge>
            <Badge variant="secondary">Multiple file types</Badge>
          </div>

          <Button onClick={clearAll} variant="outline" size="sm">
            Clear All Demo Data
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Upload</TabsTrigger>
          <TabsTrigger value="database">Database Upload</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Upload</TabsTrigger>
          <TabsTrigger value="display">View Files</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic File Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Basic file selection without database storage. Selected file can be processed by your application.
              </p>
              
              <EnhancedFileUpload
                onFileSelect={handleFileSelect}
                accept="image/*,application/pdf,.doc,.docx"
                label="Select Document or Image"
                maxSize={5} />


              {selectedFile &&
              <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-gray-600">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database File Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Upload files directly to the database with metadata tracking. Files are stored in the cloud
                and can be retrieved later.
              </p>
              
              <EnhancedFileUpload
                onFileUpload={handleFileUpload}
                accept="image/*,application/pdf,.doc,.docx"
                label="Upload to Database"
                maxSize={10}
                useDatabaseStorage={true}
                associatedTable="demo_files"
                associatedRecordId={1}
                fileCategory="document"
                showPreview={true} />


              {uploadedFiles.length > 0 &&
              <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Recently Uploaded Files</h4>
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) =>
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="font-medium text-sm">{file.fileName}</p>
                              <p className="text-xs text-gray-500">
                                {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(file.fileUrl, '_blank')}>

                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                    )}
                    </div>
                  </CardContent>
                </Card>
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Upload Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Advanced file upload with multiple files, categories, and descriptions.
              </p>
              
              <DatabaseFileUpload
                onFileUpload={handleFileUpload}
                accept="*/*"
                label="Upload Multiple Files"
                maxSize={20}
                allowMultiple={true}
                fileCategory="mixed"
                associatedTable="demo_files"
                associatedRecordId={2}
                placeholder="Select multiple files of any type..." />

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="display" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>File Display & Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                View and manage uploaded files with preview and download capabilities.
              </p>
              
              <FileDisplay
                associatedTable="demo_files"
                associatedRecordId={1}
                allowDelete={true}
                allowEdit={true}
                showDescription={true}
                viewMode="grid"
                key={refreshKey} />


              <Separator className="my-4" />

              <FileDisplay
                associatedTable="demo_files"
                associatedRecordId={2}
                fileCategory="mixed"
                allowDelete={true}
                viewMode="list"
                key={refreshKey + 1000} />

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>);

};

export default FileUploadDemo;