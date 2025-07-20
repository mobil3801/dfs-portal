import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EnhancedFileUpload from '@/components/EnhancedFileUpload';
import { useIsMobile } from '@/hooks/use-mobile';

interface DocumentUpload {
  name: string;
  field: string;
  fileId?: number;
  required: boolean;
}

interface DocumentsUploadSectionProps {
  documents: {
    dayReportFileId?: number;
    veederRootFileId?: number;
    lottoReportFileId?: number;
    scratchOffReportFileId?: number;
  };
  onChange: (field: string, fileId: number) => void;
}

const DocumentsUploadSection: React.FC<DocumentsUploadSectionProps> = ({
  documents,
  onChange
}) => {
  const { toast } = useToast();

  const documentTypes: DocumentUpload[] = [
  {
    name: 'Day Report',
    field: 'dayReportFileId',
    fileId: documents.dayReportFileId,
    required: true
  },
  {
    name: 'Veeder Root Report',
    field: 'veederRootFileId',
    fileId: documents.veederRootFileId,
    required: true
  },
  {
    name: 'Lotto Report',
    field: 'lottoReportFileId',
    fileId: documents.lottoReportFileId,
    required: true
  },
  {
    name: 'Scratch Off Report',
    field: 'scratchOffReportFileId',
    fileId: documents.scratchOffReportFileId,
    required: true
  }];


  const uploadDocument = async (field: string, file: File) => {
    try {
      const { data: fileId, error } = await window.ezsite.apis.upload({
        filename: file.name,
        file: file
      });

      if (error) throw error;
      onChange(field, fileId);

      toast({
        title: 'Success',
        description: `${field.replace('FileId', '').replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())} uploaded successfully`
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload document',
        variant: 'destructive'
      });
    }
  };

  const getStatus = (document: DocumentUpload) => {
    if (document.fileId) {
      return {
        icon: <CheckCircle className="w-4 h-4" />,
        text: 'Submitted',
        color: 'bg-green-100 text-green-800 border-green-200'
      };
    } else {
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        text: 'Not Submitted',
        color: 'bg-red-100 text-red-800 border-red-200'
      };
    }
  };

  const submittedCount = documentTypes.filter((doc) => doc.fileId).length;
  const totalCount = documentTypes.length;

  return (
    <Card className="bg-purple-50 border-purple-200">
      <CardHeader>
        <CardTitle className="text-purple-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Documents Upload</span>
          </div>
          <Badge
            variant="outline"
            className={submittedCount === totalCount ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>

            {submittedCount}/{totalCount} Submitted
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Mandatory Submission Required</span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            All documents must be uploaded before submitting the sales report.
          </p>
        </div>

        <div className="space-y-4">
          {documentTypes.map((document) => {
            const status = getStatus(document);

            return (
              <div key={document.field} className="border border-purple-200 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">{document.name}</span>
                    {document.required &&
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                    }
                  </div>
                  <Badge className={status.color}>
                    <div className="flex items-center space-x-1">
                      {status.icon}
                      <span>{status.text}</span>
                    </div>
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <EnhancedFileUpload
                    onFileSelect={(file) => uploadDocument(document.field, file)}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,image/*"
                    label={document.fileId ? 'Re-upload Document' : 'Upload Document'}
                    maxSize={15}
                    className="w-full" />

                </div>
                
                {document.fileId &&
                <div className="mt-2 text-xs text-green-600 flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>File uploaded successfully (ID: {document.fileId})</span>
                  </div>
                }
              </div>);

          })}
        </div>
        
        <div className="pt-4 border-t border-purple-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Submission Progress:</span>
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${submittedCount / totalCount * 100}%` }} />

              </div>
              <span className="font-medium text-purple-800">
                {Math.round(submittedCount / totalCount * 100)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>);

};

export default DocumentsUploadSection;