// Analytics calculation utilities for dashboard metrics

interface CalculationOptions {
  timeframe: string;
  stations: string[];
  customDateRange?: {start: Date;end: Date;};
}

interface MetricCalculation {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

class AnalyticsCalculations {
  // Get table IDs from the available tables
  private readonly tableIds = {
    salesReports: 12356, // daily_sales_reports_enhanced
    deliveryRecords: 12196, // delivery_records
    employees: 11727, // employees
    products: 11726, // products
    salaryRecords: 11788, // salary_records
    expenses: 12356, // from expenses_data in sales reports
    stations: 12599 // stations
  };

  // Calculate main dashboard metrics
  async calculateDashboardMetrics(options: CalculationOptions) {
    const { timeframe, stations, customDateRange } = options;

    try {
      // Get date ranges for current and previous periods
      const dateRanges = this.getDateRanges(timeframe, customDateRange);

      // Fetch data in parallel
      const [currentSales, previousSales, currentDeliveries, employees, products] = await Promise.all([
      this.fetchSalesData(dateRanges.current, stations),
      this.fetchSalesData(dateRanges.previous, stations),
      this.fetchDeliveryData(dateRanges.current, stations),
      this.fetchEmployeeData(stations),
      this.fetchProductData()]
      );

      // Calculate metrics
      const totalSales = this.calculateSalesMetrics(currentSales, previousSales);
      const fuelSales = this.calculateFuelMetrics(currentSales, currentDeliveries);
      const convenienceStoreSales = this.calculateConvenienceMetrics(currentSales, previousSales);
      const expenses = this.calculateExpenseMetrics(currentSales, previousSales);
      const profitMargin = this.calculateProfitMetrics(currentSales, expenses);
      const employeeMetrics = this.calculateEmployeeMetrics(employees, currentSales);
      const inventoryMetrics = this.calculateInventoryMetrics(products);
      const stationComparison = this.calculateStationComparison(currentSales, stations);

      return {
        totalSales,
        fuelSales,
        convenienceStoreSales,
        expenses,
        profitMargin,
        employeeMetrics,
        inventoryMetrics,
        stationComparison
      };
    } catch (error) {
      console.error('Error calculating dashboard metrics:', error);
      throw new Error('Failed to calculate dashboard metrics');
    }
  }

  // Calculate timeframe comparison data
  async calculateTimeframeComparison(options: CalculationOptions) {
    const { timeframe, stations, customDateRange } = options;

    try {
      // Get current period metrics
      const current = await this.calculateDashboardMetrics({ timeframe, stations, customDateRange });

      // Calculate previous period
      const previousOptions = { ...options, timeframe: this.getPreviousPeriod(timeframe) };
      const previous = await this.calculateDashboardMetrics(previousOptions);

      // Calculate year over year
      const yearAgoOptions = { ...options, timeframe: this.getYearAgoPeriod(timeframe) };
      const yearOverYear = await this.calculateDashboardMetrics(yearAgoOptions);

      // Calculate week over week
      const weekAgoOptions = { ...options, timeframe: this.getWeekAgoPeriod(timeframe) };
      const weekOverWeek = await this.calculateDashboardMetrics(weekAgoOptions);

      // Calculate month over month
      const monthAgoOptions = { ...options, timeframe: this.getMonthAgoPeriod(timeframe) };
      const monthOverMonth = await this.calculateDashboardMetrics(monthAgoOptions);

      return {
        current,
        previous,
        yearOverYear,
        weekOverWeek,
        monthOverMonth
      };
    } catch (error) {
      console.error('Error calculating timeframe comparison:', error);
      throw new Error('Failed to calculate timeframe comparison');
    }
  }

