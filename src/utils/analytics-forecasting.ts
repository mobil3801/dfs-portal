// Analytics forecasting utilities for predictive analysis

interface ForecastOptions {
  timeframe: string;
  stations: string[];
  forecastDays: number;
  model?: 'linear' | 'moving_average' | 'exponential_smoothing' | 'seasonal';
}

interface DataPoint {
  date: string;
  value: number;
  metadata?: any;
}

interface ForecastResult {
  date: string;
  predicted: number;
  confidence: number;
  upperBound: number;
  lowerBound: number;
}

interface SeasonalPattern {
  daily: number[];
  weekly: number[];
  monthly: number[];
}

class AnalyticsForecast {
  private readonly tableIds = {
    salesReports: 12356,
    deliveryRecords: 12196
  };

  // Main forecast generation method
  async generateForecast(options: ForecastOptions) {
    const { timeframe, stations, forecastDays, model = 'exponential_smoothing' } = options;

    try {
      // Fetch historical data
      const historicalData = await this.fetchHistoricalData(timeframe, stations);

      if (historicalData.length < 7) {
        throw new Error('Insufficient historical data for forecasting (minimum 7 days required)');
      }

      // Generate forecasts for different metrics
      const [salesForecast, fuelForecast, expensesForecast, profitForecast] = await Promise.all([
      this.forecastSales(historicalData, forecastDays, model),
      this.forecastFuel(historicalData, forecastDays, model),
      this.forecastExpenses(historicalData, forecastDays, model),
      this.forecastProfitability(historicalData, forecastDays, model)]
      );

      return {
        sales: salesForecast,
        fuel: fuelForecast,
        expenses: expensesForecast,
        profitability: profitForecast,
        metadata: {
          model,
          historicalDays: historicalData.length,
          forecastDays,
          generatedAt: new Date().toISOString(),
          confidence: this.calculateOverallConfidence(salesForecast)
        }
      };
    } catch (error) {
      console.error('Error generating forecast:', error);
      throw new Error('Failed to generate forecast');
    }
  }

