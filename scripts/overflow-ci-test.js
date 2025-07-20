
// #!/usr/bin/env node

/**
 * Automated Overflow Detection for CI/CD Pipeline
 * 
 * This script can be integrated into your CI/CD pipeline to automatically
 * detect overflow issues before deployment.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const VIEWPORT_SIZES = [
{ width: 375, height: 667, name: 'iPhone SE' },
{ width: 414, height: 896, name: 'iPhone 11' },
{ width: 768, height: 1024, name: 'iPad' },
{ width: 1024, height: 768, name: 'iPad Landscape' },
{ width: 1280, height: 720, name: 'Laptop' },
{ width: 1920, height: 1080, name: 'Desktop' }];


const TEST_ROUTES = [
'/',
'/dashboard',
'/products',
'/orders',
'/customers',
'/settings'];


class OverflowCITester {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
    this.outputDir = options.outputDir || './overflow-test-reports';
    this.threshold = options.threshold || 10;
    this.browser = null;
    this.results = [];
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async runTests() {
    console.log('🚀 Starting overflow detection tests...');

    for (const route of TEST_ROUTES) {
      console.log(`\n📄 Testing route: ${route}`);

      for (const viewport of VIEWPORT_SIZES) {
        console.log(`  📱 Testing viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);

        try {
          const result = await this.testRouteAtViewport(route, viewport);
          this.results.push(result);

          if (result.issues.length > 0) {
            console.log(`    ⚠️  Found ${result.issues.length} overflow issues`);
          } else {
            console.log(`    ✅ No overflow issues found`);
          }
        } catch (error) {
          console.error(`    ❌ Test failed:`, error.message);
          this.results.push({
            route,
            viewport,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    await this.generateReport();
    await this.cleanup();

    return this.results;
  }

  async testRouteAtViewport(route, viewport) {
    const page = await this.browser.newPage();
    await page.setViewport(viewport);

    try {
      await page.goto(`${this.baseUrl}${route}`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for any dynamic content to load
      await page.waitForTimeout(2000);

      // Inject overflow detection script
      const issues = await page.evaluate((threshold) => {
        const overflowIssues = [];

        // Get all elements
        const elements = document.querySelectorAll('*');

        elements.forEach((element) => {
          // Skip elements that are intentionally scrollable
          const computedStyle = window.getComputedStyle(element);
          const overflow = computedStyle.overflow;
          const overflowX = computedStyle.overflowX;
          const overflowY = computedStyle.overflowY;

          if (overflow === 'auto' || overflow === 'scroll' ||
          overflowX === 'auto' || overflowX === 'scroll' ||
          overflowY === 'auto' || overflowY === 'scroll') {
            return;
          }

          const { scrollWidth, scrollHeight, clientWidth, clientHeight } = element;

          const horizontalOverflow = scrollWidth > clientWidth + threshold;
          const verticalOverflow = scrollHeight > clientHeight + threshold;

          if (horizontalOverflow || verticalOverflow) {
            let type;
            if (horizontalOverflow && verticalOverflow) {
              type = 'both';
            } else if (horizontalOverflow) {
              type = 'horizontal';
            } else {
              type = 'vertical';
            }

            // Generate selector
            let selector = element.tagName.toLowerCase();
            if (element.id) {
              selector = `#${element.id}`;
            } else if (element.className) {
              const classes = element.className.split(' ').filter((c) => c.length > 0);
              if (classes.length > 0) {
                selector = `${selector}.${classes.join('.')}`;
              }
            }

            overflowIssues.push({
              selector,
              type,
              scrollWidth,
              scrollHeight,
              clientWidth,
              clientHeight,
              overflowX: scrollWidth - clientWidth,
              overflowY: scrollHeight - clientHeight
            });
          }
        });

        return overflowIssues;
      }, this.threshold);

      // Take screenshot if issues found
      let screenshotPath = null;
      if (issues.length > 0) {
        const filename = `overflow-${route.replace(/[\/]/g, '_')}-${viewport.name.replace(/\s+/g, '_')}.png`;
        screenshotPath = path.join(this.outputDir, filename);
        await page.screenshot({ path: screenshotPath, fullPage: true });
      }

      return {
        route,
        viewport,
        issues,
        screenshotPath,
        timestamp: new Date().toISOString(),
        success: true
      };
    } finally {
      await page.close();
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.length,
        failedTests: this.results.filter((r) => r.issues && r.issues.length > 0).length,
        totalIssues: this.results.reduce((sum, r) => sum + (r.issues?.length || 0), 0)
      },
      testResults: this.results
    };

    // Generate JSON report
    const jsonPath = path.join(this.outputDir, 'overflow-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    const htmlPath = path.join(this.outputDir, 'overflow-report.html');
    const htmlContent = this.generateHTMLReport(report);
    fs.writeFileSync(htmlPath, htmlContent);

    console.log(`\n📊 Reports generated:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   HTML: ${htmlPath}`);

    // Generate CI summary
    this.generateCISummary(report);
  }

  generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Overflow Detection Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .test-result { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 4px; }
        .success { border-left: 4px solid #4CAF50; }
        .warning { border-left: 4px solid #FF9800; }
        .error { border-left: 4px solid #F44336; }
        .issue { background: #fff3cd; padding: 10px; margin: 5px 0; border-radius: 4px; }
        .screenshot { max-width: 100%; height: auto; border: 1px solid #ddd; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Overflow Detection Report</h1>
    
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Generated:</strong> ${report.timestamp}</p>
        <p><strong>Total Tests:</strong> ${report.summary.totalTests}</p>
        <p><strong>Failed Tests:</strong> ${report.summary.failedTests}</p>
        <p><strong>Total Issues:</strong> ${report.summary.totalIssues}</p>
        <p><strong>Success Rate:</strong> ${((report.summary.totalTests - report.summary.failedTests) / report.summary.totalTests * 100).toFixed(1)}%</p>
    </div>

    <h2>Test Results</h2>
    ${report.testResults.map((result) => `
        <div class="test-result ${result.issues && result.issues.length > 0 ? 'warning' : 'success'}">
            <h3>${result.route} - ${result.viewport.name}</h3>
            <p><strong>Viewport:</strong> ${result.viewport.width}x${result.viewport.height}</p>
            <p><strong>Issues Found:</strong> ${result.issues ? result.issues.length : 0}</p>
            
            ${result.issues && result.issues.length > 0 ? `
                <h4>Issues:</h4>
                ${result.issues.map((issue) => `
                    <div class="issue">
                        <strong>${issue.selector}</strong> - ${issue.type} overflow
                        <br>Scroll: ${issue.scrollWidth}x${issue.scrollHeight}, Client: ${issue.clientWidth}x${issue.clientHeight}
                        <br>Overflow: ${issue.overflowX}px horizontal, ${issue.overflowY}px vertical
                    </div>
                `).join('')}
            ` : ''}
            
            ${result.screenshotPath ? `
                <h4>Screenshot:</h4>
                <img src="${path.basename(result.screenshotPath)}" class="screenshot" alt="Screenshot">
            ` : ''}
        </div>
    `).join('')}
</body>
</html>
    `;
  }

  generateCISummary(report) {
    const hasIssues = report.summary.totalIssues > 0;
    const exitCode = hasIssues ? 1 : 0;

    console.log(`\n🏁 CI Summary:`);
    console.log(`   Status: ${hasIssues ? '❌ FAILED' : '✅ PASSED'}`);
    console.log(`   Total Issues: ${report.summary.totalIssues}`);
    console.log(`   Failed Tests: ${report.summary.failedTests}/${report.summary.totalTests}`);

    if (hasIssues) {
      console.log(`\n⚠️  Overflow issues detected! Check the report for details.`);
    } else {
      console.log(`\n✅ All tests passed! No overflow issues detected.`);
    }

    // Set exit code for CI
    process.exitCode = exitCode;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const baseUrl = args[0] || 'http://localhost:3000';

  const tester = new OverflowCITester({
    baseUrl,
    outputDir: './overflow-test-reports',
    threshold: 10
  });

  try {
    await tester.init();
    await tester.runTests();
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = OverflowCITester;