  // Fetch sales data from database
  private async fetchSalesData(dateRange: {start: Date;end: Date;}, stations: string[]) {
    try {
      const filters = [
      {
        name: 'report_date',
        op: 'GreaterThanOrEqual' as const,
        value: dateRange.start.toISOString().split('T')[0]
      },
      {
        name: 'report_date',
        op: 'LessThanOrEqual' as const,
        value: dateRange.end.toISOString().split('T')[0]
      }];


      if (stations.length > 0 && !stations.includes('ALL')) {
        stations.forEach((station) => {
          filters.push({
            name: 'station',
            op: 'Equal' as const,
            value: station
          });
        });
      }

      const { data, error } = await window.ezsite.apis.tablePage(this.tableIds.salesReports, {
        PageNo: 1,
        PageSize: 1000,
        OrderByField: 'report_date',
        IsAsc: false,
        Filters: filters
      });

      if (error) throw new Error(error);
      return data?.List || [];
    } catch (error) {
      console.error('Error fetching sales data:', error);
      return [];
    }
  }

  // Fetch delivery data
  private async fetchDeliveryData(dateRange: {start: Date;end: Date;}, stations: string[]) {
    try {
      const filters = [
      {
        name: 'delivery_date',
        op: 'GreaterThanOrEqual' as const,
        value: dateRange.start.toISOString().split('T')[0]
      },
      {
        name: 'delivery_date',
        op: 'LessThanOrEqual' as const,
        value: dateRange.end.toISOString().split('T')[0]
      }];


      if (stations.length > 0 && !stations.includes('ALL')) {
        stations.forEach((station) => {
          filters.push({
            name: 'station',
            op: 'Equal' as const,
            value: station
          });
        });
      }

      const { data, error } = await window.ezsite.apis.tablePage(this.tableIds.deliveryRecords, {
        PageNo: 1,
        PageSize: 1000,
        OrderByField: 'delivery_date',
        IsAsc: false,
        Filters: filters
      });

      if (error) throw new Error(error);
      return data?.List || [];
    } catch (error) {
      console.error('Error fetching delivery data:', error);
      return [];
    }
  }

  // Fetch employee data
  private async fetchEmployeeData(stations: string[]) {
    try {
      const filters = [];

      if (stations.length > 0 && !stations.includes('ALL')) {
        stations.forEach((station) => {
          filters.push({
            name: 'station',
            op: 'Equal' as const,
            value: station
          });
        });
      }

      filters.push({
        name: 'is_active',
        op: 'Equal' as const,
        value: true
      });

      const { data, error } = await window.ezsite.apis.tablePage(this.tableIds.employees, {
        PageNo: 1,
        PageSize: 1000,
        OrderByField: 'hire_date',
        IsAsc: false,
        Filters: filters
      });

      if (error) throw new Error(error);
      return data?.List || [];
    } catch (error) {
      console.error('Error fetching employee data:', error);
      return [];
    }
  }

  // Fetch product data
  private async fetchProductData() {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(this.tableIds.products, {
        PageNo: 1,
        PageSize: 1000,
        OrderByField: 'updated_at',
        IsAsc: false,
        Filters: []
      });

      if (error) throw new Error(error);
      return data?.List || [];
    } catch (error) {
      console.error('Error fetching product data:', error);
      return [];
    }
  }

  // Calculate sales metrics
  private calculateSalesMetrics(currentSales: any[], previousSales: any[]): MetricCalculation {
    const current = currentSales.reduce((sum, sale) => sum + (parseFloat(sale.total_sales) || 0), 0);
    const previous = previousSales.reduce((sum, sale) => sum + (parseFloat(sale.total_sales) || 0), 0);
    const change = current - previous;
    const changePercent = previous > 0 ? change / previous * 100 : 0;

    return { current, previous, change, changePercent };
  }

