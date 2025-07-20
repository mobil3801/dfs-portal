import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileText, Eye, Download } from 'lucide-react';

interface Employee {
  ID: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  station: string;
  shift: string;
  hire_date: string;
  salary: number;
  is_active: boolean;
  employment_status: string;
  created_by: number;
  profile_image_id?: number | null;
  date_of_birth?: string;
  current_address?: string;
  mailing_address?: string;
  reference_name?: string;
  id_document_type?: string;
  id_document_file_id?: number | null;
  id_document_2_file_id?: number | null;
  id_document_3_file_id?: number | null;
  id_document_4_file_id?: number | null;
}

interface EnhancedIDDocumentsDisplayProps {
  employee: Employee;
  isAdminUser: boolean;
}

const EnhancedIDDocumentsDisplay: React.FC<EnhancedIDDocumentsDisplayProps> = ({ employee, isAdminUser }) => {
  const { toast } = useToast();

  const documents = [
  { fileId: employee.id_document_file_id, label: 'ID Document 1' },
  { fileId: employee.id_document_2_file_id, label: 'ID Document 2' },
  { fileId: employee.id_document_3_file_id, label: 'ID Document 3' },
  { fileId: employee.id_document_4_file_id, label: 'ID Document 4' }].
  filter((doc) => doc.fileId);

  // Handle download for admin users
  const handleDownload = async (fileId: number | null, fileName: string) => {
    if (!fileId) return;

    try {
      const downloadUrl = `${window.location.origin}/api/files/${fileId}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "Document downloaded successfully"
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive"
      });
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-sm font-medium">No ID documents uploaded</p>
        <p className="text-xs text-gray-400 mt-1">ID documents will appear here once uploaded</p>
      </div>);

  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-800">ID Documents ({documents.length})</span>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            Always visible
          </Badge>
          {isAdminUser &&
          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
              Admin: Download enabled
            </Badge>
          }
        </div>
      </div>
      
      {/* Document Type Information */}
      {employee.id_document_type &&
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Document Type:</strong> {employee.id_document_type}
          </p>
        </div>
      }
      
      {/* Enhanced Document Display Grid - Always Visible Like Profile Pictures */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {documents.map((doc, index) =>
        <div key={index} className="relative group">
            {/* Document Display Card - Always Show Like Profile Picture */}
            <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200">
              {/* Document Image Display */}
              <div className="aspect-[3/2] bg-gray-50 relative">
                <img
                src={`${window.location.origin}/api/files/${doc.fileId}`}
                alt={doc.label}
                className="w-full h-full object-contain hover:object-cover transition-all duration-300 cursor-pointer"
                onClick={() => {
                  // Open in new tab for full view
                  window.open(`${window.location.origin}/api/files/${doc.fileId}`, '_blank');
                }}
                onError={(e) => {
                  // Fallback for non-image files
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }} />

                
                {/* Fallback for non-image files */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 hidden">
                  <div className="text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Document File</p>
                    <p className="text-xs text-gray-400 mt-1">Click to view</p>
                  </div>
                </div>
              </div>
              
              {/* Document Label */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                {doc.label}
              </div>
              
              {/* Action Buttons Overlay */}
              <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {/* View Full Size Button */}
                <Button
                variant="secondary"
                size="sm"
                className="h-6 w-6 p-0 bg-white bg-opacity-90 hover:bg-opacity-100 shadow-sm"
                onClick={() => {
                  window.open(`${window.location.origin}/api/files/${doc.fileId}`, '_blank');
                }}>

                  <Eye className="w-3 h-3" />
                </Button>
                
                {/* Download Button - Admin Only */}
                {isAdminUser &&
              <Button
                variant="secondary"
                size="sm"
                className="h-6 w-6 p-0 bg-green-500 bg-opacity-90 hover:bg-opacity-100 text-white shadow-sm"
                onClick={() => handleDownload(doc.fileId, doc.label)}>

                    <Download className="w-3 h-3" />
                  </Button>
              }
              </div>
              
              {/* Document Info Bar */}
              <div className="p-3 bg-white border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {doc.label}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      Uploaded
                    </Badge>
                    {isAdminUser &&
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => handleDownload(doc.fileId, doc.label)}>

                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                  }
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Information Panel */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <p>• All ID documents are always visible like profile pictures</p>
        <p>• Click on any document to view in full screen</p>
        {isAdminUser ?
        <p>• <strong>Admin:</strong> Download buttons are visible for document management</p> :

        <p>• Download access is restricted to administrators only</p>
        }
      </div>
    </div>);

};

export default EnhancedIDDocumentsDisplay;