import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar } from
'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Fuel,
  Calendar,
  AlertTriangle,
  Package,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Clock,
  Target,
  Thermometer } from
'lucide-react';

interface SalesData {
  report_date: string;
  station: string;
  total_sales: number;
  cash_amount: number;
  credit_card_amount: number;
  grocery_sales: number;
  total_gallons: number;
  expenses_data: string;
}

interface SalaryData {
  employee_id: string;
  station: string;
  pay_date: string;
  net_pay: number;
  gross_pay: number;
  total_deductions: number;
  status: string;
}

interface EmployeeData {
  employee_id: string;
  first_name: string;
  last_name: string;
  station: string;
  position: string;
  is_active: boolean;
}

interface DeliveryData {
  delivery_date: string;
  station: string;
  regular_delivered: number;
  plus_delivered: number;
  super_delivered: number;
  regular_tank_volume: number;
  plus_tank_volume: number;
  super_tank_volume: number;
}

interface LicenseData {
  license_name: string;
  expiry_date: string;
  station: string;
  status: string;
  category: string;
}

interface ProductData {
  product_name: string;
  category: string;
  retail_price: number;
  case_price: number;
  quantity_in_stock: number;
  minimum_stock: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
const STATIONS = ['MOBIL', 'AMOCO ROSEDALE', 'AMOCO BROOKLYN'];

const ComprehensiveDashboard: React.FC = () => {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [salaryData, setSalaryData] = useState<SalaryData[]>([]);
  const [employeeData, setEmployeeData] = useState<EmployeeData[]>([]);
  const [deliveryData, setDeliveryData] = useState<DeliveryData[]>([]);
  const [licenseData, setLicenseData] = useState<LicenseData[]>([]);
  const [productData, setProductData] = useState<ProductData[]>([]);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<'day' | 'week' | 'month'>('week');
  const [selectedStation, setSelectedStation] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all dashboard data
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch sales data
      const salesResponse = await window.ezsite.apis.tablePage(12356, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'report_date',
        IsAsc: false
      });
      if (salesResponse.error) throw salesResponse.error;
      setSalesData(salesResponse.data?.List || []);

