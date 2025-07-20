// Analytics export utilities for data export and reporting

interface ExportOptions {
  metrics: any;
  comparison?: any;
  forecast?: any;
  format: 'csv' | 'excel' | 'pdf';
  timeframe: string;
  stations: string[];
  includeCharts?: boolean;
  customFields?: string[];
  template?: string;
}

interface EmailReportOptions {
  metrics: any;
  comparison?: any;
  forecast?: any;
  recipients: string[];
  reportType: 'daily' | 'weekly' | 'monthly';
  timeframe: string;
  stations: string[];
  customMessage?: string;
}

interface ExportResult {
  filename: string;
  downloadUrl: string;
  size: number;
  format: string;
  generatedAt: string;
}

class AnalyticsExport {
  private readonly emailTemplateIds = {
    daily: 1,
    weekly: 2,
    monthly: 3
  };

  // Main export method
  async exportDashboardData(options: ExportOptions): Promise<ExportResult> {
    const { format, metrics, comparison, forecast, timeframe, stations } = options;

    try {
      switch (format) {
        case 'csv':
          return await this.exportToCSV(options);
        case 'excel':
          return await this.exportToExcel(options);
        case 'pdf':
          return await this.exportToPDF(options);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export data');
    }
  }

  // Export to CSV format
  private async exportToCSV(options: ExportOptions): Promise<ExportResult> {
    const { metrics, comparison, forecast, timeframe, stations } = options;

    let csvContent = 'data:text/csv;charset=utf-8,';

    // Add header
    csvContent += this.generateCSVHeader() + '\n';

    // Add metrics data
    if (metrics) {
      csvContent += this.convertMetricsToCSV(metrics) + '\n';
    }

    // Add comparison data
    if (comparison) {
      csvContent += '\n' + this.generateComparisonCSV(comparison) + '\n';
    }

    // Add forecast data
    if (forecast) {
      csvContent += '\n' + this.generateForecastCSV(forecast) + '\n';
    }

    // Create download URL
    const encodedUri = encodeURI(csvContent);
    const filename = this.generateFilename('csv', timeframe, stations);

    return {
      filename,
      downloadUrl: encodedUri,
      size: csvContent.length,
      format: 'csv',
      generatedAt: new Date().toISOString()
    };
  }

  // Export to Excel format
  private async exportToExcel(options: ExportOptions): Promise<ExportResult> {
    const { metrics, comparison, forecast, timeframe, stations } = options;

    // For Excel, we'll create a more structured format
    // This is a simplified implementation - in production, you'd use a library like xlsx

    const workbookData = {
      sheets: {
        'Dashboard Metrics': this.convertMetricsToTable(metrics),
        'Comparison Data': comparison ? this.convertComparisonToTable(comparison) : [],
        'Forecast Data': forecast ? this.convertForecastToTable(forecast) : []
      },
      metadata: {
        timeframe,
        stations,
        generatedAt: new Date().toISOString()
      }
    };

    // Convert to Excel-compatible format (simplified)
    const excelContent = this.convertToExcelFormat(workbookData);
    const filename = this.generateFilename('xlsx', timeframe, stations);

    // Create blob and URL
    const blob = new Blob([excelContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const downloadUrl = URL.createObjectURL(blob);

    return {
      filename,
      downloadUrl,
      size: blob.size,
      format: 'excel',
      generatedAt: new Date().toISOString()
    };
  }

  // Export to PDF format
  private async exportToPDF(options: ExportOptions): Promise<ExportResult> {
    const { metrics, comparison, forecast, timeframe, stations, includeCharts = true } = options;

    // Create HTML content for PDF
    const htmlContent = this.generatePDFHTML({
      metrics,
      comparison,
      forecast,
      timeframe,
      stations,
      includeCharts
    });

    // Convert HTML to PDF (simplified - in production, use a library like jsPDF or Puppeteer)
    const pdfContent = await this.convertHTMLToPDF(htmlContent);
    const filename = this.generateFilename('pdf', timeframe, stations);

    // Create blob and URL
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(blob);

    return {
      filename,
      downloadUrl,
      size: blob.size,
      format: 'pdf',
      generatedAt: new Date().toISOString()
    };
  }

  // Send email report
  async sendEmailReport(options: EmailReportOptions): Promise<void> {
    const { metrics, comparison, forecast, recipients, reportType, timeframe, stations, customMessage } = options;

    try {
      // Generate report content
      const reportContent = await this.generateEmailReportContent({
        metrics,
        comparison,
        forecast,
        reportType,
        timeframe,
        stations
      });

      // Create PDF attachment
      const pdfAttachment = await this.exportToPDF({
        metrics,
        comparison,
        forecast,
        format: 'pdf',
        timeframe,
        stations,
        includeCharts: true
      });

      // Send email using the email API
      const emailContent = {
        from: 'support@ezsite.ai',
        to: recipients,
        subject: this.generateEmailSubject(reportType, timeframe, stations),
        html: reportContent.html,
        text: reportContent.text
        // Note: Attachment handling would need to be implemented based on email service
      };

      const { error } = await window.ezsite.apis.sendEmail(emailContent);

      if (error) {
        throw new Error(error);
      }

      // Log the email send
      console.log(`Email report sent to ${recipients.length} recipients`);

    } catch (error) {
      console.error('Error sending email report:', error);
      throw new Error('Failed to send email report');
    }
  }

  // Generate CSV header
  private generateCSVHeader(): string {
    return [
    'Metric Type',
    'Metric Name',
    'Current Value',
    'Previous Value',
    'Change',
    'Change Percent',
    'Date Generated',
    'Station'].
    join(',');
  }

  // Convert metrics to CSV format
  private convertMetricsToCSV(metrics: any): string {
    const rows: string[] = [];

    // Total Sales
    rows.push([
    'Sales',
    'Total Sales',
    metrics.totalSales.current,
    metrics.totalSales.previous,
    metrics.totalSales.change,
    metrics.totalSales.changePercent,
    new Date().toISOString(),
    'All'].
    join(','));

    // Fuel Sales
    rows.push([
    'Fuel',
    'Fuel Revenue',
    metrics.fuelSales.current,
    '',
    metrics.fuelSales.change,
    '',
    new Date().toISOString(),
    'All'].
    join(','));

    rows.push([
    'Fuel',
    'Gallons Sold',
    metrics.fuelSales.gallonsSold,
    '',
    '',
    '',
    new Date().toISOString(),
    'All'].
    join(','));

    // Convenience Store Sales
    rows.push([
    'Convenience',
    'Convenience Sales',
    metrics.convenienceStoreSales.current,
    '',
    metrics.convenienceStoreSales.change,
    '',
    new Date().toISOString(),
    'All'].
    join(','));

    // Expenses
    rows.push([
    'Expenses',
    'Total Expenses',
    metrics.expenses.total,
    '',
    metrics.expenses.change,
    '',
    new Date().toISOString(),
    'All'].
    join(','));

    // Profit Margin
    rows.push([
    'Profitability',
    'Profit Margin',
    metrics.profitMargin.current,
    metrics.profitMargin.target,
    metrics.profitMargin.variance,
    '',
    new Date().toISOString(),
    'All'].
    join(','));

    return rows.join('\n');
  }

  // Generate comparison CSV
  private generateComparisonCSV(comparison: any): string {
    const rows: string[] = [];
    rows.push('\n=== COMPARISON DATA ===');
    rows.push('Period,Total Sales,Change from Previous,Change Percent');

    rows.push([
    'Current',
    comparison.current.totalSales.current,
    '',
    ''].
    join(','));

    rows.push([
    'Previous',
    comparison.previous.totalSales.current,
    comparison.current.totalSales.change,
    comparison.current.totalSales.changePercent].
    join(','));

    rows.push([
    'Year over Year',
    comparison.yearOverYear.totalSales.current,
    comparison.current.totalSales.current - comparison.yearOverYear.totalSales.current,
    ''].
    join(','));

    return rows.join('\n');
  }

  // Generate forecast CSV
  private generateForecastCSV(forecast: any): string {
    const rows: string[] = [];
    rows.push('\n=== FORECAST DATA ===');
    rows.push('Date,Sales Forecast,Confidence,Upper Bound,Lower Bound');

    forecast.sales.forEach((item: any) => {
      rows.push([
      item.date,
      item.predicted,
      item.confidence,
      item.upperBound,
      item.lowerBound].
      join(','));
    });

    return rows.join('\n');
  }

  // Convert metrics to table format
  private convertMetricsToTable(metrics: any): any[] {
    return [
    ['Metric', 'Current', 'Previous', 'Change', 'Change %'],
    ['Total Sales', metrics.totalSales.current, metrics.totalSales.previous, metrics.totalSales.change, metrics.totalSales.changePercent],
    ['Fuel Revenue', metrics.fuelSales.current, '', metrics.fuelSales.change, ''],
    ['Convenience Sales', metrics.convenienceStoreSales.current, '', metrics.convenienceStoreSales.change, ''],
    ['Total Expenses', metrics.expenses.total, '', metrics.expenses.change, ''],
    ['Profit Margin %', metrics.profitMargin.current, metrics.profitMargin.target, metrics.profitMargin.variance, '']];

  }

  // Convert comparison to table format
  private convertComparisonToTable(comparison: any): any[] {
    return [
    ['Period', 'Total Sales', 'Fuel Sales', 'Convenience Sales'],
    ['Current', comparison.current.totalSales.current, comparison.current.fuelSales.current, comparison.current.convenienceStoreSales.current],
    ['Previous', comparison.previous.totalSales.current, comparison.previous.fuelSales.current, comparison.previous.convenienceStoreSales.current],
    ['Year over Year', comparison.yearOverYear.totalSales.current, comparison.yearOverYear.fuelSales.current, comparison.yearOverYear.convenienceStoreSales.current]];

  }

  // Convert forecast to table format
  private convertForecastToTable(forecast: any): any[] {
    const table = [['Date', 'Sales Forecast', 'Confidence', 'Upper Bound', 'Lower Bound']];

    forecast.sales.forEach((item: any) => {
      table.push([
      item.date,
      item.predicted,
      (item.confidence * 100).toFixed(1) + '%',
      item.upperBound,
      item.lowerBound]
      );
    });

    return table;
  }

  // Convert to Excel format (simplified)
  private convertToExcelFormat(workbookData: any): string {
    // This is a simplified implementation
    // In production, you would use a library like xlsx or SheetJS
    let content = '';

    Object.entries(workbookData.sheets).forEach(([sheetName, data]: [string, any]) => {
      content += `Sheet: ${sheetName}\n`;
      if (Array.isArray(data)) {
        data.forEach((row) => {
          if (Array.isArray(row)) {
            content += row.join('\t') + '\n';
          }
        });
      }
      content += '\n';
    });

    return content;
  }

  // Generate PDF HTML content
  private generatePDFHTML(options: any): string {
    const { metrics, comparison, forecast, timeframe, stations } = options;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Dashboard Analytics Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .metrics-section { margin: 20px 0; }
          .metric { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; }
          .forecast-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .forecast-table th, .forecast-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .forecast-table th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Dashboard Analytics Report</h1>
          <p>Timeframe: ${timeframe} | Stations: ${stations.join(', ')}</p>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="metrics-section">
          <h2>Current Metrics</h2>
          <div class="metric">
            <span>Total Sales:</span>
            <span>$${metrics.totalSales.current.toLocaleString()}</span>
          </div>
          <div class="metric">
            <span>Fuel Revenue:</span>
            <span>$${metrics.fuelSales.current.toLocaleString()}</span>
          </div>
          <div class="metric">
            <span>Convenience Sales:</span>
            <span>$${metrics.convenienceStoreSales.current.toLocaleString()}</span>
          </div>
          <div class="metric">
            <span>Total Expenses:</span>
            <span>$${metrics.expenses.total.toLocaleString()}</span>
          </div>
          <div class="metric">
            <span>Profit Margin:</span>
            <span>${metrics.profitMargin.current.toFixed(1)}%</span>
          </div>
        </div>
        
        ${forecast ? this.generateForecastHTML(forecast) : ''}
        
        ${comparison ? this.generateComparisonHTML(comparison) : ''}
      </body>
      </html>
    `;
  }

  // Generate forecast HTML
  private generateForecastHTML(forecast: any): string {
    let html = '<div class="forecast-section"><h2>Sales Forecast</h2>';
    html += '<table class="forecast-table">';
    html += '<tr><th>Date</th><th>Predicted Sales</th><th>Confidence</th><th>Range</th></tr>';

    forecast.sales.slice(0, 7).forEach((item: any) => {
      html += `<tr>
        <td>${item.date}</td>
        <td>$${item.predicted.toLocaleString()}</td>
        <td>${(item.confidence * 100).toFixed(1)}%</td>
        <td>$${item.lowerBound.toLocaleString()} - $${item.upperBound.toLocaleString()}</td>
      </tr>`;
    });

    html += '</table></div>';
    return html;
  }

  // Generate comparison HTML
  private generateComparisonHTML(comparison: any): string {
    return `
      <div class="comparison-section">
        <h2>Period Comparison</h2>
        <div class="metrics-section">
          <div class="metric">
            <span>Current Period:</span>
            <span>$${comparison.current.totalSales.current.toLocaleString()}</span>
          </div>
          <div class="metric">
            <span>Previous Period:</span>
            <span>$${comparison.previous.totalSales.current.toLocaleString()}</span>
          </div>
          <div class="metric">
            <span>Change:</span>
            <span style="color: ${comparison.current.totalSales.change >= 0 ? 'green' : 'red'}">
              ${comparison.current.totalSales.change >= 0 ? '+' : ''}$${comparison.current.totalSales.change.toLocaleString()}
              (${comparison.current.totalSales.changePercent.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>
    `;
  }

  // Convert HTML to PDF (simplified)
  private async convertHTMLToPDF(html: string): Promise<Uint8Array> {
    // This is a simplified implementation
    // In production, you would use a library like jsPDF, Puppeteer, or a PDF service

    // For now, we'll create a simple text-based PDF structure
    const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length ${html.length}>>stream
BT
/F1 12 Tf
100 700 Td
(Dashboard Analytics Report) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000074 00000 n
0000000120 00000 n
0000000179 00000 n
trailer<</Size 5/Root 1 0 R>>
startxref
${200 + html.length}
%%EOF`;

    return new TextEncoder().encode(pdfContent);
  }

  // Generate email report content
  private async generateEmailReportContent(options: any): Promise<{html: string;text: string;}> {
    const { metrics, reportType, timeframe, stations } = options;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Dashboard Analytics Report</h1>
        <p style="text-align: center; color: #666;">
          ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report | ${timeframe} | ${stations.join(', ')}
        </p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">Key Metrics Summary</h2>
          
          <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: white; border-radius: 4px;">
            <span style="font-weight: bold;">Total Sales:</span>
            <span style="color: #007bff;">$${metrics.totalSales.current.toLocaleString()}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: white; border-radius: 4px;">
            <span style="font-weight: bold;">Fuel Revenue:</span>
            <span style="color: #007bff;">$${metrics.fuelSales.current.toLocaleString()}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: white; border-radius: 4px;">
            <span style="font-weight: bold;">Profit Margin:</span>
            <span style="color: ${metrics.profitMargin.current >= metrics.profitMargin.target ? '#28a745' : '#dc3545'};">
              ${metrics.profitMargin.current.toFixed(1)}%
            </span>
          </div>
        </div>
        
        <p style="color: #666; font-size: 14px; text-align: center;">
          This is an automated report generated by the DFS Manager system.
        </p>
      </div>
    `;

    const text = `
Dashboard Analytics Report
${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report | ${timeframe} | ${stations.join(', ')}

Key Metrics Summary:
- Total Sales: $${metrics.totalSales.current.toLocaleString()}
- Fuel Revenue: $${metrics.fuelSales.current.toLocaleString()}
- Profit Margin: ${metrics.profitMargin.current.toFixed(1)}%

This is an automated report generated by the DFS Manager system.
    `;

    return { html, text };
  }

  // Generate filename
  private generateFilename(format: string, timeframe: string, stations: string[]): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const stationStr = stations.length === 1 && stations[0] !== 'ALL' ? stations[0].replace(/ /g, '_') : 'All_Stations';
    return `dashboard_analytics_${timeframe}_${stationStr}_${timestamp}.${format}`;
  }

  // Generate email subject
  private generateEmailSubject(reportType: string, timeframe: string, stations: string[]): string {
    const stationStr = stations.length === 1 && stations[0] !== 'ALL' ? stations[0] : 'All Stations';
    return `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Analytics Report - ${stationStr} - ${new Date().toLocaleDateString()}`;
  }

  // Schedule automated reports
  async scheduleAutomatedReport(config: {
    reportType: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    stations: string[];
    timeframe: string;
    isActive: boolean;
  }): Promise<void> {
    try {
      // This would integrate with the email automation system
      const automationConfig = {
        automation_name: `${config.reportType}_analytics_report`,
        email_type: 'Sales Report',
        is_active: config.isActive,
        from_email: 'support@ezsite.ai',
        from_name: 'DFS Manager Analytics',
        trigger_condition: config.reportType === 'daily' ? 'daily_schedule' :
        config.reportType === 'weekly' ? 'weekly_schedule' : 'monthly_schedule',
        trigger_value: config.reportType === 'daily' ? 8 : // 8 AM
        config.reportType === 'weekly' ? 1 : // Monday
        1, // 1st of month
        frequency_hours: config.reportType === 'daily' ? 24 :
        config.reportType === 'weekly' ? 168 :
        720, // Monthly
        template_id: this.emailTemplateIds[config.reportType],
        recipient_groups: config.recipients.join(','),
        created_by: 1 // System user
      };

      // Save automation config (would use the email_automation_configs table)
      const { error } = await window.ezsite.apis.tableCreate(14605, automationConfig);

      if (error) {
        throw new Error(error);
      }

      console.log(`Automated ${config.reportType} report scheduled successfully`);
    } catch (error) {
      console.error('Error scheduling automated report:', error);
      throw new Error('Failed to schedule automated report');
    }
  }
}

export const analyticsExport = new AnalyticsExport();
export default analyticsExport;