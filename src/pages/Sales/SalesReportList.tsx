import React, { useState, useEffect } from 'react';
import { generateSafeKey, safeMap } from '@/utils/invariantSafeHelper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, TrendingUp, DollarSign, Calendar, Printer, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useModuleAccess } from '@/contexts/ModuleAccessContext';
import EnhancedSalesReportPrintDialog from '@/components/EnhancedSalesReportPrintDialog';
import StationDropdown from '@/components/StationDropdown';
import { useStationFilter } from '@/hooks/use-station-options';

interface SalesReport {
  ID: number;
  report_date: string;
  station: string;
  shift: string;
  employee_name: string;
  cash_collection_on_hand: number;
  total_short_over: number;
  credit_card_amount: number;
  debit_card_amount: number;
  mobile_amount: number;
  cash_amount: number;
  grocery_sales: number;
  ebt_sales: number;
  lottery_net_sales: number;
  scratch_off_sales: number;
  lottery_total_cash: number;
  regular_gallons: number;
  super_gallons: number;
  diesel_gallons: number;
  total_gallons: number;
  expenses_data: string;
  day_report_file_id?: number;
  veeder_root_file_id?: number;
  lotto_report_file_id?: number;
  scratch_off_report_file_id?: number;
  total_sales: number;
  notes: string;
  created_by: number;
}

