import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Truck,
  Calendar,
  MapPin,
  FileText,
  Gauge,
  Fuel,
  User,
  Hash,
  Printer } from
'lucide-react';

interface DeliveryRecord {
  id: number;
  delivery_date: string;
  bol_number: string;
  station: string;
  regular_tank_volume: number;
  plus_tank_volume: number;
  super_tank_volume: number;
  regular_delivered: number;
  plus_delivered: number;
  super_delivered: number;
  delivery_notes: string;
  created_by: number;
}

interface DeliveryReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delivery: DeliveryRecord | null;
}

const DeliveryReportDialog: React.FC<DeliveryReportDialogProps> = ({
  open,
  onOpenChange,
  delivery
}) => {
  if (!delivery) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getTotalDelivered = () => {
    return delivery.regular_delivered + delivery.plus_delivered + delivery.super_delivered;
  };

  const getTotalTankVolume = () => {
    return delivery.regular_tank_volume + delivery.plus_tank_volume + delivery.super_tank_volume;
  };

  const getStationBadgeColor = (station: string) => {
    switch (station) {
      case 'MOBIL':
        return 'bg-red-100 text-red-800';
      case 'AMOCO ROSEDALE':
        return 'bg-blue-100 text-blue-800';
      case 'AMOCO BROOKLYN':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePrint = () => {
    // Create print content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Delivery Report - ${delivery.bol_number || `Record #${delivery.id}`}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .company-name { font-size: 24px; font-weight: bold; color: #333; }
            .report-title { font-size: 18px; color: #666; margin-top: 10px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
            .info-item { padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
            .info-label { font-size: 12px; color: #666; text-transform: uppercase; }
            .info-value { font-size: 14px; font-weight: bold; margin-top: 5px; }
            .fuel-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
            .fuel-item { text-align: center; padding: 15px; border: 2px solid; border-radius: 8px; }
            .fuel-regular { border-color: #3b82f6; background-color: #eff6ff; }
            .fuel-plus { border-color: #10b981; background-color: #f0fdf4; }
            .fuel-super { border-color: #8b5cf6; background-color: #faf5ff; }
            .fuel-total { border-color: #f59e0b; background-color: #fffbeb; }
            .fuel-amount { font-size: 24px; font-weight: bold; }
            .fuel-label { font-size: 12px; margin-top: 5px; }
            .notes { background-color: #f9fafb; padding: 15px; border-radius: 5px; border-left: 4px solid #3b82f6; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">DFS Manager Portal</div>
            <div class="report-title">Fuel Delivery Report</div>
          </div>

          <div class="section">
            <div class="section-title">Delivery Information</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Record ID</div>
                <div class="info-value">#${delivery.id}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Delivery Date</div>
                <div class="info-value">${formatDate(delivery.delivery_date)}</div>
              </div>
              <div class="info-item">
                <div class="info-label">BOL Number</div>
                <div class="info-value">${delivery.bol_number || 'Not Assigned'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Station</div>
                <div class="info-value">${delivery.station}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Tank Volumes Before Delivery</div>
            <div class="fuel-grid">
              <div class="fuel-item fuel-regular">
                <div class="fuel-amount">${formatNumber(delivery.regular_tank_volume)}</div>
                <div class="fuel-label">Regular Tank (gal)</div>
              </div>
              <div class="fuel-item fuel-plus">
                <div class="fuel-amount">${formatNumber(delivery.plus_tank_volume)}</div>
                <div class="fuel-label">Plus Tank (gal)</div>
              </div>
              <div class="fuel-item fuel-super">
                <div class="fuel-amount">${formatNumber(delivery.super_tank_volume)}</div>
                <div class="fuel-label">Super Tank (gal)</div>
              </div>
              <div class="fuel-item">
                <div class="fuel-amount">${formatNumber(getTotalTankVolume())}</div>
                <div class="fuel-label">Total Volume (gal)</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Fuel Delivered</div>
            <div class="fuel-grid">
              <div class="fuel-item fuel-regular">
                <div class="fuel-amount">${formatNumber(delivery.regular_delivered)}</div>
                <div class="fuel-label">Regular Delivered (gal)</div>
              </div>
              <div class="fuel-item fuel-plus">
                <div class="fuel-amount">${formatNumber(delivery.plus_delivered)}</div>
                <div class="fuel-label">Plus Delivered (gal)</div>
              </div>
              <div class="fuel-item fuel-super">
                <div class="fuel-amount">${formatNumber(delivery.super_delivered)}</div>
                <div class="fuel-label">Super Delivered (gal)</div>
              </div>
              <div class="fuel-item fuel-total">
                <div class="fuel-amount">${formatNumber(getTotalDelivered())}</div>
                <div class="fuel-label">Total Delivered (gal)</div>
              </div>
            </div>
          </div>

          ${delivery.delivery_notes ? `
          <div class="section">
            <div class="section-title">Delivery Notes</div>
            <div class="notes">${delivery.delivery_notes}</div>
          </div>
          ` : ''}

          <div class="footer">
            <div>Report generated on ${new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</div>
            <div>Created by User #${delivery.created_by} | DFS Manager Portal</div>
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
      printWindow.print();
      printWindow.close();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              Delivery Report - {delivery.bol_number || `Record #${delivery.id}`}
            </DialogTitle>
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">

              <Printer className="h-4 w-4" />
              Print Report
            </Button>
          </div>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Header Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Record ID</p>
                    <p className="font-semibold">#{delivery.id}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Delivery Date</p>
                    <p className="font-semibold">{formatDate(delivery.delivery_date)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">BOL Number</p>
                    <p className="font-semibold">{delivery.bol_number || 'Not Assigned'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Station</p>
                    <Badge className={getStationBadgeColor(delivery.station)}>
                      {delivery.station}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tank Volumes Before Delivery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Tank Volumes Before Delivery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatNumber(delivery.regular_tank_volume)}
                  </div>
                  <div className="text-sm text-blue-800">Regular Tank (gal)</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(delivery.plus_tank_volume)}
                  </div>
                  <div className="text-sm text-green-800">Plus Tank (gal)</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatNumber(delivery.super_tank_volume)}
                  </div>
                  <div className="text-sm text-purple-800">Super Tank (gal)</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">
                    {formatNumber(getTotalTankVolume())}
                  </div>
                  <div className="text-sm text-gray-800">Total Volume (gal)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fuel Delivered */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="h-5 w-5" />
                Fuel Delivered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatNumber(delivery.regular_delivered)}
                  </div>
                  <div className="text-sm text-blue-800 font-medium">Regular Delivered (gal)</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <div className="text-3xl font-bold text-green-600">
                    {formatNumber(delivery.plus_delivered)}
                  </div>
                  <div className="text-sm text-green-800 font-medium">Plus Delivered (gal)</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <div className="text-3xl font-bold text-purple-600">
                    {formatNumber(delivery.super_delivered)}
                  </div>
                  <div className="text-sm text-purple-800 font-medium">Super Delivered (gal)</div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                  <div className="text-3xl font-bold text-orange-600">
                    {formatNumber(getTotalDelivered())}
                  </div>
                  <div className="text-sm text-orange-800 font-medium">Total Delivered (gal)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Tank Capacity Utilization</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Regular:</span>
                      <span className="text-sm font-medium">
                        {delivery.regular_tank_volume > 0 ?
                        `${(delivery.regular_delivered / (delivery.regular_tank_volume + delivery.regular_delivered) * 100).toFixed(1)}%` :
                        'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Plus:</span>
                      <span className="text-sm font-medium">
                        {delivery.plus_tank_volume > 0 ?
                        `${(delivery.plus_delivered / (delivery.plus_tank_volume + delivery.plus_delivered) * 100).toFixed(1)}%` :
                        'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Super:</span>
                      <span className="text-sm font-medium">
                        {delivery.super_tank_volume > 0 ?
                        `${(delivery.super_delivered / (delivery.super_tank_volume + delivery.super_delivered) * 100).toFixed(1)}%` :
                        'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Delivery Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Regular:</span>
                      <span className="text-sm font-medium">
                        {getTotalDelivered() > 0 ?
                        `${(delivery.regular_delivered / getTotalDelivered() * 100).toFixed(1)}%` :
                        '0%'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Plus:</span>
                      <span className="text-sm font-medium">
                        {getTotalDelivered() > 0 ?
                        `${(delivery.plus_delivered / getTotalDelivered() * 100).toFixed(1)}%` :
                        '0%'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Super:</span>
                      <span className="text-sm font-medium">
                        {getTotalDelivered() > 0 ?
                        `${(delivery.super_delivered / getTotalDelivered() * 100).toFixed(1)}%` :
                        '0%'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Record Details</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Created by User #{delivery.created_by}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Notes */}
          {delivery.delivery_notes &&
          <Card>
              <CardHeader>
                <CardTitle>Delivery Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {delivery.delivery_notes}
                  </p>
                </div>
              </CardContent>
            </Card>
          }
        </div>
      </DialogContent>
    </Dialog>);

};

export default DeliveryReportDialog;