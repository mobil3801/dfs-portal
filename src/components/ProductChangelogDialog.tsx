import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { FileText, Calendar, User, Clock, TrendingUp, X, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface ChangelogEntry {
  ID: number;
  product_id: number;
  field_name: string;
  old_value: string;
  new_value: string;
  change_timestamp: string;
  changed_by: number;
  change_type: string;
  change_summary: string;
}

interface ProductChangelogDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
  productName: string;
}

const ProductChangelogDialog: React.FC<ProductChangelogDialogProps> = ({
  isOpen,
  onClose,
  productId,
  productName
}) => {
  const [changes, setChanges] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [userNames, setUserNames] = useState<{[key: number]: string;}>({});

  useEffect(() => {
    if (isOpen && productId) {
      fetchChangelog();
    }
  }, [isOpen, productId]);

  const fetchChangelog = async () => {
    setLoading(true);
    try {
      // Fetch changelog entries for this product
      const { data, error } = await window.ezsite.apis.tablePage('24010', {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'change_timestamp',
        IsAsc: false,
        Filters: [
        { name: 'product_id', op: 'Equal', value: productId }]

      });

      if (error) throw error;

      const changelogEntries = data?.List || [];
      setChanges(changelogEntries);

      // Fetch user names for all users who made changes
      const userIds = [...new Set(changelogEntries.map((change: ChangelogEntry) => change.changed_by))];
      await fetchUserNames(userIds);

    } catch (error) {
      console.error('Error fetching changelog:', error);
      toast({
        title: "Error",
        description: "Failed to load changelog data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserNames = async (userIds: number[]) => {
    try {
      const names: {[key: number]: string;} = {};

      // Fetch user profiles to get names
      for (const userId of userIds) {
        try {
          const { data, error } = await window.ezsite.apis.tablePage('11725', {
            PageNo: 1,
            PageSize: 1,
            OrderByField: 'id',
            IsAsc: true,
            Filters: [
            { name: 'user_id', op: 'Equal', value: userId }]

          });

          if (!error && data?.List?.[0]) {
            const profile = data.List[0];
            names[userId] = `${profile.employee_id || 'Unknown'} (ID: ${userId})`;
          } else {
            names[userId] = `User ${userId}`;
          }
        } catch (error) {
          names[userId] = `User ${userId}`;
        }
      }

      setUserNames(names);
    } catch (error) {
      console.error('Error fetching user names:', error);
    }
  };

  const formatFieldName = (fieldName: string) => {
    const fieldMap: {[key: string]: string;} = {
      'last_shopping_date': 'Last Shopping Date',
      'case_price': 'Case Price',
      'unit_per_case': 'Unit Per Case',
      'unit_price': 'Unit Price',
      'retail_price': 'Retail Price',
      'profit_margin': 'Profit Margin',
      'product_name': 'Product Name',
      'category': 'Category',
      'supplier': 'Supplier',
      'weight': 'Weight',
      'weight_unit': 'Weight Unit',
      'department': 'Department',
      'description': 'Description',
      'quantity_in_stock': 'Stock Quantity',
      'minimum_stock': 'Minimum Stock'
    };
    return fieldMap[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatValue = (fieldName: string, value: string) => {
    if (!value) return 'Empty';

    if (fieldName.includes('price') || fieldName === 'profit_margin') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        if (fieldName === 'profit_margin') {
          return `${numValue.toFixed(2)}%`;
        }
        return `$${numValue.toFixed(2)}`;
      }
    }

    if (fieldName.includes('date')) {
      try {
        return format(new Date(value), 'MMM dd, yyyy');
      } catch {
        return value;
      }
    }

    return value;
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType.toLowerCase()) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getValueChangeIndicator = (fieldName: string, oldValue: string, newValue: string) => {
    if (fieldName.includes('price')) {
      const oldNum = parseFloat(oldValue);
      const newNum = parseFloat(newValue);
      if (!isNaN(oldNum) && !isNaN(newNum)) {
        if (newNum > oldNum) {
          return <TrendingUp className="w-4 h-4 text-green-600 inline ml-1" />;
        } else if (newNum < oldNum) {
          return <TrendingUp className="w-4 h-4 text-red-600 inline ml-1 rotate-180" />;
        }
      }
    }
    return null;
  };

  const groupChangesByDate = (changes: ChangelogEntry[]) => {
    const grouped: {[key: string]: ChangelogEntry[];} = {};

    changes.forEach((change) => {
      const date = format(new Date(change.change_timestamp), 'yyyy-MM-dd');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(change);
    });

    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));
  };

  const groupedChanges = groupChangesByDate(changes);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Product Changelog</span>
              </DialogTitle>
              <DialogDescription>
                Change history for <strong>{productName}</strong> (Product ID: {productId})
              </DialogDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchChangelog}
                disabled={loading}
                className="flex items-center space-x-1">

                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {loading ?
          <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Loading changelog...</span>
              </div>
            </div> :
          changes.length === 0 ?
          <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Changes Found</h3>
              <p className="text-gray-500">
                This product has no recorded changes yet.
              </p>
            </div> :

          <div className="space-y-6">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Change Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{changes.length}</div>
                      <div className="text-sm text-gray-500">Total Changes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {changes.filter((c) => c.change_type === 'create').length}
                      </div>
                      <div className="text-sm text-gray-500">Created</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {changes.filter((c) => c.change_type === 'update').length}
                      </div>
                      <div className="text-sm text-gray-500">Updated</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Changes by Date */}
              <div className="space-y-4">
                {groupedChanges.map(([date, dateChanges]) =>
              <Card key={date}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-base">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(date), 'EEEE, MMMM dd, yyyy')}</span>
                        <Badge variant="secondary">{dateChanges.length} changes</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {dateChanges.map((change) =>
                    <div key={change.ID} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <Badge className={getChangeTypeColor(change.change_type)}>
                                  {change.change_type.toUpperCase()}
                                </Badge>
                                <span className="font-medium">
                                  {formatFieldName(change.field_name)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 flex items-center space-x-4">
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{format(new Date(change.change_timestamp), 'h:mm aa')}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <User className="w-3 h-3" />
                                  <span>{userNames[change.changed_by] || `User ${change.changed_by}`}</span>
                                </div>
                              </div>
                            </div>
                            
                            {change.change_type === 'update' &&
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <div className="text-gray-500 mb-1">Previous Value:</div>
                                  <div className="bg-red-50 border border-red-200 rounded px-3 py-2">
                                    {formatValue(change.field_name, change.old_value)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-500 mb-1">New Value:</div>
                                  <div className="bg-green-50 border border-green-200 rounded px-3 py-2 flex items-center">
                                    {formatValue(change.field_name, change.new_value)}
                                    {getValueChangeIndicator(change.field_name, change.old_value, change.new_value)}
                                  </div>
                                </div>
                              </div>
                      }
                            
                            {change.change_type === 'create' &&
                      <div className="text-sm">
                                <div className="text-gray-500 mb-1">Initial Value:</div>
                                <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2">
                                  {formatValue(change.field_name, change.new_value)}
                                </div>
                              </div>
                      }
                            
                            {change.change_summary &&
                      <div className="mt-3 text-sm text-gray-600">
                                <strong>Summary:</strong> {change.change_summary}
                              </div>
                      }
                          </div>
                    )}
                      </div>
                    </CardContent>
                  </Card>
              )}
              </div>
            </div>
          }
        </div>

        <Separator className="my-4" />
        
        <div className="flex justify-end space-x-2 flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>);

};

export default ProductChangelogDialog;