// Test script to validate Employee-Supabase integration
// This can be run in browser console to test the integration

export const testEmployeeIntegration = async () => {
  console.log('🔍 Starting Employee-Supabase Integration Test...');
  const results: any[] = [];

  try {
    // Test 1: Check EZSite API availability
    console.log('1️⃣ Testing EZSite API availability...');
    if (typeof (window as any).ezsite === 'undefined' || typeof (window as any).ezsite.apis === 'undefined') {
      results.push({ test: 'API Availability', status: 'FAIL', error: 'EZSite API not available' });
      console.error('❌ EZSite API not available');
      return results;
    }
    results.push({ test: 'API Availability', status: 'PASS' });
    console.log('✅ EZSite API available');

    // Test 2: Employee Table Access (11727)
    console.log('2️⃣ Testing Employee table access (11727)...');
    try {
      const { data: employeeData, error: employeeError } = await (window as any).ezsite.apis.tablePage('11727', {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'ID',
        IsAsc: true,
        Filters: []
      });

      if (employeeError) {
        results.push({ test: 'Employee Table', status: 'FAIL', error: employeeError });
        console.error('❌ Employee table access failed:', employeeError);
      } else {
        results.push({ 
          test: 'Employee Table', 
          status: 'PASS', 
          data: { totalRecords: employeeData?.VirtualCount || 0 }
        });
        console.log(`✅ Employee table accessible. Records: ${employeeData?.VirtualCount || 0}`);
      }
    } catch (error) {
      results.push({ test: 'Employee Table', status: 'FAIL', error: error.toString() });
      console.error('❌ Employee table connection failed:', error);
    }

    // Test 3: File Upload Table Access (26928)
    console.log('3️⃣ Testing File Upload table access (26928)...');
    try {
      const { data: fileData, error: fileError } = await (window as any).ezsite.apis.tablePage('26928', {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'ID',
        IsAsc: true,
        Filters: []
      });

      if (fileError) {
        results.push({ test: 'File Upload Table', status: 'FAIL', error: fileError });
        console.error('❌ File upload table access failed:', fileError);
      } else {
        results.push({ 
          test: 'File Upload Table', 
          status: 'PASS', 
          data: { totalRecords: fileData?.VirtualCount || 0 }
        });
        console.log(`✅ File upload table accessible. Records: ${fileData?.VirtualCount || 0}`);
      }
    } catch (error) {
      results.push({ test: 'File Upload Table', status: 'FAIL', error: error.toString() });
      console.error('❌ File upload table connection failed:', error);
    }

    // Test 4: Employee Creation Test
    console.log('4️⃣ Testing Employee creation capability...');
    try {
      const testEmployeeData = {
        employee_id: 'TEST_INTEGRATION_001',
        first_name: 'Test',
        last_name: 'Integration',
        email: 'test.integration@example.com',
        phone: '1234567890',
        position: 'Test Position',
        station: 'Test Station',
        shift: 'Day',
        hire_date: new Date().toISOString(),
        salary: 0,
        is_active: true,
        employment_status: 'Ongoing',
        created_by: 1
      };

      // Check if test employee already exists
      const { data: existingTest } = await (window as any).ezsite.apis.tablePage('11727', {
        PageNo: 1,
        PageSize: 1,
        Filters: [{ name: 'employee_id', op: 'Equal', value: 'TEST_INTEGRATION_001' }]
      });

      if (existingTest?.List?.length > 0) {
        results.push({ test: 'Employee Creation', status: 'WARNING', data: 'Test employee already exists' });
        console.log('⚠️ Test employee already exists (previous test run)');
      } else {
        // Attempt to create test employee
        const { error: createError } = await (window as any).ezsite.apis.tableCreate('11727', testEmployeeData);
        
        if (createError) {
          results.push({ test: 'Employee Creation', status: 'FAIL', error: createError });
          console.error('❌ Employee creation failed:', createError);
        } else {
          results.push({ test: 'Employee Creation', status: 'PASS' });
          console.log('✅ Employee creation successful');

          // Clean up test employee
          const { data: createdEmployee } = await (window as any).ezsite.apis.tablePage('11727', {
            PageNo: 1,
            PageSize: 1,
            Filters: [{ name: 'employee_id', op: 'Equal', value: 'TEST_INTEGRATION_001' }]
          });

          if (createdEmployee?.List?.length > 0) {
            await (window as any).ezsite.apis.tableDelete('11727', { ID: createdEmployee.List[0].ID });
            console.log('🧹 Test employee cleaned up');
          }
        }
      }
    } catch (error) {
      results.push({ test: 'Employee Creation', status: 'FAIL', error: error.toString() });
      console.error('❌ Employee creation test failed:', error);
    }

    // Test 5: File Upload Test
    console.log('5️⃣ Testing File upload capability...');
    try {
      const testFile = new Blob(['Test file content for integration'], { type: 'text/plain' });
      const testFileWithName = new File([testFile], 'integration-test.txt', { type: 'text/plain' });

      const { data: uploadResult, error: uploadError } = await (window as any).ezsite.apis.upload({
        filename: 'integration-test.txt',
        file: testFileWithName
      });

      if (uploadError) {
        results.push({ test: 'File Upload', status: 'FAIL', error: uploadError });
        console.error('❌ File upload failed:', uploadError);
      } else {
        results.push({ test: 'File Upload', status: 'PASS', data: { fileId: uploadResult } });
        console.log('✅ File upload successful, ID:', uploadResult);
      }
    } catch (error) {
      results.push({ test: 'File Upload', status: 'FAIL', error: error.toString() });
      console.error('❌ File upload test failed:', error);
    }

    console.log('\n📊 Integration Test Summary:');
    console.table(results);
    
    const passCount = results.filter(r => r.status === 'PASS').length;
    const failCount = results.filter(r => r.status === 'FAIL').length;
    const warnCount = results.filter(r => r.status === 'WARNING').length;
    
    console.log(`\n🎯 Results: ${passCount} passed, ${failCount} failed, ${warnCount} warnings`);
    
    if (failCount === 0) {
      console.log('🎉 All tests passed! Employee-Supabase integration is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Check the results above for details.');
    }

    return results;

  } catch (error) {
    console.error('💥 Integration test failed:', error);
    results.push({ test: 'Integration Test', status: 'FAIL', error: error.toString() });
    return results;
  }
};

// Make function available globally for console testing
(window as any).testEmployeeIntegration = testEmployeeIntegration;

console.log('🚀 Employee Integration Test loaded. Run testEmployeeIntegration() in console to test.');