      // Fetch salary data
      const salaryResponse = await window.ezsite.apis.tablePage(11788, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'pay_date',
        IsAsc: false
      });
      if (salaryResponse.error) throw salaryResponse.error;
      setSalaryData(salaryResponse.data?.List || []);

      // Fetch employee data
      const employeeResponse = await window.ezsite.apis.tablePage(11727, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'hire_date',
        IsAsc: false
      });
      if (employeeResponse.error) throw employeeResponse.error;
      setEmployeeData(employeeResponse.data?.List || []);

      // Fetch delivery data
      const deliveryResponse = await window.ezsite.apis.tablePage(12196, {
        PageNo: 1,
        PageSize: 50,
        OrderByField: 'delivery_date',
        IsAsc: false
      });
      if (deliveryResponse.error) throw deliveryResponse.error;
      setDeliveryData(deliveryResponse.data?.List || []);

      // Fetch license data
      const licenseResponse = await window.ezsite.apis.tablePage(11731, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'expiry_date',
        IsAsc: true
      });
      if (licenseResponse.error) throw licenseResponse.error;
      setLicenseData(licenseResponse.data?.List || []);

      // Fetch product data
      const productResponse = await window.ezsite.apis.tablePage(11726, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'updated_at',
        IsAsc: false
      });
      if (productResponse.error) throw productResponse.error;
      setProductData(productResponse.data?.List || []);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  // Process sales data for charts
  const processSalesData = () => {
    const filteredData = selectedStation === 'ALL' ?
    salesData :
    salesData.filter((item) => item.station === selectedStation);

    const now = new Date();
    const timeFrameData = filteredData.filter((item) => {
      const itemDate = new Date(item.report_date);
      const daysDiff = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));

      switch (selectedTimeFrame) {
        case 'day':return daysDiff <= 7;
        case 'week':return daysDiff <= 30;
        case 'month':return daysDiff <= 90;
        default:return true;
      }
    });

    return timeFrameData.map((item) => ({
      date: new Date(item.report_date).toLocaleDateString(),
      total_sales: item.total_sales,
      cash: item.cash_amount,
      credit: item.credit_card_amount,
      grocery: item.grocery_sales,
      gallons: item.total_gallons,
      station: item.station
    }));
  };

  // Process salary data by station
  const processSalaryData = () => {
    const groupedByStation = STATIONS.map((station) => {
      const stationSalaries = salaryData.filter((item) =>
      item.station === station && item.status === 'Paid'
      );
      const totalPaid = stationSalaries.reduce((sum, item) => sum + item.net_pay, 0);
      const lastPayment = stationSalaries[0]?.pay_date || null;

      return {
        station,
        totalPaid,
        lastPayment,
        employeeCount: stationSalaries.length
      };
    });

    return groupedByStation;
  };

  // Process delivery data for tank visualizations
  const processDeliveryData = () => {
    const latestDeliveries = STATIONS.map((station) => {
      const stationDeliveries = deliveryData.filter((item) => item.station === station);
      const latest = stationDeliveries[0];

      if (!latest) return { station, tanks: [] };

      return {
        station,
        tanks: [
        { type: 'Regular', current: latest.regular_tank_volume, delivered: latest.regular_delivered },
        { type: 'Plus', current: latest.plus_tank_volume, delivered: latest.plus_delivered },
        { type: 'Super', current: latest.super_tank_volume, delivered: latest.super_delivered }]

      };
    });

    return latestDeliveries;
  };

  // Process license expiry data
  const processLicenseData = () => {
    const now = new Date();
    return licenseData.map((license) => {
      const expiryDate = new Date(license.expiry_date);
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        ...license,
        daysUntilExpiry,
        urgencyLevel: daysUntilExpiry <= 7 ? 'critical' : daysUntilExpiry <= 30 ? 'warning' : 'normal'
      };
    }).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  };

  // Process inventory data
  const processInventoryData = () => {
    const categories = [...new Set(productData.map((item) => item.category))].filter(Boolean);

    return categories.map((category) => {
      const categoryProducts = productData.filter((item) => item.category === category);
      const totalValue = categoryProducts.reduce((sum, item) =>
      sum + item.retail_price * item.quantity_in_stock, 0
      );
      const lowStockCount = categoryProducts.filter((item) =>
      item.quantity_in_stock <= item.minimum_stock
      ).length;

      return {
        category,
        totalValue,
        productCount: categoryProducts.length,
        lowStockCount,
        averageMargin: categoryProducts.reduce((sum, item) => {
          const margin = item.case_price > 0 ? (item.retail_price - item.case_price) / item.case_price * 100 : 0;
          return sum + margin;
        }, 0) / categoryProducts.length || 0
      };
    });
  };

  // Calculate employee performance metrics
  const calculateEmployeeMetrics = () => {
    const activeEmployees = employeeData.filter((emp) => emp.is_active);
    const employeesByStation = STATIONS.map((station) => ({
      station,
      count: activeEmployees.filter((emp) => emp.station === station).length
    }));

    return {
      total: activeEmployees.length,
      byStation: employeesByStation,
      averageTenure: activeEmployees.length > 0 ?
      activeEmployees.reduce((sum, emp) => {
        const hireDate = new Date(emp.hire_date || Date.now());
        const tenure = (Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        return sum + tenure;
      }, 0) / activeEmployees.length : 0
    };
  };

  const salesChartData = processSalesData();
  const salaryByStation = processSalaryData();
  const tankData = processDeliveryData();
  const licenseExpiryData = processLicenseData();
  const inventoryData = processInventoryData();
  const employeeMetrics = calculateEmployeeMetrics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading dashboard data...</span>
      </div>);

  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">Error loading dashboard: {error}</p>
        <Button onClick={fetchDashboardData}>Retry</Button>
      </div>);

  }

  return (
    <div className="space-y-6 p-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights across all stations</p>
        </div>
        
        <div className="flex gap-4">
          <Select value={selectedTimeFrame} onValueChange={(value: 'day' | 'week' | 'month') => setSelectedTimeFrame(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Last 7 Days</SelectItem>
              <SelectItem value="week">Last 30 Days</SelectItem>
              <SelectItem value="month">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedStation} onValueChange={setSelectedStation}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Stations</SelectItem>
              {STATIONS.map((station) =>
              <SelectItem key={station} value={station}>{station}</SelectItem>
              )}
            </SelectContent>
          </Select>
          
          <Button onClick={fetchDashboardData} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${salesChartData.reduce((sum, item) => sum + item.total_sales, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedTimeFrame === 'day' ? 'Last 7 days' : selectedTimeFrame === 'week' ? 'Last 30 days' : 'Last 90 days'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeeMetrics.total}</div>
            <p className="text-xs text-muted-foreground">
              Avg tenure: {employeeMetrics.averageTenure.toFixed(1)} years
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fuel Delivered</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deliveryData.reduce((sum, item) =>
              sum + item.regular_delivered + item.plus_delivered + item.super_delivered, 0
              ).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Gallons this period</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">License Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {licenseExpiryData.filter((license) => license.urgencyLevel === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground">Expiring within 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="salary">Payroll</TabsTrigger>
          <TabsTrigger value="fuel">Fuel</TabsTrigger>
          <TabsTrigger value="licenses">Licenses</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
        </TabsList>

        {/* Sales Analytics Tab */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales Trends</CardTitle>
                <CardDescription>Daily sales performance across payment types</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, '']} />
                    <Legend />
                    <Area type="monotone" dataKey="cash" stackId="1" stroke="#8884d8" fill="#8884d8" name="Cash" />
                    <Area type="monotone" dataKey="credit" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Credit" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Sales by Station</CardTitle>
                <CardDescription>Performance comparison across stations</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={STATIONS.map((station) => {
                    const stationSales = salesChartData.
                    filter((item) => item.station === station).
                    reduce((sum, item) => sum + item.total_sales, 0);
                    return { station: station.split(' ')[0], sales: stationSales };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="station" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Sales']} />
                    <Bar dataKey="sales" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Fuel vs Grocery Sales</CardTitle>
              <CardDescription>Revenue breakdown by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, '']} />
                  <Legend />
                  <Line type="monotone" dataKey="grocery" stroke="#8884d8" name="Grocery Sales" />
                  <Line type="monotone" dataKey="gallons" stroke="#82ca9d" name="Fuel Gallons" yAxisId="right" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salary/Payroll Tab */}
        <TabsContent value="salary" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payroll by Station</CardTitle>
                <CardDescription>Weekly salary totals and last payment dates</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salaryByStation}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="station" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Total Paid']} />
                    <Bar dataKey="totalPaid" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Last Payment Dates</CardTitle>
                <CardDescription>Most recent salary payments by station</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {salaryByStation.map((station, index) =>
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{station.station}</p>
                      <p className="text-sm text-gray-600">{station.employeeCount} employees</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {station.lastPayment ? new Date(station.lastPayment).toLocaleDateString() : 'No payments'}
                      </p>
                      <p className="text-sm text-gray-600">${station.totalPaid.toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Fuel Delivery Tab */}
        <TabsContent value="fuel" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {tankData.map((station, index) =>
            <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{station.station}</CardTitle>
                  <CardDescription>Current tank levels and recent deliveries</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {station.tanks.map((tank, tankIndex) =>
                <div key={tankIndex} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{tank.type}</span>
                        <span>{tank.current.toLocaleString()} gal</span>
                      </div>
                      <Progress value={tank.current / 10000 * 100} className="h-2" />
                      <div className="text-xs text-gray-600">
                        Last delivery: {tank.delivered.toLocaleString()} gallons
                      </div>
                    </div>
                )}
                </CardContent>
              </Card>
            )}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Delivery History</CardTitle>
              <CardDescription>Recent fuel deliveries across all stations</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deliveryData.slice(0, 10).map((delivery) => ({
                  date: new Date(delivery.delivery_date).toLocaleDateString(),
                  regular: delivery.regular_delivered,
                  plus: delivery.plus_delivered,
                  super: delivery.super_delivered
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="regular" fill="#8884d8" name="Regular" />
                  <Bar dataKey="plus" fill="#82ca9d" name="Plus" />
                  <Bar dataKey="super" fill="#ffc658" name="Super" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* License Management Tab */}
        <TabsContent value="licenses" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>License Expiry Timeline</CardTitle>
                <CardDescription>Upcoming license renewals with countdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {licenseExpiryData.slice(0, 8).map((license, index) =>
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <p className="font-medium">{license.license_name}</p>
                      <p className="text-sm text-gray-600">{license.station}</p>
                    </div>
                    <div className="text-right">
                      <Badge
                      variant={license.urgencyLevel === 'critical' ? 'destructive' :
                      license.urgencyLevel === 'warning' ? 'default' : 'secondary'}>

                        {license.daysUntilExpiry} days
                      </Badge>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(license.expiry_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>License Categories</CardTitle>
                <CardDescription>Distribution by license type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(
                        licenseData.reduce((acc, license) => {
                          acc[license.category] = (acc[license.category] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([category, count]) => ({ category, count }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count">

                      {Object.keys(licenseData.reduce((acc, license) => {
                        acc[license.category] = true;
                        return acc;
                      }, {} as Record<string, boolean>)).map((entry, index) =>
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      )}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventory Analytics Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Value by Category</CardTitle>
                <CardDescription>Total stock value and profit margins</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={inventoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Total Value']} />
                    <Bar dataKey="totalValue" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Low Stock Alerts</CardTitle>
                <CardDescription>Products below minimum stock levels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {inventoryData.map((category, index) =>
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{category.category}</p>
                      <p className="text-sm text-gray-600">{category.productCount} products</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={category.lowStockCount > 0 ? 'destructive' : 'secondary'}>
                        {category.lowStockCount} low stock
                      </Badge>
                      <p className="text-xs text-gray-600 mt-1">
                        {category.averageMargin.toFixed(1)}% avg margin
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Profit Margin Analysis</CardTitle>
              <CardDescription>Profitability by product category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={inventoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, 'Margin']} />
                  <Area type="monotone" dataKey="averageMargin" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employee Analytics Tab */}
        <TabsContent value="employees" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Employee Distribution</CardTitle>
                <CardDescription>Staff allocation across stations</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={employeeMetrics.byStation}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ station, percent }) => `${station.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count">

                      {employeeMetrics.byStation.map((entry, index) =>
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      )}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Position Distribution</CardTitle>
                <CardDescription>Employees by role and department</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(
                  employeeData.reduce((acc, emp) => {
                    acc[emp.position] = (acc[emp.position] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([position, count], index) =>
                <div key={index} className="flex justify-between items-center">
                    <span className="font-medium">{position || 'Unspecified'}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Employee Performance Metrics</CardTitle>
              <CardDescription>Tenure and activity indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{employeeMetrics.total}</div>
                  <p className="text-sm text-gray-600">Total Active</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{employeeMetrics.averageTenure.toFixed(1)}</div>
                  <p className="text-sm text-gray-600">Avg Tenure (years)</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {(employeeData.filter((emp) => emp.is_active).length / employeeData.length * 100).toFixed(0)}%
                  </div>
                  <p className="text-sm text-gray-600">Retention Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>);

};

export default ComprehensiveDashboard;