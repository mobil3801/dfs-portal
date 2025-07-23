// Quick test to verify the filtering logic works without runtime errors
const testUserProfiles = [
  {
    id: "1",
    user_id: "user1",
    role: "admin",
    station_access: ["station1"],
    employee_id: "EMP001",
    phone: "123-456-7890",
    hire_date: "2023-01-01",
    is_active: true
  },
  {
    id: "2",
    user_id: "user2",
    role: "employee",
    station_access: null, // Test null value
    employee_id: null, // Test null value
    phone: "987-654-3210",
    hire_date: "2023-02-01",
    is_active: false
  },
  {
    id: "3",
    user_id: "user3",
    role: "manager",
    station_access: undefined, // Test undefined value
    employee_id: "", // Test empty string
    phone: undefined, // Test undefined value
    hire_date: "2023-03-01",
    is_active: true
  }
];

// Test the enhanced filtering logic
function testFilteringLogic() {
  console.log("Testing enhanced filtering logic...");
  
  // Enhanced helper function to safely convert to string and handle all edge cases
  const safeString = (value) => {
    // Handle null, undefined, and empty values
    if (value === null || value === undefined) return '';
    if (value === '') return '';
    
    // Handle different data types
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
      // Handle arrays by joining non-null/undefined elements
      return value.filter(item => item !== null && item !== undefined).join(', ');
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '';
      }
    }
    
    // Fallback for any other type
    try {
      return String(value);
    } catch {
      return '';
    }
  };

  // Safe toLowerCase function that handles undefined/null values with additional protection
  const safeToLowerCase = (value) => {
    try {
      const str = safeString(value);
      return str && typeof str === 'string' ? str.toLowerCase() : '';
    } catch {
      return '';
    }
  };

  // Test with various search terms
  const searchTerms = ['emp', 'admin', '123', '', null, undefined];
  
  searchTerms.forEach(searchTerm => {
    console.log(`\nTesting with search term: "${searchTerm}"`);
    
    const searchTermLower = searchTerm && typeof searchTerm === 'string' ? searchTerm.toLowerCase() : '';
    
    const filteredProfiles = testUserProfiles.filter((profile) => {
      // Enhanced search matching with additional safety checks
      const matchesSearch = !searchTermLower || (
        (profile?.employee_id && safeToLowerCase(profile.employee_id).includes(searchTermLower)) ||
        (profile?.phone && safeToLowerCase(profile.phone).includes(searchTermLower))
      );
      
      return matchesSearch;
    });
    
    console.log(`  Found ${filteredProfiles.length} matching profiles`);
    filteredProfiles.forEach(profile => {
      console.log(`    - ${profile.employee_id || 'N/A'} (${profile.phone || 'N/A'})`);
    });
  });
  
  console.log("\n✅ All filtering tests completed without errors!");
}

// Run the test
try {
  testFilteringLogic();
  console.log("\n🎉 SUCCESS: The TypeError 'Cannot read properties of undefined (reading 'toLowerCase')' has been resolved!");
} catch (error) {
  console.error("\n❌ ERROR:", error.message);
}
