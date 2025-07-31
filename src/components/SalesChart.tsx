import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CalendarDays, TrendingUp, Building2 } from 'lucide-react';
import { useStationStore } from '@/hooks/use-station-store';

interface SalesData {
  date: string;
  day: string;
  total_all_stations: number;
  [key: string]: string | number; // Dynamic station data
}

interface StationTotals {
  station: string;
  fuel: number;
  convenience: number;
  total: number;
}

const SalesChart: React.FC = () => {
  const { stations, getStationColor } = useStationStore();
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [stationTotals, setStationTotals] = useState<StationTotals[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get station names dynamically
  const stationNames = stations.map(station => station.name || station.station_name).filter(Boolean);

  useEffect(() => {
    loadSalesData();
  }, []);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range for last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      console.log('Fetching sales data from:', startDate.toISOString(), 'to:', endDate.toISOString());

      // Fetch sales reports for the last 30 days
      const { data, error: apiError } = await window.ezsite.apis.tablePage('11728', {
        PageNo: 1,
        PageSize: 1000,
        Filters: [
        { name: 'report_date', op: 'GreaterThanOrEqual', value: startDate.toISOString() }],

        OrderByField: 'report_date',
        IsAsc: true
      });

      if (apiError) throw new Error(apiError);

      if (!data || !data.List) {
        console.log('No sales data found');
        setSalesData([]);
        setStationTotals([]);
        return;
      }

      const reports = data.List;
      console.log('Raw sales reports:', reports);

      // Group data by date and station
      const dailyData: {[key: string]: any;} = {};
      // Initialize station summary dynamically from central store
      const stationSummary: {[key: string]: {fuel: number;convenience: number;total: number;};} = {};
      stationNames.forEach(stationName => {
        stationSummary[stationName] = { fuel: 0, convenience: 0, total: 0 };
      });

      // Process each report
      reports.forEach((report: any) => {
        const reportDate = new Date(report.report_date);
        const dateStr = reportDate.toISOString().split('T')[0];
        const dayName = reportDate.toLocaleDateString('en-US', { weekday: 'short' });
        const station = report.station || 'Unknown';

        if (!dailyData[dateStr]) {
          // Initialize daily data with dynamic station fields
          dailyData[dateStr] = {
            date: dateStr,
            day: dayName,
            total_all_stations: 0
          };
          
          // Add dynamic station fields
          stationNames.forEach(stationName => {
            const stationKey = stationName.replace(/\s+/g, '_').toUpperCase();
            dailyData[dateStr][`${stationKey}_fuel`] = 0;
            dailyData[dateStr][`${stationKey}_convenience`] = 0;
            dailyData[dateStr][`${stationKey}_total`] = 0;
          });
        }

        const fuelSales = report.fuel_sales || 0;
        const convenienceSales = report.convenience_sales || 0;
        const totalSales = report.total_sales || 0;

        // Update daily data based on station dynamically
        if (stationNames.includes(station)) {
          const stationKey = station.replace(/\s+/g, '_').toUpperCase();
          dailyData[dateStr][`${stationKey}_fuel`] += fuelSales;
          dailyData[dateStr][`${stationKey}_convenience`] += convenienceSales;
          dailyData[dateStr][`${stationKey}_total`] += totalSales;
        }

        // Update station totals
        if (stationSummary[station]) {
          stationSummary[station].fuel += fuelSales;
          stationSummary[station].convenience += convenienceSales;
          stationSummary[station].total += totalSales;
        }
      });

      // Calculate total for all stations for each day
      Object.values(dailyData).forEach((day: any) => {
        day.total_all_stations = stationNames.reduce((total, stationName) => {
          const stationKey = stationName.replace(/\s+/g, '_').toUpperCase();
          return total + (day[`${stationKey}_total`] || 0);
        }, 0);
      });

      // Convert to array and sort by date
      const chartData = Object.values(dailyData).sort((a: any, b: any) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Convert station summary to array
      const stationTotalsArray = Object.entries(stationSummary).map(([station, totals]) => ({
        station,
        ...totals
      }));

      console.log('Processed chart data:', chartData);
      console.log('Station totals:', stationTotalsArray);

      setSalesData(chartData);
      setStationTotals(stationTotalsArray);

    } catch (error) {
      console.error('Error loading sales data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) =>
          <p
            key={index}
            className="tooltip-entry"
            style={{ '--entry-color': entry.color } as React.CSSProperties}
          >
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          )}
        </div>);

    }
    return null;
  };

  const totalSalesAllStations = stationTotals.reduce((sum, station) => sum + station.total, 0);
  const totalFuelSales = stationTotals.reduce((sum, station) => sum + station.fuel, 0);
  const totalConvenienceSales = stationTotals.reduce((sum, station) => sum + station.convenience, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Sales Analytics - Last 30 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>);

  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-600" />
            Sales Analytics - Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center text-red-600">
              <p className="font-medium">Error loading sales data</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>);

  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Sales Analytics - Last 30 Days
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          Total sales across all gas stations: {formatCurrency(totalSalesAllStations)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {salesData.length === 0 ?
        <div className="h-80 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">No sales data available</p>
              <p className="text-sm">Sales data for the last 30 days will appear here</p>
            </div>
          </div> :

        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Fuel Sales</p>
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalFuelSales)}</p>
                  </div>
                  <div className="p-2 bg-blue-500 text-white rounded">⛽</div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900">Convenience Store</p>
                    <p className="text-2xl font-bold text-green-900">{formatCurrency(totalConvenienceSales)}</p>
                  </div>
                  <div className="p-2 bg-green-500 text-white rounded">🏪</div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-900">Total Sales</p>
                    <p className="text-2xl font-bold text-purple-900">{formatCurrency(totalSalesAllStations)}</p>
                  </div>
                  <div className="p-2 bg-purple-500 text-white rounded">💰</div>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }} />

                  <YAxis
                  tickFormatter={(value) => formatCurrency(value)}
                  tick={{ fontSize: 12 }} />

                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  {/* Dynamic Station Bars */}
                  {stationNames.map((stationName, index) => {
                    const stationKey = stationName.replace(/\s+/g, '_').toUpperCase();
                    const baseColor = getStationColor(stationName);
                    
                    // Generate colors based on station color or use defaults
                    const colors = [
                      '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#8B5A2B'
                    ];
                    const lightColors = [
                      '#60A5FA', '#34D399', '#A78BFA', '#FBBF24', '#F87171', '#A78A5A'
                    ];
                    
                    const fuelColor = colors[index % colors.length];
                    const convenienceColor = lightColors[index % lightColors.length];
                    
                    return (
                      <React.Fragment key={stationName}>
                        <Bar
                          dataKey={`${stationKey}_fuel`}
                          stackId={stationKey}
                          fill={fuelColor}
                          name={`${stationName} - Fuel`}
                        />
                        <Bar
                          dataKey={`${stationKey}_convenience`}
                          stackId={stationKey}
                          fill={convenienceColor}
                          name={`${stationName} - Convenience`}
                        />
                      </React.Fragment>
                    );
                  })}

                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Station Summary */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 text-gray-900">Station Performance Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stationTotals.map((station) =>
              <div key={station.station} className="bg-gray-50 p-3 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">{station.station}</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fuel:</span>
                        <span className="font-medium">{formatCurrency(station.fuel)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Convenience:</span>
                        <span className="font-medium">{formatCurrency(station.convenience)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span className="font-medium text-gray-900">Total:</span>
                        <span className="font-bold text-gray-900">{formatCurrency(station.total)}</span>
                      </div>
                    </div>
                  </div>
              )}
              </div>
            </div>
          </div>
        }
      </CardContent>
    </Card>);

};

export default SalesChart;