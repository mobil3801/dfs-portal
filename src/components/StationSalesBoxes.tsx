import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Fuel, ShoppingCart, DollarSign, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SalesData {
  ID: number;
  station: string;
  report_date: string;
  total_sales: number;
  grocery_sales: number;
  cash_collection_on_hand: number;
  regular_gallons: number;
  super_gallons: number;
  diesel_gallons: number;
  lottery_net_sales: number;
  employee_name: string;
  shift: string;
}

interface StationSalesData {
  station: string;
  totalSales: number;
  fuelSales: number;
  grocerySales: number;
  lotterySales: number;
  totalGallons: number;
  cashOnHand: number;
  lastUpdated: string;
  employeeName: string;
  shift: string;
  reportCount: number;
}

const STATIONS = ['MOBIL', 'AMOCO ROSEDALE', 'AMOCO BROOKLYN'];

const StationSalesBoxes: React.FC = () => {
  const [salesData, setSalesData] = useState<StationSalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSalesData = async () => {
    try {
      setError(null);

      // Get today's date for filtering
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Fetch recent sales reports from the enhanced table
      const { data, error: apiError } = await window.ezsite.apis.tablePage(12356, {
        PageNo: 1,
        PageSize: 50,
        OrderByField: "report_date",
        IsAsc: false,
        Filters: [
        {
          name: "report_date",
          op: "GreaterThanOrEqual",
          value: todayStr
        }]

      });

      if (apiError) throw apiError;

      // Process data by station
      const stationData: StationSalesData[] = STATIONS.map((station) => {
        const stationReports = data?.List?.filter((report: SalesData) =>
        report.station === station
        ) || [];

        const totalSales = stationReports.reduce((sum: number, report: SalesData) =>
        sum + (report.total_sales || 0), 0
        );

        const grocerySales = stationReports.reduce((sum: number, report: SalesData) =>
        sum + (report.grocery_sales || 0), 0
        );

        const lotterySales = stationReports.reduce((sum: number, report: SalesData) =>
        sum + (report.lottery_net_sales || 0), 0
        );

        const totalGallons = stationReports.reduce((sum: number, report: SalesData) =>
        sum + (report.regular_gallons || 0) + (report.super_gallons || 0) + (report.diesel_gallons || 0), 0
        );

        const cashOnHand = stationReports.reduce((sum: number, report: SalesData) =>
        sum + (report.cash_collection_on_hand || 0), 0
        );

        // Calculate fuel sales (total - grocery - lottery)
        const fuelSales = totalSales - grocerySales - lotterySales;

        const latestReport = stationReports[0];

        return {
          station,
          totalSales,
          fuelSales: Math.max(0, fuelSales),
          grocerySales,
          lotterySales,
          totalGallons,
          cashOnHand,
          lastUpdated: latestReport?.report_date || '',
          employeeName: latestReport?.employee_name || 'N/A',
          shift: latestReport?.shift || 'N/A',
          reportCount: stationReports.length
        };
      });

      setSalesData(stationData);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      setError(error as string);
      toast({
        title: "Error",
        description: "Failed to fetch sales data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchSalesData, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStationColor = (station: string) => {
    switch (station) {
      case 'MOBIL':
        return 'blue';
      case 'AMOCO ROSEDALE':
        return 'green';
      case 'AMOCO BROOKLYN':
        return 'purple';
      default:
        return 'gray';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return 'No data';

    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STATIONS.map((station) =>
        <Card key={station} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </Card>
        )}
      </div>);

  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          Real-time Station Sales
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600 border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
            Live Data
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSalesData}
            disabled={loading}>

            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {salesData.map((data) => {
          const color = getStationColor(data.station);
          const hasData = data.reportCount > 0;

          return (
            <Card
              key={data.station}
              className={`p-6 transition-all duration-300 hover:shadow-lg border-l-4 ${
              color === 'blue' ? 'border-l-blue-500 bg-blue-50/30' :
              color === 'green' ? 'border-l-green-500 bg-green-50/30' :
              'border-l-purple-500 bg-purple-50/30'}`
              }>

              {/* Station Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{data.station}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-3 h-3" />
                    <span>Updated: {formatTime(data.lastUpdated)}</span>
                  </div>
                </div>
                <Badge
                  variant={hasData ? "default" : "secondary"}
                  className={
                  color === 'blue' ? 'bg-blue-500' :
                  color === 'green' ? 'bg-green-500' :
                  'bg-purple-500'
                  }>

                  {data.reportCount} Reports
                </Badge>
              </div>

              {!hasData ?
              <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No sales data today</p>
                  <p className="text-sm text-gray-400">Reports will appear here once created</p>
                </div> :

              <>
                  {/* Total Sales */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className={`w-5 h-5 ${
                      color === 'blue' ? 'text-blue-600' :
                      color === 'green' ? 'text-green-600' :
                      'text-purple-600'}`
                      } />
                        <span className="text-sm font-medium text-gray-600">Total Sales</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-900">
                        {formatCurrency(data.totalSales)}
                      </span>
                    </div>
                  </div>

                  {/* Sales Breakdown */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Fuel className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-600">Fuel Sales</span>
                      </div>
                      <span className="font-medium">{formatCurrency(data.fuelSales)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">Grocery Sales</span>
                      </div>
                      <span className="font-medium">{formatCurrency(data.grocerySales)}</span>
                    </div>

                    {data.lotterySales > 0 &&
                  <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-yellow-500 rounded text-white text-xs flex items-center justify-center">
                            🎫
                          </div>
                          <span className="text-sm text-gray-600">Lottery Sales</span>
                        </div>
                        <span className="font-medium">{formatCurrency(data.lotterySales)}</span>
                      </div>
                  }
                  </div>

                  {/* Additional Metrics */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Fuel Gallons:</span>
                      <span className="font-medium">{data.totalGallons.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Cash on Hand:</span>
                      <span className="font-medium">{formatCurrency(data.cashOnHand)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Current Staff:</span>
                      <span className="font-medium">{data.employeeName} ({data.shift})</span>
                    </div>
                  </div>
                </>
              }
            </Card>);

        })}
      </div>

      {error &&
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error loading sales data</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      }
    </div>);

};

export default StationSalesBoxes;