  // Calculate fuel metrics
  private calculateFuelMetrics(salesData: any[], deliveryData: any[]) {
    const fuelSales = salesData.reduce((sum, sale) => {
      const regularGallons = parseFloat(sale.regular_gallons) || 0;
      const superGallons = parseFloat(sale.super_gallons) || 0;
      const dieselGallons = parseFloat(sale.diesel_gallons) || 0;
      return sum + (regularGallons + superGallons + dieselGallons);
    }, 0);

    const totalGallons = salesData.reduce((sum, sale) => sum + (parseFloat(sale.total_gallons) || 0), 0);
    const fuelRevenue = salesData.reduce((sum, sale) => {
      // Estimate fuel revenue (this would need price data for accuracy)
      const gallons = parseFloat(sale.total_gallons) || 0;
      return sum + gallons * 3.50; // Estimated average price per gallon
    }, 0);

    const avgPricePerGallon = totalGallons > 0 ? fuelRevenue / totalGallons : 0;

    return {
      current: fuelRevenue,
      gallonsSold: totalGallons,
      avgPricePerGallon,
      change: 0 // Would need previous period data
    };
  }

  // Calculate convenience store metrics
  private calculateConvenienceMetrics(currentSales: any[], previousSales: any[]) {
    const current = currentSales.reduce((sum, sale) => sum + (parseFloat(sale.grocery_sales) || 0), 0);
    const previous = previousSales.reduce((sum, sale) => sum + (parseFloat(sale.grocery_sales) || 0), 0);
    const change = current - previous;

    // Top categories (simplified - would need more detailed product data)
    const topCategories = [
    { category: 'Beverages', sales: current * 0.3 },
    { category: 'Snacks', sales: current * 0.25 },
    { category: 'Tobacco', sales: current * 0.2 },
    { category: 'Food', sales: current * 0.15 },
    { category: 'Other', sales: current * 0.1 }];


    return { current, topCategories, change };
  }

  // Calculate expense metrics
  private calculateExpenseMetrics(currentSales: any[], previousSales: any[]) {
    const currentExpenses = currentSales.reduce((sum, sale) => {
      try {
        const expensesData = JSON.parse(sale.expenses_data || '[]');
        return sum + expensesData.reduce((expSum: number, exp: any) => expSum + (parseFloat(exp.amount) || 0), 0);
      } catch {
        return sum;
      }
    }, 0);

    const previousExpenses = previousSales.reduce((sum, sale) => {
      try {
        const expensesData = JSON.parse(sale.expenses_data || '[]');
        return sum + expensesData.reduce((expSum: number, exp: any) => expSum + (parseFloat(exp.amount) || 0), 0);
      } catch {
        return sum;
      }
    }, 0);

    // Categorize expenses
    const byCategory = [
    { category: 'Fuel Purchases', amount: currentExpenses * 0.4 },
    { category: 'Inventory', amount: currentExpenses * 0.25 },
    { category: 'Utilities', amount: currentExpenses * 0.15 },
    { category: 'Maintenance', amount: currentExpenses * 0.1 },
    { category: 'Other', amount: currentExpenses * 0.1 }];


    return {
      total: currentExpenses,
      byCategory,
      change: currentExpenses - previousExpenses
    };
  }

  // Calculate profit metrics
  private calculateProfitMetrics(salesData: any[], expenseData: any) {
    const totalRevenue = salesData.reduce((sum, sale) => sum + (parseFloat(sale.total_sales) || 0), 0);
    const totalExpenses = expenseData.total;
    const currentProfit = totalRevenue - totalExpenses;
    const current = totalRevenue > 0 ? currentProfit / totalRevenue * 100 : 0;
    const target = 25; // Target profit margin of 25%
    const variance = current - target;

    return { current, target, variance };
  }

  // Calculate employee metrics
  private calculateEmployeeMetrics(employees: any[], salesData: any[]) {
    const totalEmployees = employees.length;
    const activeShifts = salesData.length; // Number of reports = active shifts

    // Calculate payroll costs (simplified)
    const payrollCosts = employees.reduce((sum, emp) => sum + (parseFloat(emp.salary) || 0), 0) / 12; // Monthly

    return {
      totalEmployees,
      activeShifts,
      payrollCosts
    };
  }