const SalesReportList: React.FC = () => {
  const [reports, setReports] = useState<SalesReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStation, setSelectedStation] = useState('ALL_STATIONS');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<SalesReport | null>(null);
  const navigate = useNavigate();
  const { userProfile, isAdmin } = useAuth();

  // Module Access Control
  const {
    canCreate,
    canEdit,
    canDelete,
    isModuleAccessEnabled
  } = useModuleAccess();

  // Permission checks for sales module
  const canCreateSales = canCreate('sales');
  const canEditSales = canEdit('sales') && isAdmin(); // Restrict edit to admin only
  const canDeleteSales = canDelete('sales') && isAdmin(); // Restrict delete to admin only

  const pageSize = 10;

  // Use station filter hook to handle ALL vs specific station filtering
  const { stationFilters, isAllSelected } = useStationFilter(selectedStation);

  useEffect(() => {
    loadReports();
  }, [currentPage, searchTerm, selectedStation]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const filters = [];

      // Add station filter based on selection
      if (stationFilters) {
        filters.push(...stationFilters);
      }

      // Add search filter if provided
      if (searchTerm) {
        filters.push({ name: 'station', op: 'StringContains', value: searchTerm });
      }

      const { data, error } = await window.ezsite.apis.tablePage('12356', {
        PageNo: currentPage,
        PageSize: pageSize,
        OrderByField: 'report_date',
        IsAsc: false,
        Filters: filters
      });

      if (error) throw error;

      setReports(data?.List || []);
      setTotalCount(data?.VirtualCount || 0);
    } catch (error) {
      console.error('Error loading sales reports:', error);
      toast({
        title: "Error",
        description: "Failed to load sales reports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId: number) => {
    // Check delete permission - only admin users can delete
    if (!canDeleteSales) {
      toast({
        title: "Access Denied",
        description: "Only administrators can delete sales reports.",
        variant: "destructive"
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this sales report?')) {
      return;
    }

    try {
      const { error } = await window.ezsite.apis.tableDelete('12356', { ID: reportId });
      if (error) throw error;

      toast({
        title: "Success",
        description: "Sales report deleted successfully"
      });
      loadReports();
    } catch (error) {
      console.error('Error deleting sales report:', error);
      toast({
        title: "Error",
        description: "Failed to delete sales report",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (reportId: number) => {
    // Check edit permission - only admin users can edit
    if (!canEditSales) {
      toast({
        title: "Access Denied",
        description: "Only administrators can edit sales reports.",
        variant: "destructive"
      });
      return;
    }

    navigate(`/sales/${reportId}/edit`);
  };

  const handleCreateReport = () => {
    // Check create permission
    if (!canCreateSales) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create sales reports.",
        variant: "destructive"
      });
      return;
    }

    navigate('/sales/new');
  };

  const handlePrint = (report: SalesReport) => {
    setSelectedReport(report);
    setPrintDialogOpen(true);
  };

  const canAddReport = userProfile?.role === 'Employee' || isAdmin();

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

  // Calculate totals for all visible reports with proper validation
  const totals = reports.reduce((acc, report) => {
    // Ensure all values are properly parsed as numbers
    const totalSales = parseFloat(report.total_sales) || 0;
    const cashAmount = parseFloat(report.cash_amount) || 0;
    const creditCardAmount = parseFloat(report.credit_card_amount) || 0;
    const debitCardAmount = parseFloat(report.debit_card_amount) || 0;
    const mobileAmount = parseFloat(report.mobile_amount) || 0;
    const grocerySales = parseFloat(report.grocery_sales) || 0;
    const totalGallons = parseFloat(report.total_gallons) || 0;
    const lotteryTotalCash = parseFloat(report.lottery_total_cash) || 0;

    // Calculate payment method totals
    const paymentTotal = cashAmount + creditCardAmount + debitCardAmount + mobileAmount;

    // Log any discrepancies for debugging
    if (Math.abs(paymentTotal + grocerySales - totalSales) > 0.01) {
      console.warn(`Report ID ${report.ID}: Payment methods + grocery (${paymentTotal + grocerySales}) don't match total (${totalSales})`);
    }

    return {
      total_sales: acc.total_sales + totalSales,
      cash_amount: acc.cash_amount + cashAmount,
      credit_card_amount: acc.credit_card_amount + creditCardAmount,
      debit_card_amount: acc.debit_card_amount + debitCardAmount,
      mobile_amount: acc.mobile_amount + mobileAmount,
      grocery_sales: acc.grocery_sales + grocerySales,
      total_gallons: acc.total_gallons + totalGallons,
      lottery_total_cash: acc.lottery_total_cash + lotteryTotalCash
    };
  }, {
    total_sales: 0,
    cash_amount: 0,
    credit_card_amount: 0,
    debit_card_amount: 0,
    mobile_amount: 0,
    grocery_sales: 0,
    total_gallons: 0,
    lottery_total_cash: 0
  });

  // Validate the summary totals
  const summaryPaymentTotal = totals.cash_amount + totals.credit_card_amount + totals.debit_card_amount + totals.mobile_amount;
  const summaryWithGrocery = summaryPaymentTotal + totals.grocery_sales;

  console.log('Summary calculations:', {
    total_sales: totals.total_sales,
    payment_total: summaryPaymentTotal,
    with_grocery: summaryWithGrocery,
    payment_matches: Math.abs(summaryWithGrocery - totals.total_sales) <= 0.01
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.total_sales)}</p>
                {isAllSelected &&
                <p className="text-xs text-blue-600">All Stations</p>
                }
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Gallons</p>
                <p className="text-2xl font-bold">{totals.total_gallons.toFixed(2)}</p>
                {isAllSelected &&
                <p className="text-xs text-blue-600">All Stations</p>
                }
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Grocery Sales</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.grocery_sales)}</p>
                {isAllSelected &&
                <p className="text-xs text-blue-600">All Stations</p>
                }
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Reports</p>
                <p className="text-2xl font-bold">{totalCount}</p>
                {isAllSelected &&
                <p className="text-xs text-blue-600">All Stations</p>
                }
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
                <TrendingUp className="w-6 h-6" />
                <span>Daily Sales Reports</span>
                {isAllSelected &&
                <Badge variant="outline" className="ml-2">
                    Viewing All Stations
                  </Badge>
                }
              </CardTitle>
              <CardDescription>
                Track daily sales performance across {isAllSelected ? 'all stations' : 'selected station'}
              </CardDescription>
            </div>
            
            {/* Only show Add Report button if create permission is enabled */}
            {canCreateSales && canAddReport ?
            <Button onClick={handleCreateReport} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Report</span>
              </Button> :
            isModuleAccessEnabled &&
            <Badge variant="secondary" className="text-xs">
                Create access disabled by admin
              </Badge>
            }
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by station..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10" />

            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <StationDropdown
                value={selectedStation}
                onValueChange={setSelectedStation}
                placeholder="Filter by station"
                includeAll={true}
                showBadge={true}
                className="min-w-[200px]" />

            </div>
          </div>

          {/* Reports Table */}
          {loading ?
          <div className="space-y-4">
              {[...Array(5)].map((_, i) =>
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
            )}
            </div> :
          reports.length === 0 ?
          <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                No sales reports found
                {selectedStation !== 'ALL_STATIONS' && selectedStation !== 'ALL' &&
              <span> for {selectedStation}</span>
              }
              </p>
              {canCreateSales && canAddReport &&
            <Button
              variant="outline"
              className="mt-4"
              onClick={handleCreateReport}>
                  Add Your First Sales Report
                </Button>
            }
            </div> :

          <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Total Sales</TableHead>
                    <TableHead>Gallons</TableHead>
                    <TableHead>Grocery</TableHead>
                    <TableHead>Payment Methods</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {safeMap(reports, (report, index) =>
                <TableRow key={generateSafeKey(report, index, 'report')}>
                      <TableCell className="font-medium">
                        {formatDate(report.report_date)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-white ${getStationBadgeColor(report.station)}`}>
                          {report.station}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={report.shift === 'DAY' ? 'default' : 'secondary'}>
                          {report.shift || 'DAY'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <span>{formatCurrency(report.total_sales)}</span>
                          {(() => {
                        const total = parseFloat(report.total_sales) || 0;
                        const cash = parseFloat(report.cash_amount) || 0;
                        const credit = parseFloat(report.credit_card_amount) || 0;
                        const debit = parseFloat(report.debit_card_amount) || 0;
                        const mobile = parseFloat(report.mobile_amount) || 0;
                        const grocery = parseFloat(report.grocery_sales) || 0;
                        const paymentTotal = cash + credit + debit + mobile + grocery;
                        const isPaymentCorrect = Math.abs(paymentTotal - total) <= 0.01;

                        return isPaymentCorrect ?
                        <span className="text-green-600 text-xs">✓</span> :

                        <span className="text-red-600 text-xs" title={`Payment total: ${formatCurrency(paymentTotal)}`}>⚠️</span>;

                      })()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>{parseFloat(report.total_gallons || '0').toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>{formatCurrency(report.grocery_sales)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          <div>Cash: {formatCurrency(report.cash_amount)}</div>
                          <div>Credit: {formatCurrency(report.credit_card_amount)}</div>
                          <div>Debit: {formatCurrency(report.debit_card_amount)}</div>
                          <div>Mobile: {formatCurrency(report.mobile_amount)}</div>
                        </div>
                      </TableCell>
                      <TableCell>{report.employee_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrint(report)}
                        title="View / Print Report">

                            <Printer className="w-4 h-4" />
                          </Button>
                          
                          {/* Only show Edit button if user is Administrator and has edit permission */}
                          {canEditSales &&
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(report.ID)}
                        title="Edit Report">
                              <Edit className="w-4 h-4" />
                            </Button>
                      }
                          
                          {/* Only show Delete button if user is Administrator and has delete permission */}
                          {canDeleteSales &&
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(report.ID)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete Report">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                      }
                        </div>
                      </TableCell>
                    </TableRow>
                )}
                
                  {/* Summary Row */}
                  {reports.length > 0 &&
                <TableRow className="bg-gray-50 font-semibold border-t-2">
                      <TableCell className="font-bold">TOTALS</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {reports.length} reports
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">-</TableCell>
                      <TableCell className="font-bold text-green-600">
                        <div className="flex items-center space-x-2">
                          <span>{formatCurrency(totals.total_sales)}</span>
                          {Math.abs(summaryWithGrocery - totals.total_sales) <= 0.01 ?
                      <span className="text-green-600 text-xs">✓</span> :

                      <span className="text-red-600 text-xs">⚠️</span>
                      }
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-blue-600">
                        {totals.total_gallons.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-bold text-purple-600">
                        {formatCurrency(totals.grocery_sales)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          <div className="font-medium">Cash: {formatCurrency(totals.cash_amount)}</div>
                          <div className="font-medium">Credit: {formatCurrency(totals.credit_card_amount)}</div>
                          <div className="font-medium">Debit: {formatCurrency(totals.debit_card_amount)}</div>
                          <div className="font-medium">Mobile: {formatCurrency(totals.mobile_amount)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500">-</TableCell>
                      <TableCell className="text-gray-500">-</TableCell>
                    </TableRow>
                }
                </TableBody>
              </Table>
            </div>
          }

          {/* Show permission status when actions are disabled */}
          {(!canEditSales || !canDeleteSales) && isModuleAccessEnabled &&
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">
                <strong>Access Restrictions:</strong>
                {!canEditSales && " Edit access restricted to administrators."}
                {!canDeleteSales && " Delete access restricted to administrators."}
              </p>
            </div>
          }

          {/* Pagination */}
          {totalPages > 1 &&
          <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-700">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} reports
                {selectedStation !== 'ALL' &&
              <span> for {selectedStation}</span>
              }
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

      {/* Enhanced Print Dialog */}
      <EnhancedSalesReportPrintDialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        report={selectedReport} />

    </div>);

};

export default SalesReportList;