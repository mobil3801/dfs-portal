import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { X, Printer } from 'lucide-react';

interface License {
  ID: number;
  license_name: string;
  license_number: string;
  issuing_authority: string;
  issue_date: string;
  expiry_date: string;
  station: string;
  category: string;
  status: string;
  document_file_id: number;
  created_by: number;
}

interface PrintDialogProps {
  license: License | null;
  isOpen: boolean;
  onClose: () => void;
}

const PrintDialog: React.FC<PrintDialogProps> = ({ license, isOpen, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500';
      case 'expired':
        return 'bg-red-500';
      case 'pending renewal':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors = {
      'Business': 'bg-blue-500',
      'Environmental': 'bg-green-500',
      'Safety': 'bg-orange-500',
      'Health': 'bg-purple-500',
      'Fire': 'bg-red-500',
      'Building': 'bg-gray-500'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  const getStationBadgeColor = (station: string) => {
    switch (station.toUpperCase()) {
      case 'MOBIL':
        return 'bg-blue-600';
      case 'AMOCO ROSEDALE':
        return 'bg-green-600';
      case 'AMOCO BROOKLYN':
        return 'bg-purple-600';
      case 'ALL':
        return 'bg-gray-600';
      default:
        return 'bg-gray-600';
    }
  };

  if (!license) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto print:max-w-none print:shadow-none print:border-none">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center justify-between">
            <span>License Document Preview</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Print Content */}
        <div className="space-y-6 print:space-y-4">
          {/* Header */}
          <div className="text-center border-b pb-4 print:pb-2">
            <h1 className="text-2xl font-bold text-gray-900 print:text-xl">
              LICENSE & CERTIFICATE RECORD
            </h1>
            <p className="text-gray-600 mt-2 print:text-sm">
              Official Document Copy - {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* License Information Card */}
          <Card className="print:shadow-none print:border">
            <CardContent className="p-6 print:p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4">
                {/* Basic Information */}
                <div className="space-y-4 print:space-y-2">
                  <div>
                    <label className="text-sm font-medium text-gray-600 print:text-xs">License Name</label>
                    <p className="text-lg font-semibold print:text-base">{license.license_name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600 print:text-xs">License Number</label>
                    <p className="text-lg font-mono print:text-base">{license.license_number}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600 print:text-xs">Issuing Authority</label>
                    <p className="print:text-sm">{license.issuing_authority}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600 print:text-xs">Category</label>
                    <div className="mt-1">
                      <Badge className={`text-white ${getCategoryBadgeColor(license.category)} print:bg-gray-600 print:text-white`}>
                        {license.category}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Dates and Status */}
                <div className="space-y-4 print:space-y-2">
                  <div>
                    <label className="text-sm font-medium text-gray-600 print:text-xs">Issue Date</label>
                    <p className="print:text-sm">{formatDate(license.issue_date)}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600 print:text-xs">Expiry Date</label>
                    <p className="print:text-sm">{formatDate(license.expiry_date)}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600 print:text-xs">Station</label>
                    <div className="mt-1">
                      <Badge className={`text-white ${getStationBadgeColor(license.station)} print:bg-gray-600 print:text-white`}>
                        {license.station}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600 print:text-xs">Status</label>
                    <div className="mt-1">
                      <Badge className={`text-white ${getStatusBadgeColor(license.status)} print:bg-gray-600 print:text-white`}>
                        {license.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="print:shadow-none print:border">
            <CardContent className="p-6 print:p-4">
              <h3 className="text-lg font-semibold mb-4 print:text-base print:mb-2">Document Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
                <div>
                  <label className="text-sm font-medium text-gray-600 print:text-xs">Document ID</label>
                  <p className="print:text-sm">{license.ID}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 print:text-xs">File Reference</label>
                  <p className="print:text-sm">{license.document_file_id || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="border-t pt-4 print:pt-2 text-center text-sm text-gray-600 print:text-xs">
            <p>This document was generated on {new Date().toLocaleString()}</p>
            <p className="mt-1">License Management System - Gas Station Operations</p>
          </div>
        </div>

        <DialogFooter className="print:hidden">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handlePrint} className="flex items-center space-x-2">
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

};

export default PrintDialog;