import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, ShoppingCart, Calendar, DollarSign, Eye, Download, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ViewModal from '@/components/ViewModal';
import { useListKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { motion } from 'motion/react';

interface Order {
  ID: number;
  order_number: string;
  vendor_id: number;
  order_date: string;
  expected_delivery: string;
  station: string;
  total_amount: number;
  status: string;
  notes: string;
  created_by: number;
}

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const navigate = useNavigate();
  const { userProfile, isAdmin } = useAuth();

  const pageSize = 10;

  useEffect(() => {
    loadOrders();
  }, [currentPage, searchTerm]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const filters = [];

      if (searchTerm) {
        filters.push({ name: 'order_number', op: 'StringContains', value: searchTerm });
      }

      const { data, error } = await window.ezsite.apis.tablePage('11730', {
        PageNo: currentPage,
        PageSize: pageSize,
        OrderByField: 'order_date',
        IsAsc: false,
        Filters: filters
      });

      if (error) throw error;

      setOrders(data?.List || []);
      setTotalCount(data?.VirtualCount || 0);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (order: Order) => {
    setSelectedOrder(order);
    setSelectedOrderId(order.ID);
    setViewModalOpen(true);
  };

  const handleEdit = (orderId: number) => {
    // Check edit permission - only Admin users can edit orders
    if (!isAdmin()) {
      toast({
        title: "Access Denied",
        description: "Only administrators can edit orders.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Validate order ID exists
      const order = orders.find((o) => o.ID === orderId);
      if (!order) {
        toast({
          title: "Error",
          description: "Order not found. Please refresh the list and try again.",
          variant: "destructive"
        });
        loadOrders(); // Refresh the list
        return;
      }

      // Navigate to edit form
      navigate(`/orders/${orderId}/edit`);


      // Log for debugging
      console.log('Navigating to edit order:', orderId, order);
    } catch (error) {
      console.error('Error navigating to edit form:', error);
      toast({
        title: "Navigation Error",
        description: "Failed to open edit form. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (orderId: number) => {
    // Check delete permission - only Admin users can delete orders
    if (!isAdmin()) {
      toast({
        title: "Access Denied",
        description: "Only administrators can delete orders.",
        variant: "destructive"
      });
      return;
    }

    // Validate order exists
    const order = orders.find((o) => o.ID === orderId);
    if (!order) {
      toast({
        title: "Error",
        description: "Order not found. Please refresh the list and try again.",
        variant: "destructive"
      });
      loadOrders();
      return;
    }

    if (!confirm(`Are you sure you want to delete order #${order.order_number}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await window.ezsite.apis.tableDelete('11730', { ID: orderId });
      if (error) throw error;

      toast({
        title: "Success",
        description: `Order #${order.order_number} deleted successfully`
      });
      loadOrders();
      setViewModalOpen(false);
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Error",
        description: `Failed to delete order #${order.order_number}`,
        variant: "destructive"
      });
    }
  };


  const handleExport = () => {
    if (!selectedOrder) return;

    const csvContent = [
    'Field,Value',
    `Order Number,${selectedOrder.order_number}`,
    `Vendor ID,${selectedOrder.vendor_id}`,
    `Order Date,${selectedOrder.order_date}`,
    `Expected Delivery,${selectedOrder.expected_delivery}`,
    `Station,${selectedOrder.station}`,
    `Total Amount,${selectedOrder.total_amount}`,
    `Status,${selectedOrder.status}`,
    `Notes,${selectedOrder.notes}`].
    join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order_${selectedOrder.order_number}_details.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Order details exported successfully"
    });
  };

  // Keyboard shortcuts
  useListKeyboardShortcuts(
    selectedOrderId,
    (id) => {
      const order = orders.find((o) => o.ID === id);
      if (order) handleView(order);
    },
    handleEdit,
    handleDelete,
    () => navigate('/orders/new')
  );

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500';
      case 'approved':
        return 'bg-blue-500';
      case 'shipped':
        return 'bg-purple-500';
      case 'delivered':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStationBadgeColor = (station: string) => {
    switch (station.toUpperCase()) {
      case 'MOBIL':
        return 'bg-blue-600';
      case 'AMOCO ROSEDALE':
        return 'bg-green-600';
      case 'AMOCO BROOKLYN':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  // Calculate totals for summary
  const totals = orders.reduce((acc, order) => ({
    total_amount: acc.total_amount + (order.total_amount || 0),
    pending_orders: acc.pending_orders + (order.status.toLowerCase() === 'pending' ? 1 : 0),
    delivered_orders: acc.delivered_orders + (order.status.toLowerCase() === 'delivered' ? 1 : 0)
  }), {
    total_amount: 0,
    pending_orders: 0,
    delivered_orders: 0
  });

  // Define view modal fields
  const getViewModalFields = (order: Order) => [
  {
    key: 'order_number',
    label: 'Order Number',
    value: order.order_number,
    type: 'text' as const,
    icon: FileText
  },
  {
    key: 'vendor_id',
    label: 'Vendor ID',
    value: order.vendor_id,
    type: 'number' as const
  },
  {
    key: 'order_date',
    label: 'Order Date',
    value: order.order_date,
    type: 'date' as const
  },
  {
    key: 'expected_delivery',
    label: 'Expected Delivery',
    value: order.expected_delivery,
    type: 'date' as const
  },
  {
    key: 'station',
    label: 'Station',
    value: order.station,
    type: 'badge' as const,
    badgeColor: getStationBadgeColor(order.station)
  },
  {
    key: 'total_amount',
    label: 'Total Amount',
    value: order.total_amount,
    type: 'currency' as const
  },
  {
    key: 'status',
    label: 'Status',
    value: order.status,
    type: 'badge' as const,
    badgeColor: getStatusBadgeColor(order.status)
  },
  {
    key: 'notes',
    label: 'Notes',
    value: order.notes,
    type: 'text' as const
  }];



  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Order Value</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.total_amount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold">{totals.pending_orders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Delivered Orders</p>
                <p className="text-2xl font-bold">{totals.delivered_orders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <ShoppingCart className="w-6 h-6" />
                <span>Orders</span>
              </CardTitle>
              <CardDescription>
                Manage your purchase orders and deliveries
              </CardDescription>
            </div>
            <Button onClick={() => navigate('/orders/new')} className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Create Order</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10" />

            </div>
          </div>

          {/* Orders Table */}
          {loading ?
          <div className="space-y-4">
              {[...Array(5)].map((_, i) =>
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
            )}
            </div> :
          orders.length === 0 ?
          <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No orders found</p>
              <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/orders/new')}>

                Create Your First Order
              </Button>
            </div> :

          <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order, index) =>
                <motion.tr
                  key={order.ID}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`border-b hover:bg-gray-50 transition-colors cursor-pointer ${
                  selectedOrderId === order.ID ? 'bg-blue-50 border-blue-200' : ''}`
                  }
                  onClick={() => setSelectedOrderId(order.ID)}>

                      <TableCell className="font-medium">
                        {order.order_number}
                        {order.notes &&
                    <p className="text-sm text-gray-500 truncate max-w-xs mt-1">
                            {order.notes}
                          </p>
                    }
                      </TableCell>
                      <TableCell>{formatDate(order.order_date)}</TableCell>
                      <TableCell>
                        <Badge className={`text-white ${getStationBadgeColor(order.station)}`}>
                          {order.station}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(order.total_amount)}
                      </TableCell>
                      <TableCell>{formatDate(order.expected_delivery)}</TableCell>
                      <TableCell>
                        <Badge className={`text-white ${getStatusBadgeColor(order.status)}`}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(order);
                        }}
                        className="text-blue-600 hover:text-blue-700">

                            <Eye className="w-4 h-4" />
                          </Button>
                          {/* Only show Edit button if user is Administrator */}
                          {isAdmin() &&
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(order.ID);
                        }}
                        title="Edit Order">
                              <Edit className="w-4 h-4" />
                            </Button>
                      }
                          
                          {/* Only show Delete button if user is Administrator */}
                          {isAdmin() &&
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(order.ID);
                        }}
                        className="text-red-600 hover:text-red-700"
                        title="Delete Order">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                      }

                        </div>
                      </TableCell>
                    </motion.tr>
                )}
                </TableBody>
              </Table>
            </div>
          }

          {/* Show permission status when actions are disabled */}
          {!isAdmin() &&
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">
                <strong>Access Restrictions:</strong>
                Only administrators can edit or delete orders.
              </p>
            </div>
          }

          {/* Pagination */}
          {totalPages > 1 &&
          <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-700">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} orders
              </p>
              <div className="flex items-center space-x-2">
                <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}>

                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}>

                  Next
                </Button>
              </div>
            </div>
          }
        </CardContent>
      </Card>
      
      {/* View Modal */}
      {selectedOrder &&
      <ViewModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedOrder(null);
          setSelectedOrderId(null);
        }}
        title={`Order #${selectedOrder.order_number}`}
        subtitle={`${selectedOrder.station} • ${formatCurrency(selectedOrder.total_amount)} • ${selectedOrder.status}`}
        data={selectedOrder}
        fields={getViewModalFields(selectedOrder)}
        onEdit={() => {
          setViewModalOpen(false);
          handleEdit(selectedOrder.ID);
        }}
        onDelete={() => handleDelete(selectedOrder.ID)}
        onExport={handleExport}
        canEdit={isAdmin()}
        canDelete={isAdmin()}
        canExport={true} />

      }
    </div>);


};

export default OrderList;