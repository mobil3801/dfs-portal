import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { X, Printer, FileText, Calendar, MapPin, Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

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

interface EnhancedLicensePrintDialogProps {
  license: License | null;
  isOpen: boolean;
  onClose: () => void;
}

const EnhancedLicensePrintDialog: React.FC<EnhancedLicensePrintDialogProps> = ({ license, isOpen, onClose }) => {
  if (!license) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateShort = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusInfo = (status: string, expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));

    switch (status.toLowerCase()) {
      case 'active':
        if (daysUntilExpiry <= 30) {
          return {
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200',
            icon: '⚠️',
            message: `Expires in ${daysUntilExpiry} days - Renewal Required Soon`
          };
        } else if (daysUntilExpiry <= 90) {
          return {
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            icon: '📅',
            message: `Expires in ${daysUntilExpiry} days - Plan Renewal`
          };
        }
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: '✅',
          message: 'Active and Valid'
        };
      case 'expired':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: '❌',
          message: `Expired ${Math.abs(daysUntilExpiry)} days ago - Immediate Action Required`
        };
      case 'pending renewal':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: '⏳',
          message: 'Renewal in Progress'
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: '❓',
          message: 'Status Unknown'
        };
    }
  };

  const getCategoryInfo = (category: string) => {
    const categoryMap = {
      'Business': { icon: '🏢', description: 'General business operations license' },
      'Environmental': { icon: '🌱', description: 'Environmental compliance and permits' },
      'Safety': { icon: '🦺', description: 'Safety regulations and protocols' },
      'Health': { icon: '🏥', description: 'Public health requirements' },
      'Fire': { icon: '🔥', description: 'Fire safety and prevention' },
      'Building': { icon: '🏗️', description: 'Construction and building permits' }
    };
    return categoryMap[category as keyof typeof categoryMap] || { icon: '📄', description: 'License certification' };
  };

  const getStationInfo = (station: string) => {
    const stationMap = {
      'MOBIL': { color: 'bg-red-500', description: 'Mobil Gas Station' },
      'AMOCO ROSEDALE': { color: 'bg-blue-500', description: 'Amoco Rosedale Station' },
      'AMOCO BROOKLYN': { color: 'bg-green-500', description: 'Amoco Brooklyn Station' },
      'ALL': { color: 'bg-gray-500', description: 'All Station Locations' }
    };
    return stationMap[station as keyof typeof stationMap] || { color: 'bg-gray-500', description: station };
  };

  const statusInfo = getStatusInfo(license.status, license.expiry_date);
  const categoryInfo = getCategoryInfo(license.category);
  const stationInfo = getStationInfo(license.station);

  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>License Certificate - ${license.license_name}</title>
          <style>
            @page {
              size: A4;
              margin: 0.5in;
            }
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 0;
              color: #333;
              line-height: 1.5;
            }
            .certificate-header {
              text-align: center;
              margin-bottom: 40px;
              border: 3px solid #2563eb;
              padding: 30px;
              border-radius: 15px;
              background: linear-gradient(135deg, #f8fafc, #e2e8f0);
            }
            .company-logo {
              font-size: 32px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 10px;
            }
            .certificate-title {
              font-size: 24px;
              color: #374151;
              margin-bottom: 15px;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .certificate-subtitle {
              font-size: 16px;
              color: #6b7280;
              font-style: italic;
            }
            .license-info {
              background: white;
              border: 2px solid #e5e7eb;
              border-radius: 10px;
              padding: 30px;
              margin: 30px 0;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .license-name {
              font-size: 28px;
              font-weight: bold;
              text-align: center;
              color: #1f2937;
              margin-bottom: 20px;
              padding: 15px;
              background: #f3f4f6;
              border-radius: 8px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin: 25px 0;
            }
            .info-item {
              padding: 15px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              background: #fafafa;
            }
            .info-label {
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
              font-weight: 600;
              margin-bottom: 8px;
            }
            .info-value {
              font-size: 16px;
              font-weight: bold;
              color: #1f2937;
            }
            .status-section {
              background: ${statusInfo.bgColor};
              border: 2px solid ${statusInfo.borderColor.replace('border-', '')};
              border-radius: 10px;
              padding: 20px;
              margin: 25px 0;
              text-align: center;
            }
            .status-icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .status-message {
              font-size: 18px;
              font-weight: bold;
              color: ${statusInfo.color.replace('text-', '')};
              margin-bottom: 10px;
            }
            .dates-section {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin: 25px 0;
            }
            .date-card {
              text-align: center;
              padding: 20px;
              border: 2px solid #e5e7eb;
              border-radius: 10px;
              background: white;
            }
            .date-label {
              font-size: 14px;
              color: #6b7280;
              text-transform: uppercase;
              font-weight: 600;
              margin-bottom: 10px;
            }
            .date-value {
              font-size: 18px;
              font-weight: bold;
              color: #1f2937;
            }
            .authority-section {
              background: #f0f9ff;
              border: 2px solid #0ea5e9;
              border-radius: 10px;
              padding: 20px;
              margin: 25px 0;
            }
            .category-badge {
              display: inline-block;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
              margin: 5px;
            }
            .station-badge {
              background: ${stationInfo.color};
              color: white;
            }
            .category-business { background: #dbeafe; color: #1e40af; }
            .category-environmental { background: #dcfce7; color: #166534; }
            .category-safety { background: #fed7aa; color: #c2410c; }
            .category-health { background: #e9d5ff; color: #7c2d12; }
            .category-fire { background: #fecaca; color: #dc2626; }
            .category-building { background: #f3f4f6; color: #374151; }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
              border-top: 2px solid #e5e7eb;
              padding-top: 30px;
            }
            .official-seal {
              position: absolute;
              top: 20px;
              right: 20px;
              width: 80px;
              height: 80px;
              border: 3px solid #2563eb;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              background: white;
              font-size: 10px;
              text-align: center;
              font-weight: bold;
              color: #2563eb;
            }
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 120px;
              color: rgba(37, 99, 235, 0.05);
              font-weight: bold;
              z-index: -1;
              pointer-events: none;
            }
            @media print {
              body { font-size: 11pt; }
            }
          </style>
        </head>
        <body>
          <div class="watermark">OFFICIAL</div>
          <div class="official-seal">
            DFS<br>OFFICIAL<br>SEAL
          </div>

          <div class="certificate-header">
            <div class="company-logo">DFS Manager Portal</div>
            <div class="certificate-title">License & Certificate Record</div>
            <div class="certificate-subtitle">Official Documentation System</div>
          </div>

          <div class="license-info">
            <div class="license-name">${license.license_name}</div>
            
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">License Number</div>
                <div class="info-value" style="font-family: monospace; font-size: 18px;">${license.license_number}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Record ID</div>
                <div class="info-value">#${license.ID}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Category</div>
                <div class="info-value">
                  <span class="category-badge category-${license.category.toLowerCase()}">${categoryInfo.icon} ${license.category}</span>
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">Station Coverage</div>
                <div class="info-value">
                  <span class="category-badge station-badge">${license.station}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="dates-section">
            <div class="date-card">
              <div class="date-label">📅 Issue Date</div>
              <div class="date-value">${formatDate(license.issue_date)}</div>
            </div>
            <div class="date-card">
              <div class="date-label">⏰ Expiry Date</div>
              <div class="date-value">${formatDate(license.expiry_date)}</div>
            </div>
          </div>

          <div class="status-section">
            <div class="status-icon">${statusInfo.icon}</div>
            <div class="status-message">${license.status.toUpperCase()}</div>
            <div style="font-size: 14px; color: #6b7280;">${statusInfo.message}</div>
          </div>

          <div class="authority-section">
            <div class="info-label">Issuing Authority</div>
            <div style="font-size: 20px; font-weight: bold; color: #0ea5e9; margin-top: 10px;">
              ${license.issuing_authority}
            </div>
            <div style="font-size: 14px; color: #6b7280; margin-top: 10px;">
              ${categoryInfo.description}
            </div>
          </div>

          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <div class="info-label">Document Information</div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px;">
              <div>
                <span style="font-size: 12px; color: #6b7280;">File Reference ID:</span><br>
                <span style="font-weight: bold;">${license.document_file_id || 'Not Available'}</span>
              </div>
              <div>
                <span style="font-size: 12px; color: #6b7280;">Created by User:</span><br>
                <span style="font-weight: bold;">#${license.created_by}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <div style="font-weight: bold; margin-bottom: 10px;">
              This is an official license certificate document
            </div>
            <div>
              Generated on ${new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}
            </div>
            <div style="margin-top: 15px; font-style: italic;">
              DFS Manager Portal - License Management System v2.0
            </div>
            <div style="margin-top: 10px; font-size: 10px;">
              This document is valid only when accompanied by the original license certificate.
              For verification, contact the issuing authority directly.
            </div>
          </div>
        </body>
      </html>
    `;

    // Open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Enhanced License Certificate - {license.license_name}
            </DialogTitle>
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              <Printer className="h-4 w-4" />
              Print Certificate
            </Button>
          </div>
        </DialogHeader>

        {/* Preview Content */}
        <div className="space-y-6">
          {/* Header Info */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <div className="text-center">
                <CardTitle className="text-2xl text-blue-800 mb-2">{license.license_name}</CardTitle>
                <div className="flex items-center justify-center gap-4">
                  <Badge className={`${stationInfo.color} text-white`}>{license.station}</Badge>
                  <Badge variant="outline" className="text-blue-600">{license.license_number}</Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Status Card */}
          <Card className={`border-2 ${statusInfo.borderColor} ${statusInfo.bgColor}`}>
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">{statusInfo.icon}</div>
              <div className={`text-xl font-bold ${statusInfo.color} mb-2`}>{license.status.toUpperCase()}</div>
              <div className="text-sm text-gray-600">{statusInfo.message}</div>
            </CardContent>
          </Card>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  License Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs text-gray-600 uppercase font-medium">Category</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg">{categoryInfo.icon}</span>
                    <div>
                      <div className="font-medium">{license.category}</div>
                      <div className="text-xs text-gray-500">{categoryInfo.description}</div>
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <div className="text-xs text-gray-600 uppercase font-medium">Issuing Authority</div>
                  <div className="font-medium mt-1">{license.issuing_authority}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 uppercase font-medium">Document File ID</div>
                  <div className="font-medium mt-1">{license.document_file_id || 'Not Available'}</div>
                </div>
              </CardContent>
            </Card>

            {/* Dates and Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Important Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs text-gray-600 uppercase font-medium">Issue Date</div>
                  <div className="font-medium mt-1">{formatDate(license.issue_date)}</div>
                </div>
                <Separator />
                <div>
                  <div className="text-xs text-gray-600 uppercase font-medium">Expiry Date</div>
                  <div className="font-medium mt-1">{formatDate(license.expiry_date)}</div>
                </div>
                <Separator />
                <div>
                  <div className="text-xs text-gray-600 uppercase font-medium">Station Coverage</div>
                  <div className="mt-1">
                    <Badge className={`${stationInfo.color} text-white`}>
                      {license.station}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">{stationInfo.description}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Record ID:</span>
                  <span className="font-medium">#{license.ID}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created by User:</span>
                  <span className="font-medium">#{license.created_by}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Document Generated:</span>
                  <span className="font-medium">{formatDateShort(new Date().toISOString())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">System Version:</span>
                  <span className="font-medium">DFS Portal v2.0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
            <Printer className="w-4 h-4 mr-2" />
            Print Certificate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

};

export default EnhancedLicensePrintDialog;