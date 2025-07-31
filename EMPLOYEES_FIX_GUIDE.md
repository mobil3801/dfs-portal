# Fix Guide: "Failed to load employees" Error

## Problem Summary

The DFS Manager Portal is showing a "Failed to load employees" error on the employees page. This is caused by **Row Level Security (RLS) policies** blocking access to the employees table in the Supabase database.

## Root Cause Analysis

1. **RLS Enabled Without Policies**: The `employees` table has RLS enabled but no policies defined
2. **Schema Compatibility Issues**: Missing columns that the frontend expects
3. **ID Mapping Issues**: Frontend expects integer IDs but database uses UUIDs

## Quick Fix (Recommended)

### Step 1: Run the Quick Fix SQL

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the contents of [`database/quick-fix-employees-rls.sql`](database/quick-fix-employees-rls.sql)
4. Click **Run** to execute the SQL

This will:
- ✅ Add a permissive RLS policy allowing authenticated users to access employees
- ✅ Add missing columns the frontend expects
- ✅ Add sample employee data for testing
- ✅ Create a compatibility view for better frontend integration

### Step 2: Verify the Fix

1. Refresh the DFS Manager Portal
2. Navigate to the **Employees** page
3. You should now see employee data instead of the error

## Alternative Fixes

### Option A: Disable RLS Temporarily

If you need immediate access and security is not a concern:

```sql
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
```

### Option B: Run Full Migration

For a comprehensive fix with proper security policies:

1. Run the migration script:
   ```bash
   cd dfs-portal
   node scripts/apply-employees-fix.js
   ```

2. Or manually run [`database/migrations/fix-employees-rls-and-schema.sql`](database/migrations/fix-employees-rls-and-schema.sql)

## Technical Details

### What Was Wrong

1. **Missing RLS Policies**: 
   ```sql
   -- RLS was enabled but no policies existed
   ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
   -- Result: All queries blocked by default
   ```

2. **Schema Mismatch**:
   - Frontend expects: `ID` (integer), `station` (string), `shift`, `employment_status`
   - Database had: `id` (UUID), `station_id` (UUID reference), missing columns

3. **Adapter Configuration**:
   - Table mapping pointed to `employees` table directly
   - No handling for UUID to integer ID conversion

### What Was Fixed

1. **Added RLS Policy**:
   ```sql
   CREATE POLICY "Allow authenticated users" ON employees
   FOR ALL TO authenticated USING (true);
   ```

2. **Added Missing Columns**:
   ```sql
   ALTER TABLE employees ADD COLUMN station VARCHAR(255);
   ALTER TABLE employees ADD COLUMN shift VARCHAR(100);
   ALTER TABLE employees ADD COLUMN employment_status VARCHAR(100);
   -- ... and more
   ```

3. **Created Compatibility View**:
   ```sql
   CREATE VIEW employees_view AS SELECT 
     COALESCE(ID, row_number() OVER (ORDER BY created_at)) as ID,
     -- ... other columns with proper mapping
   FROM employees;
   ```

4. **Updated Adapter**:
   - Changed table mapping: `11727: 'employees_view'`
   - Added write table mapping for create/update/delete operations

## Files Modified

- ✅ [`database/quick-fix-employees-rls.sql`](database/quick-fix-employees-rls.sql) - Quick fix SQL script
- ✅ [`database/migrations/fix-employees-rls-and-schema.sql`](database/migrations/fix-employees-rls-and-schema.sql) - Comprehensive migration
- ✅ [`src/services/supabase/supabaseAdapter.ts`](src/services/supabase/supabaseAdapter.ts) - Updated table mappings
- ✅ [`scripts/apply-employees-fix.js`](scripts/apply-employees-fix.js) - Diagnostic and fix script

## Verification Steps

After applying the fix, verify it worked:

1. **Check Database Access**:
   ```sql
   SELECT COUNT(*) FROM employees;
   SELECT * FROM employees_view LIMIT 5;
   ```

2. **Test Frontend**:
   - Navigate to `/employees` in the portal
   - Should see employee list instead of error
   - Try searching and filtering

3. **Test CRUD Operations**:
   - Try adding a new employee
   - Try editing an existing employee
   - Verify changes are saved

## Security Considerations

The quick fix uses a permissive RLS policy that allows all authenticated users to access all employees. For production, consider implementing more restrictive policies based on:

- User roles (admin, manager, employee)
- Station access (users can only see employees from their assigned stations)
- Department restrictions

Example of a more restrictive policy:
```sql
CREATE POLICY "Station-based employee access" ON employees
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND (role = 'admin' OR station = employees.station)
  )
);
```

## Troubleshooting

### Still Getting "Failed to load employees"?

1. **Check RLS Status**:
   ```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'employees';
   ```

2. **Check Policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'employees';
   ```

3. **Check User Authentication**:
   - Ensure you're logged in to the portal
   - Check browser console for authentication errors

4. **Check Database Connection**:
   - Verify Supabase credentials in `env.local`
   - Test connection in Supabase dashboard

### Error: "relation 'employees_view' does not exist"

Run the quick fix SQL script again, specifically the view creation part:

```sql
CREATE OR REPLACE VIEW employees_view AS
SELECT 
    COALESCE(ID, row_number() OVER (ORDER BY created_at)) as ID,
    -- ... rest of the view definition
FROM employees;
```

## Support

If you continue to experience issues:

1. Check the browser console for detailed error messages
2. Verify all SQL scripts ran successfully
3. Ensure your Supabase project has the latest schema
4. Contact the development team with specific error messages

---

**Last Updated**: January 2025  
**Status**: ✅ Ready to deploy