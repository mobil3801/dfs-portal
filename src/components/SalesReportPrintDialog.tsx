import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Printer, X } from 'lucide-react';

interface SalesReport {
  ID: number;
  report_date: string;
  station: string;
  total_sales: number;
  cash_sales: number;
  credit_card_sales: number;
  fuel_sales: number;
  convenience_sales: number;
  employee_id: string;
  notes: string;
  created_by: number;
}

interface SalesReportPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: SalesReport | null;
}

const SalesReportPrintDialog: React.FC<SalesReportPrintDialogProps> = ({
  open,
  onOpenChange,
  report
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStationBadgeColor = (station: string) => {
    switch (station.toUpperCase()) {
      case 'MOBIL':
        return 'bg-blue-500';
      case 'AMOCO ROSEDALE':
        return 'bg-green-500';
      case 'AMOCO BROOKLYN':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!report) return null;

  const cashAndCardTotal = (parseFloat(report.cash_sales) || 0) + (parseFloat(report.credit_card_sales) || 0);
  const fuelAndConvenienceTotal = (parseFloat(report.fuel_sales) || 0) + (parseFloat(report.convenience_sales) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Printer className="w-5 h-5" />
            <span>Daily Sales Report - Document Print</span>
          </DialogTitle>
        </DialogHeader>

        {/* Print Content */}
        <div className="print-content space-y-6">
          {/* Header */}
          <div className="text-center border-b-2 border-gray-300 pb-4">
            <h1 className="text-2xl font-bold text-gray-800">Daily Sales Report</h1>
            <p className="text-gray-600">Gas Station Management System</p>
          </div>

          {/* Report Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-3 text-gray-800">Report Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Report Date:</span>
                    <span className="font-medium">{formatDate(report.report_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Station:</span>
                    <Badge className={`text-white ${getStationBadgeColor(report.station)}`}>
                      {report.station}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Employee ID:</span>
                    <span className="font-medium">{report.employee_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Report ID:</span>
                    <span className="font-medium">#{report.ID}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-3 text-gray-800">Total Sales Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xl">
                    <span className="text-gray-600">Total Sales:</span>
                    <span className="font-bold text-green-600">{formatCurrency(report.total_sales)}</span>
                  </div>
                  <div className="text-sm text-gray-500 pt-2 border-t">
                    <div className="flex justify-between">
                      <span>Payment Verification:</span>
                      <span className={Math.abs(cashAndCardTotal - parseFloat(report.total_sales)) <= 0.01 ? 'text-green-600' : 'text-red-600'}>
                        {Math.abs(cashAndCardTotal - parseFloat(report.total_sales)) <= 0.01 ? '✓ Verified' : '⚠️ Discrepancy'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sales Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-3 text-gray-800">Payment Methods</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cash Sales:</span>
                    <span className="font-medium">{formatCurrency(report.cash_sales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Credit Card Sales:</span>
                    <span className="font-medium">{formatCurrency(report.credit_card_sales)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold text-gray-800">Payment Total:</span>
                    <span className="font-bold">{formatCurrency(cashAndCardTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-3 text-gray-800">Sales Categories</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fuel Sales:</span>
                    <span className="font-medium text-blue-600">{formatCurrency(report.fuel_sales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Convenience Sales:</span>
                    <span className="font-medium text-purple-600">{formatCurrency(report.convenience_sales)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold text-gray-800">Category Total:</span>
                    <span className="font-bold">{formatCurrency(fuelAndConvenienceTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes Section */}
          {report.notes &&
          <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-3 text-gray-800">Notes</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{report.notes}</p>
              </CardContent>
            </Card>
          }

          {/* Validation Summary */}
          <Card className="border-2 border-gray-300">
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-3 text-gray-800">Report Validation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Payment Method Total:</span>
                  <span className={Math.abs(cashAndCardTotal - parseFloat(report.total_sales)) <= 0.01 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {Math.abs(cashAndCardTotal - parseFloat(report.total_sales)) <= 0.01 ? '✓ Matches Total Sales' : '⚠️ Does not match Total Sales'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Category Breakdown:</span>
                  <span className={fuelAndConvenienceTotal <= parseFloat(report.total_sales) + 0.01 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {fuelAndConvenienceTotal <= parseFloat(report.total_sales) + 0.01 ? '✓ Within Range' : '⚠️ Exceeds Total'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 border-t pt-4">
            <p>This is an official document generated by the Gas Station Management System</p>
            <p>Generated on: {new Date().toLocaleString()}</p>
          </div>
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content,
          .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white;
          }
          
          /* Hide dialog chrome when printing */
          [role="dialog"] {
            box-shadow: none !important;
            border: none !important;
          }
          
          /* Ensure proper page breaks */
          .print-content {
            page-break-inside: avoid;
          }
          
          /* Optimize text for print */
          .print-content {
            font-size: 12pt;
            line-height: 1.4;
            color: black;
          }
          
          /* Ensure badges print correctly */
          .print-content .bg-blue-500 {
            background-color: #3b82f6 !important;
            -webkit-print-color-adjust: exact;
          }
          .print-content .bg-green-500 {
            background-color: #10b981 !important;
            -webkit-print-color-adjust: exact;
          }
          .print-content .bg-purple-500 {
            background-color: #8b5cf6 !important;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </Dialog>);

};

export default SalesReportPrintDialog;