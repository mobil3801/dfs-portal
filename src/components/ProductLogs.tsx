import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle } from
'@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Calendar, TrendingUp, DollarSign, Package, ArrowRight } from 'lucide-react';

interface ProductLog {
  ID: number;
  product_id: number;
  field_name: string;
  old_value: string;
  new_value: string;
  change_date: string;
  changed_by: number;
}

interface ProductLogsProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
  productName: string;
}

const ProductLogs: React.FC<ProductLogsProps> = ({ isOpen, onClose, productId, productName }) => {
  const [logs, setLogs] = useState<ProductLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && productId) {
      loadProductLogs();
    }
  }, [isOpen, productId]);

  const loadProductLogs = async () => {
    try {
      setLoading(true);
      console.log('Loading product logs for product ID:', productId);

      const { data, error } = await window.ezsite.apis.tablePage('11756', {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'change_date',
        IsAsc: false,
        Filters: [
        { name: 'product_id', op: 'Equal', value: productId }]

      });

      if (error) {
        console.error('API error loading logs:', error);
        throw error;
      }

      console.log('Loaded logs:', data?.List || []);
      setLogs(data?.List || []);
    } catch (error) {
      console.error('Error loading product logs:', error);
      toast({
        title: "Error",
        description: `Failed to load product change logs: ${error}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return '-';
    }
  };

  const formatValue = (fieldName: string, value: string) => {
    if (!value || value === '') return '-';

    // Format price fields with currency
    if (fieldName.includes('price') || fieldName === 'profit_margin') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        return `$${numValue.toFixed(2)}`;
      }
    }

    // Format date fields
    if (fieldName.includes('date')) {
      try {
        return new Date(value).toLocaleDateString();
      } catch {
        return value;
      }
    }

    return value;
  };

  const getFieldIcon = (fieldName: string) => {
    switch (fieldName) {
      case 'last_shopping_date':
        return <Calendar className="w-4 h-4" />;
      case 'case_price':
      case 'unit_price':
      case 'retail_price':
        return <DollarSign className="w-4 h-4" />;
      case 'unit_per_case':
        return <Package className="w-4 h-4" />;
      case 'profit_margin':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getFieldDisplayName = (fieldName: string) => {
    switch (fieldName) {
      case 'last_shopping_date':
        return 'Last Shopping Date';
      case 'case_price':
        return 'Case Price';
      case 'unit_per_case':
        return 'Unit Per Case';
      case 'unit_price':
        return 'Unit Price';
      case 'retail_price':
        return 'Retail Price';
      case 'profit_margin':
        return 'Profit Margin';
      default:
        return fieldName.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  const getFieldColor = (fieldName: string) => {
    switch (fieldName) {
      case 'last_shopping_date':
        return 'bg-blue-100 text-blue-800';
      case 'case_price':
        return 'bg-green-100 text-green-800';
      case 'unit_per_case':
        return 'bg-purple-100 text-purple-800';
      case 'unit_price':
        return 'bg-orange-100 text-orange-800';
      case 'retail_price':
        return 'bg-red-100 text-red-800';
      case 'profit_margin':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Product Change Logs</span>
          </DialogTitle>
          <DialogDescription>
            Change history for: <span className="font-medium">{productName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {loading ?
          <div className="space-y-4">
              {[...Array(5)].map((_, i) =>
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
            )}
            </div> :
          logs.length === 0 ?
          <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No change logs found for this product</p>
              <p className="text-sm text-gray-400 mt-2">
                Changes will appear here when product information is updated
              </p>
            </div> :

          <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>Change Date</TableHead>
                    <TableHead>Old Value</TableHead>
                    <TableHead className="text-center">→</TableHead>
                    <TableHead>New Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) =>
                <TableRow key={log.ID}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getFieldIcon(log.field_name)}
                          <Badge className={getFieldColor(log.field_name)}>
                            {getFieldDisplayName(log.field_name)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(log.change_date)}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-sm">
                          {formatValue(log.field_name, log.old_value)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-sm">
                          {formatValue(log.field_name, log.new_value)}
                        </span>
                      </TableCell>
                    </TableRow>
                )}
                </TableBody>
              </Table>
            </div>
          }
        </div>
      </DialogContent>
    </Dialog>);

};

export default ProductLogs;