  // Fetch historical data for forecasting
  private async fetchHistoricalData(timeframe: string, stations: string[]) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 90); // Get 90 days of historical data

      const filters = [
      {
        name: 'report_date',
        op: 'GreaterThanOrEqual' as const,
        value: startDate.toISOString().split('T')[0]
      },
      {
        name: 'report_date',
        op: 'LessThanOrEqual' as const,
        value: endDate.toISOString().split('T')[0]
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
        IsAsc: true,
        Filters: filters
      });

      if (error) throw new Error(error);
      return data?.List || [];
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return [];
    }
  }

  // Sales forecasting
  private async forecastSales(historicalData: any[], forecastDays: number, model: string): Promise<ForecastResult[]> {
    const salesData = this.extractSalesData(historicalData);
    return this.applyForecastModel(salesData, forecastDays, model);
  }

  // Fuel sales forecasting
  private async forecastFuel(historicalData: any[], forecastDays: number, model: string) {
    const fuelData = this.extractFuelData(historicalData);
    const gallonsForecast = await this.applyForecastModel(fuelData.gallons, forecastDays, model);
    const revenueForecast = await this.applyForecastModel(fuelData.revenue, forecastDays, model);

    return gallonsForecast.map((gallonsItem, index) => ({
      date: gallonsItem.date,
      gallons: gallonsItem.predicted,
      revenue: revenueForecast[index]?.predicted || 0,
      confidence: Math.min(gallonsItem.confidence, revenueForecast[index]?.confidence || 0)
    }));
  }

  // Expenses forecasting
  private async forecastExpenses(historicalData: any[], forecastDays: number, model: string) {
    const expensesData = this.extractExpensesData(historicalData);
    const totalForecast = await this.applyForecastModel(expensesData.total, forecastDays, model);

    // Forecast by category
    const categories = ['Fuel Purchases', 'Inventory', 'Utilities', 'Maintenance', 'Other'];
    const categoryForecasts = await Promise.all(
      categories.map(async (category) => {
        const categoryData = expensesData.byCategory[category] || [];
        if (categoryData.length > 0) {
          return {
            category,
            forecast: await this.applyForecastModel(categoryData, forecastDays, model)
          };
        }
        return null;
      })
    );

    return totalForecast.map((item, index) => ({
      date: item.date,
      amount: item.predicted,
      confidence: item.confidence,
      byCategory: categoryForecasts.
      filter((cf) => cf !== null).
      reduce((acc, cf) => {
        acc[cf!.category] = cf!.forecast[index]?.predicted || 0;
        return acc;
      }, {} as any)
    }));
  }

  // Profitability forecasting
  private async forecastProfitability(historicalData: any[], forecastDays: number, model: string) {
    const profitData = this.extractProfitData(historicalData);
    const profitForecast = await this.applyForecastModel(profitData.profit, forecastDays, model);
    const marginForecast = await this.applyForecastModel(profitData.margin, forecastDays, model);

    return profitForecast.map((item, index) => ({
      date: item.date,
      profit: item.predicted,
      margin: marginForecast[index]?.predicted || 0,
      confidence: Math.min(item.confidence, marginForecast[index]?.confidence || 0)
    }));
  }

  // Extract sales data from historical records
  private extractSalesData(historicalData: any[]): DataPoint[] {
    const dailyTotals = this.groupByDate(historicalData, 'total_sales');
    return Object.entries(dailyTotals).map(([date, total]) => ({
      date,
      value: total
    }));
  }

  // Extract fuel data from historical records
  private extractFuelData(historicalData: any[]) {
    const dailyGallons = this.groupByDate(historicalData, 'total_gallons');
    const dailyRevenue = this.groupByDate(historicalData, 'total_sales'); // Simplified

    return {
      gallons: Object.entries(dailyGallons).map(([date, total]) => ({ date, value: total })),
      revenue: Object.entries(dailyRevenue).map(([date, total]) => ({ date, value: total * 0.6 })) // Estimate fuel portion
    };
  }

  // Extract expenses data from historical records
  private extractExpensesData(historicalData: any[]) {
    const dailyTotals = this.groupByDate(historicalData, 'expenses_data', (data) => {
      try {
        const expenses = JSON.parse(data || '[]');
        return expenses.reduce((sum: number, exp: any) => sum + (parseFloat(exp.amount) || 0), 0);
      } catch {
        return 0;
      }
    });

    // Simplified category breakdown
    const categories = {
      'Fuel Purchases': Object.entries(dailyTotals).map(([date, total]) => ({ date, value: total * 0.4 })),
      'Inventory': Object.entries(dailyTotals).map(([date, total]) => ({ date, value: total * 0.25 })),
      'Utilities': Object.entries(dailyTotals).map(([date, total]) => ({ date, value: total * 0.15 })),
      'Maintenance': Object.entries(dailyTotals).map(([date, total]) => ({ date, value: total * 0.1 })),
      'Other': Object.entries(dailyTotals).map(([date, total]) => ({ date, value: total * 0.1 }))
    };

    return {
      total: Object.entries(dailyTotals).map(([date, total]) => ({ date, value: total })),
      byCategory: categories
    };
  }

  // Extract profit data from historical records
  private extractProfitData(historicalData: any[]) {
    const dailyProfits = this.groupByDate(historicalData, 'total_sales', (sales, record) => {
      try {
        const expenses = JSON.parse(record.expenses_data || '[]');
        const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + (parseFloat(exp.amount) || 0), 0);
        return sales - totalExpenses;
      } catch {
        return sales * 0.2; // Estimate 20% profit margin
      }
    });

    const dailyMargins = this.groupByDate(historicalData, 'total_sales', (sales, record) => {
      try {
        const expenses = JSON.parse(record.expenses_data || '[]');
        const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + (parseFloat(exp.amount) || 0), 0);
        const profit = sales - totalExpenses;
        return sales > 0 ? profit / sales * 100 : 0;
      } catch {
        return 20; // Estimate 20% margin
      }
    });

    return {
      profit: Object.entries(dailyProfits).map(([date, profit]) => ({ date, value: profit })),
      margin: Object.entries(dailyMargins).map(([date, margin]) => ({ date, value: margin }))
    };
  }

  // Group data by date with custom aggregation
  private groupByDate(data: any[], field: string, customAggregator?: (value: number, record: any) => number): {[date: string]: number;} {
    return data.reduce((acc, record) => {
      const date = record.report_date?.split('T')[0] || new Date().toISOString().split('T')[0];
      const value = parseFloat(record[field]) || 0;
      const aggregatedValue = customAggregator ? customAggregator(value, record) : value;

      acc[date] = (acc[date] || 0) + aggregatedValue;
      return acc;
    }, {});
  }

  // Apply forecasting model
  private async applyForecastModel(data: DataPoint[], forecastDays: number, model: string): Promise<ForecastResult[]> {
    switch (model) {
      case 'linear':
        return this.linearRegression(data, forecastDays);
      case 'moving_average':
        return this.movingAverage(data, forecastDays);
      case 'exponential_smoothing':
        return this.exponentialSmoothing(data, forecastDays);
      case 'seasonal':
        return this.seasonalDecomposition(data, forecastDays);
      default:
        return this.exponentialSmoothing(data, forecastDays);
    }
  }

  // Linear regression forecasting
  private linearRegression(data: DataPoint[], forecastDays: number): ForecastResult[] {
    if (data.length < 2) {
      return this.generateFallbackForecast(data, forecastDays);
    }

    const n = data.length;
    const sumX = data.reduce((sum, _, index) => sum + index, 0);
    const sumY = data.reduce((sum, point) => sum + point.value, 0);
    const sumXY = data.reduce((sum, point, index) => sum + index * point.value, 0);
    const sumX2 = data.reduce((sum, _, index) => sum + index * index, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate confidence based on R-squared
    const meanY = sumY / n;
    const totalVariation = data.reduce((sum, point) => sum + Math.pow(point.value - meanY, 2), 0);
    const residualVariation = data.reduce((sum, point, index) => {
      const predicted = slope * index + intercept;
      return sum + Math.pow(point.value - predicted, 2);
    }, 0);

    const rSquared = 1 - residualVariation / totalVariation;
    const baseConfidence = Math.max(0.3, Math.min(0.9, rSquared));

    const forecast: ForecastResult[] = [];
    const lastDate = new Date(data[data.length - 1].date);

    for (let i = 1; i <= forecastDays; i++) {
      const predicted = slope * (n + i - 1) + intercept;
      const confidence = Math.max(0.1, baseConfidence * Math.exp(-i * 0.05)); // Decay confidence over time
      const errorMargin = predicted * (1 - confidence) * 0.5;

      const forecastDate = new Date(lastDate);
      forecastDate.setDate(lastDate.getDate() + i);

      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        predicted: Math.max(0, predicted),
        confidence,
        upperBound: predicted + errorMargin,
        lowerBound: Math.max(0, predicted - errorMargin)
      });
    }

    return forecast;
  }

  // Moving average forecasting
  private movingAverage(data: DataPoint[], forecastDays: number, window = 7): ForecastResult[] {
    if (data.length < window) {
      return this.generateFallbackForecast(data, forecastDays);
    }

    const forecast: ForecastResult[] = [];
    const lastDate = new Date(data[data.length - 1].date);

    // Calculate moving averages for the last 'window' days
    const recentValues = data.slice(-window).map((d) => d.value);
    const movingAvg = recentValues.reduce((sum, val) => sum + val, 0) / window;

    // Calculate variance for confidence
    const variance = recentValues.reduce((sum, val) => sum + Math.pow(val - movingAvg, 2), 0) / window;
    const baseConfidence = Math.max(0.3, Math.min(0.8, 1 / (1 + variance / (movingAvg * movingAvg))));

    for (let i = 1; i <= forecastDays; i++) {
      const confidence = Math.max(0.1, baseConfidence * Math.exp(-i * 0.03));
      const errorMargin = movingAvg * (1 - confidence) * 0.3;

      const forecastDate = new Date(lastDate);
      forecastDate.setDate(lastDate.getDate() + i);

      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        predicted: Math.max(0, movingAvg),
        confidence,
        upperBound: movingAvg + errorMargin,
        lowerBound: Math.max(0, movingAvg - errorMargin)
      });
    }

    return forecast;
  }

  // Exponential smoothing forecasting
  private exponentialSmoothing(data: DataPoint[], forecastDays: number, alpha = 0.3): ForecastResult[] {
    if (data.length < 2) {
      return this.generateFallbackForecast(data, forecastDays);
    }

    let smoothedValue = data[0].value;
    const errors: number[] = [];

    // Calculate smoothed values and errors
    for (let i = 1; i < data.length; i++) {
      const error = Math.abs(data[i].value - smoothedValue);
      errors.push(error);
      smoothedValue = alpha * data[i].value + (1 - alpha) * smoothedValue;
    }

    // Calculate confidence based on average error
    const avgError = errors.reduce((sum, error) => sum + error, 0) / errors.length;
    const avgValue = data.reduce((sum, point) => sum + point.value, 0) / data.length;
    const baseConfidence = Math.max(0.2, Math.min(0.85, 1 - avgError / avgValue));

    const forecast: ForecastResult[] = [];
    const lastDate = new Date(data[data.length - 1].date);

    for (let i = 1; i <= forecastDays; i++) {
      const confidence = Math.max(0.1, baseConfidence * Math.exp(-i * 0.04));
      const errorMargin = smoothedValue * (1 - confidence) * 0.4;

      const forecastDate = new Date(lastDate);
      forecastDate.setDate(lastDate.getDate() + i);

      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        predicted: Math.max(0, smoothedValue),
        confidence,
        upperBound: smoothedValue + errorMargin,
        lowerBound: Math.max(0, smoothedValue - errorMargin)
      });
    }

    return forecast;
  }

  // Seasonal decomposition forecasting
  private seasonalDecomposition(data: DataPoint[], forecastDays: number): ForecastResult[] {
    if (data.length < 14) {
      return this.exponentialSmoothing(data, forecastDays);
    }

    // Detect seasonal patterns
    const seasonality = this.detectSeasonality(data);

    // Apply exponential smoothing to deseasonalized data
    const deseasonalized = this.deseasonalizeData(data, seasonality);
    const baseForecast = this.exponentialSmoothing(deseasonalized, forecastDays);

    // Reapply seasonality
    return baseForecast.map((item, index) => {
      const dayOfWeek = new Date(item.date).getDay();
      const seasonalFactor = seasonality.weekly[dayOfWeek] || 1;

      return {
        ...item,
        predicted: Math.max(0, item.predicted * seasonalFactor),
        upperBound: item.upperBound * seasonalFactor,
        lowerBound: Math.max(0, item.lowerBound * seasonalFactor)
      };
    });
  }

  // Detect seasonal patterns in data
  private detectSeasonality(data: DataPoint[]): SeasonalPattern {
    const daily = new Array(24).fill(1);
    const weekly = new Array(7).fill(1);
    const monthly = new Array(12).fill(1);

    // Group by day of week
    const weeklyTotals = new Array(7).fill(0);
    const weeklyCounts = new Array(7).fill(0);

    data.forEach((point) => {
      const date = new Date(point.date);
      const dayOfWeek = date.getDay();

      weeklyTotals[dayOfWeek] += point.value;
      weeklyCounts[dayOfWeek]++;
    });

    // Calculate weekly averages
    const overallAvg = data.reduce((sum, point) => sum + point.value, 0) / data.length;

    for (let i = 0; i < 7; i++) {
      if (weeklyCounts[i] > 0) {
        const dayAvg = weeklyTotals[i] / weeklyCounts[i];
        weekly[i] = overallAvg > 0 ? dayAvg / overallAvg : 1;
      }
    }

    return { daily, weekly, monthly };
  }

  // Remove seasonality from data
  private deseasonalizeData(data: DataPoint[], seasonality: SeasonalPattern): DataPoint[] {
    return data.map((point) => {
      const date = new Date(point.date);
      const dayOfWeek = date.getDay();
      const seasonalFactor = seasonality.weekly[dayOfWeek] || 1;

      return {
        ...point,
        value: seasonalFactor > 0 ? point.value / seasonalFactor : point.value
      };
    });
  }

  // Generate fallback forecast for insufficient data
  private generateFallbackForecast(data: DataPoint[], forecastDays: number): ForecastResult[] {
    const avgValue = data.length > 0 ? data.reduce((sum, point) => sum + point.value, 0) / data.length : 100;
    const lastDate = data.length > 0 ? new Date(data[data.length - 1].date) : new Date();

    const forecast: ForecastResult[] = [];

    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(lastDate.getDate() + i);

      const confidence = Math.max(0.1, 0.5 * Math.exp(-i * 0.1));
      const errorMargin = avgValue * 0.3;

      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        predicted: Math.max(0, avgValue),
        confidence,
        upperBound: avgValue + errorMargin,
        lowerBound: Math.max(0, avgValue - errorMargin)
      });
    }

    return forecast;
  }

  // Calculate overall confidence for a forecast
  private calculateOverallConfidence(forecast: ForecastResult[]): number {
    if (forecast.length === 0) return 0;
    return forecast.reduce((sum, item) => sum + item.confidence, 0) / forecast.length;
  }

  // Generate forecast summary
  async generateForecastSummary(forecast: any) {
    return {
      salesTrend: this.analyzeTrend(forecast.sales),
      fuelTrend: this.analyzeTrend(forecast.fuel.map((f: any) => ({ predicted: f.revenue }))),
      expensesTrend: this.analyzeTrend(forecast.expenses.map((f: any) => ({ predicted: f.amount }))),
      profitabilityTrend: this.analyzeTrend(forecast.profitability.map((f: any) => ({ predicted: f.profit }))),
      overallConfidence: forecast.metadata.confidence,
      recommendations: this.generateRecommendations(forecast)
    };
  }

  // Analyze trend direction
  private analyzeTrend(data: Array<{predicted: number;}>): string {
    if (data.length < 2) return 'insufficient_data';

    const first = data[0].predicted;
    const last = data[data.length - 1].predicted;
    const change = (last - first) / first * 100;

    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }

  // Generate recommendations based on forecast
  private generateRecommendations(forecast: any): string[] {
    const recommendations: string[] = [];

    const salesTrend = this.analyzeTrend(forecast.sales);
    const expensesTrend = this.analyzeTrend(forecast.expenses.map((f: any) => ({ predicted: f.amount })));
    const profitTrend = this.analyzeTrend(forecast.profitability.map((f: any) => ({ predicted: f.profit })));

    if (salesTrend === 'decreasing') {
      recommendations.push('Consider marketing campaigns to boost sales');
    }

    if (expensesTrend === 'increasing') {
      recommendations.push('Review expense categories for potential cost savings');
    }

    if (profitTrend === 'decreasing') {
      recommendations.push('Focus on improving profit margins through pricing or cost optimization');
    }

    if (forecast.metadata.confidence < 0.5) {
      recommendations.push('Forecast confidence is low - consider collecting more historical data');
    }

    return recommendations;
  }
}

export const analyticsForecasting = new AnalyticsForecast();
export default analyticsForecasting;