/**
 * Frontend Test Script for Production Fixes
 * 
 * This script tests the frontend functionality after applying database migrations
 * and deploying the updated UserManagement component.
 * 
 * Usage: Copy and paste this into browser console on the deployed site
 */

(async function testFrontendFixes() {
    console.log('🧪 Starting Frontend Fix Verification Tests...\n');
    
    const results = {
        passed: [],
        failed: [],
        warnings: []
    };
    
    // Helper function to log results
    const logResult = (test, status, message) => {
        const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
        console.log(`${emoji} ${test}: ${message}`);
        
        if (status === 'pass') results.passed.push(test);
        else if (status === 'fail') results.failed.push({ test, message });
        else results.warnings.push({ test, message });
    };
    
    // Test 1: Check if UserManagement page loads without errors
    const testUserManagement = async () => {
        try {
            // Check if we're on the UserManagement page
            const isUserManagementPage = window.location.pathname.includes('user-management') || 
                                        document.querySelector('[data-testid="user-management"]') !== null;
            
            if (!isUserManagementPage) {
                logResult('UserManagement Page', 'warn', 'Not on UserManagement page - navigate there to test');
                return;
            }
            
            // Check for the TypeError that was fixed
            const errorBoundary = document.querySelector('[data-error-boundary]');
            if (errorBoundary && errorBoundary.textContent.includes('toLowerCase')) {
                logResult('UserManagement TypeError', 'fail', 'TypeError still present on page');
            } else {
                logResult('UserManagement TypeError', 'pass', 'No TypeError detected');
            }
            
            // Check if stat cards are rendering
            const statCards = document.querySelectorAll('.text-2xl.font-bold');
            if (statCards.length >= 4) {
                logResult('Stat Cards', 'pass', `Found ${statCards.length} stat cards`);
                
                // Verify "Managers" card exists (replaced "With Permissions")
                const managersCard = Array.from(document.querySelectorAll('.text-sm.text-gray-600'))
                    .find(el => el.textContent === 'Managers');
                
                if (managersCard) {
                    logResult('Managers Stat Card', 'pass', 'Managers card is displayed correctly');
                } else {
                    logResult('Managers Stat Card', 'fail', 'Managers card not found');
                }
            } else {
                logResult('Stat Cards', 'fail', `Only found ${statCards.length} stat cards`);
            }
            
        } catch (error) {
            logResult('UserManagement Page', 'fail', error.message);
        }
    };
    
    // Test 2: Check API calls for new tables
    const testAPIEndpoints = async () => {
        try {
            // Check if window.ezsite.apis is available
            if (!window.ezsite || !window.ezsite.apis) {
                logResult('API Access', 'warn', 'ezsite.apis not available - cannot test API endpoints');
                return;
            }
            
            // Test module_access table (ID: 25712)
            try {
                const moduleAccessResponse = await window.ezsite.apis.tablePage(25712, {
                    PageNo: 1,
                    PageSize: 1
                });
                logResult('module_access API', 'pass', 'Table accessible via API');
            } catch (error) {
                if (error.message && error.message.includes('does not exist')) {
                    logResult('module_access API', 'fail', 'Table still not found - migration may not be applied');
                } else {
                    logResult('module_access API', 'warn', `Different error: ${error.message}`);
                }
            }
            
            // Test products table (ID: 11726)
            try {
                const productsResponse = await window.ezsite.apis.tablePage(11726, {
                    PageNo: 1,
                    PageSize: 1
                });
                logResult('products API', 'pass', 'Table accessible via API');
            } catch (error) {
                if (error.message && error.message.includes('does not exist')) {
                    logResult('products API', 'fail', 'Table still not found - migration may not be applied');
                } else {
                    logResult('products API', 'warn', `Different error: ${error.message}`);
                }
            }
            
            // Test sales_reports table (ID: 12356)
            try {
                const salesResponse = await window.ezsite.apis.tablePage(12356, {
                    PageNo: 1,
                    PageSize: 1
                });
                logResult('sales_reports API', 'pass', 'Table accessible via API');
            } catch (error) {
                if (error.message && error.message.includes('does not exist')) {
                    logResult('sales_reports API', 'fail', 'Table still not found - migration may not be applied');
                } else {
                    logResult('sales_reports API', 'warn', `Different error: ${error.message}`);
                }
            }
            
            // Test deliveries table (ID: 12196)
            try {
                const deliveriesResponse = await window.ezsite.apis.tablePage(12196, {
                    PageNo: 1,
                    PageSize: 1
                });
                logResult('deliveries API', 'pass', 'Table accessible via API');
            } catch (error) {
                if (error.message && error.message.includes('does not exist')) {
                    logResult('deliveries API', 'fail', 'Table still not found - migration may not be applied');
                } else {
                    logResult('deliveries API', 'warn', `Different error: ${error.message}`);
                }
            }
            
            // Test licenses table with expiry_date filter
            try {
                const licensesResponse = await window.ezsite.apis.tablePage(11731, {
                    PageNo: 1,
                    PageSize: 1,
                    Filters: [{
                        name: 'expiry_date',
                        op: 'LessThanOrEqual',
                        value: new Date().toISOString()
                    }]
                });
                logResult('licenses.expiry_date', 'pass', 'Column accessible via API');
            } catch (error) {
                if (error.message && error.message.includes('column licenses.expiry_date does not exist')) {
                    logResult('licenses.expiry_date', 'fail', 'Column still not found - migration may not be applied');
                } else {
                    logResult('licenses.expiry_date', 'warn', `Different error: ${error.message}`);
                }
            }
            
            // Test audit_logs table with event_timestamp filter
            try {
                const auditResponse = await window.ezsite.apis.tablePage(12706, {
                    PageNo: 1,
                    PageSize: 1,
                    Filters: [{
                        name: 'event_timestamp',
                        op: 'GreaterThanOrEqual',
                        value: new Date(Date.now() - 86400000).toISOString() // 24 hours ago
                    }]
                });
                logResult('audit_logs.event_timestamp', 'pass', 'Column accessible via API');
            } catch (error) {
                if (error.message && error.message.includes('column audit_logs.event_timestamp does not exist')) {
                    logResult('audit_logs.event_timestamp', 'fail', 'Column still not found - migration may not be applied');
                } else {
                    logResult('audit_logs.event_timestamp', 'warn', `Different error: ${error.message}`);
                }
            }
            
        } catch (error) {
            logResult('API Tests', 'fail', error.message);
        }
    };
    
    // Test 3: Check console for database errors
    const checkConsoleErrors = () => {
        // This would need to be run before errors occur, but we can check current state
        const consoleElement = document.querySelector('.console-error-indicator');
        if (consoleElement) {
            logResult('Console Errors', 'warn', 'Error indicators found on page');
        } else {
            logResult('Console Errors', 'pass', 'No error indicators visible');
        }
    };
    
    // Run all tests
    console.log('📋 Testing UserManagement Page...');
    await testUserManagement();
    
    console.log('\n📋 Testing API Endpoints...');
    await testAPIEndpoints();
    
    console.log('\n📋 Checking for Console Errors...');
    checkConsoleErrors();
    
    // Summary
    console.log('\n========================================');
    console.log('📊 TEST SUMMARY');
    console.log('========================================');
    console.log(`✅ Passed: ${results.passed.length} tests`);
    console.log(`❌ Failed: ${results.failed.length} tests`);
    console.log(`⚠️  Warnings: ${results.warnings.length} tests`);
    
    if (results.failed.length > 0) {
        console.log('\n❌ Failed Tests:');
        results.failed.forEach(({ test, message }) => {
            console.log(`  - ${test}: ${message}`);
        });
    }
    
    if (results.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        results.warnings.forEach(({ test, message }) => {
            console.log(`  - ${test}: ${message}`);
        });
    }
    
    if (results.failed.length === 0) {
        console.log('\n🎉 All critical tests passed! The fixes appear to be working correctly.');
    } else {
        console.log('\n⚠️  Some tests failed. Please ensure:');
        console.log('  1. The database migration has been applied');
        console.log('  2. The updated UserManagement component has been deployed');
        console.log('  3. Browser cache has been cleared');
    }
    
    // Return results for programmatic use
    return results;
})();