  // Calculate inventory metrics
  private calculateInventoryMetrics(products: any[]) {
    const lowStockItems = products.filter((product) => {
      const stock = parseInt(product.quantity_in_stock) || 0;
      const minStock = parseInt(product.minimum_stock) || 0;
      return stock <= minStock;
    }).length;

    const totalValue = products.reduce((sum, product) => {
      const stock = parseInt(product.quantity_in_stock) || 0;
      const price = parseFloat(product.price) || 0;
      return sum + stock * price;
    }, 0);

    // Simplified turnover rate calculation
    const turnoverRate = 12; // Estimated monthly turnover

    return {
      lowStockItems,
      totalValue,
      turnoverRate
    };
  }

  // Calculate station comparison
  private calculateStationComparison(salesData: any[], stations: string[]) {
    const stationMetrics = {
      mobil: this.calculateStationMetrics(salesData, 'MOBIL'),
      amocoRosedale: this.calculateStationMetrics(salesData, 'AMOCO ROSEDALE'),
      amocoBrooklyn: this.calculateStationMetrics(salesData, 'AMOCO BROOKLYN')
    };

    return stationMetrics;
  }

  // Calculate metrics for a specific station
  private calculateStationMetrics(salesData: any[], station: string) {
    const stationSales = salesData.filter((sale) => sale.station === station);

    const totalSales = stationSales.reduce((sum, sale) => sum + (parseFloat(sale.total_sales) || 0), 0);
    const fuelSales = stationSales.reduce((sum, sale) => sum + (parseFloat(sale.total_gallons) || 0), 0);
    const convenienceSales = stationSales.reduce((sum, sale) => sum + (parseFloat(sale.grocery_sales) || 0), 0);

    return {
      totalSales,
      fuelSales,
      convenienceSales,
      reportCount: stationSales.length
    };
  }

  // Get date ranges for different timeframes
  private getDateRanges(timeframe: string, customDateRange?: {start: Date;end: Date;}) {
    const now = new Date();
    let current: {start: Date;end: Date;};
    let previous: {start: Date;end: Date;};

    if (timeframe === 'custom' && customDateRange) {
      current = customDateRange;
      const duration = customDateRange.end.getTime() - customDateRange.start.getTime();
      previous = {
        start: new Date(customDateRange.start.getTime() - duration),
        end: new Date(customDateRange.start.getTime() - 1)
      };
    } else {
      switch (timeframe) {
        case 'today':
          current = {
            start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
          };
          previous = {
            start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
            end: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59)
          };
          break;
        case 'week':
          const weekStart = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000);
          current = {
            start: new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()),
            end: now
          };
          previous = {
            start: new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000),
            end: new Date(weekStart.getTime() - 1)
          };
          break;
        case 'month':
          current = {
            start: new Date(now.getFullYear(), now.getMonth(), 1),
            end: now
          };
          previous = {
            start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
            end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
          };
          break;
        default:
          current = {
            start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            end: now
          };
          previous = {
            start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
            end: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59)
          };
      }
    }

    return { current, previous };
  }

  // Helper methods for timeframe calculations
  private getPreviousPeriod(timeframe: string): string {
    const map: {[key: string]: string;} = {
      'today': 'yesterday',
      'week': 'last_week',
      'month': 'last_month',
      'quarter': 'last_quarter',
      'year': 'last_year'
    };
    return map[timeframe] || 'yesterday';
  }

  private getYearAgoPeriod(timeframe: string): string {
    return `${timeframe}_year_ago`;
  }

  private getWeekAgoPeriod(timeframe: string): string {
    return `${timeframe}_week_ago`;
  }

  private getMonthAgoPeriod(timeframe: string): string {
    return `${timeframe}_month_ago`;
  }
}

export const analyticsCalculations = new AnalyticsCalculations();
export default analyticsCalculations;