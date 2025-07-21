# Testing Execution Guide

This guide provides step-by-step instructions for executing the test scripts to verify the production fixes.

## Step 1: Apply the Database Migration

### Option A: Using Supabase Dashboard (Recommended)
1. Log in to your Supabase Dashboard at https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy the entire contents of `database/fix-production-schema.sql`
6. Paste into the SQL editor
7. Click **Run** (or press Ctrl+Enter)
8. Check the output for any errors

### Option B: Using Supabase CLI
```bash
# If not installed, install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project (replace with your actual project ref)
supabase link --project-ref nehhjsiuhthflfwkfequ

# Apply the migration
supabase db push database/fix-production-schema.sql
```

## Step 2: Verify Database Migration

### Execute verify-migration.sql
1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy the entire contents of `database/verify-migration.sql`
4. Paste into the SQL editor
5. Click **Run**
6. Review the output - you should see:
   ```
   NOTICE: PASSED: All required tables exist
   NOTICE: PASSED: Column licenses.expiry_date exists
   NOTICE: PASSED: Column audit_logs.event_timestamp exists
   NOTICE: PASSED: module_access table structure verified (11 columns)
   NOTICE: PASSED: products table structure verified (18 columns)
   NOTICE: PASSED: sales_reports table structure verified (19 columns)
   NOTICE: PASSED: deliveries table structure verified (16 columns)
   NOTICE: PASSED: All indexes exist
   NOTICE: PASSED: RLS enabled on all new tables
   NOTICE: PASSED: All triggers exist
   NOTICE: PASSED: module_access table operations work
   NOTICE: PASSED: products table operations work
   NOTICE: PASSED: sales_reports table operations work
   NOTICE: PASSED: deliveries table operations work
   NOTICE: PASSED: licenses.expiry_date has correct data type
   NOTICE: PASSED: audit_logs.event_timestamp has correct data type
   
   NOTICE: ========================================
   NOTICE: MIGRATION VERIFICATION COMPLETE
   NOTICE: ========================================
   ```

### If You See Errors:
- **"Missing tables"** - The migration didn't run successfully
- **"Column does not exist"** - The column additions failed
- **"RLS not enabled"** - Security policies weren't applied

## Step 3: Deploy the Updated Code

Deploy the updated `src/pages/Admin/UserManagement.tsx` file to your production environment:

### For Vercel:
```bash
git add src/pages/Admin/UserManagement.tsx
git commit -m "Fix UserManagement TypeError - remove detailed_permissions reference"
git push origin main
```

Wait for Vercel to complete the deployment.

## Step 4: Run Frontend Tests

### Execute test-frontend-fixes.js in Browser Console

1. Open your deployed application in Chrome/Edge/Firefox
2. Navigate to the UserManagement page (e.g., https://dfs-portal-d3ha6m76f-mobins-projects-e019e916.vercel.app/admin/user-management)
3. Open Developer Tools (F12)
4. Go to the **Console** tab
5. Copy the entire contents of `scripts/test-frontend-fixes.js`
6. Paste into the console and press Enter
7. Review the test results

### Expected Output:
```
🧪 Starting Frontend Fix Verification Tests...

📋 Testing UserManagement Page...
✅ UserManagement TypeError: No TypeError detected
✅ Stat Cards: Found 4 stat cards
✅ Managers Stat Card: Managers card is displayed correctly

📋 Testing API Endpoints...
✅ module_access API: Table accessible via API
✅ products API: Table accessible via API
✅ sales_reports API: Table accessible via API
✅ deliveries API: Table accessible via API
✅ licenses.expiry_date: Column accessible via API
✅ audit_logs.event_timestamp: Column accessible via API

📋 Checking for Console Errors...
✅ Console Errors: No error indicators visible

========================================
📊 TEST SUMMARY
========================================
✅ Passed: 10 tests
❌ Failed: 0 tests
⚠️  Warnings: 0 tests

🎉 All critical tests passed! The fixes appear to be working correctly.
```

## Step 5: Manual Testing Checklist

Open `TEST_CHECKLIST.md` and work through each section:

### Quick Verification Tests:
1. **UserManagement Page**
   - [ ] Navigate to /admin/user-management
   - [ ] Verify no TypeError in console
   - [ ] Check all 4 stat cards display numbers
   - [ ] Confirm "Managers" card shows (not "With Permissions")

2. **Create a Test User**
   - [ ] Click "Create New User" or "Add User Profile Only"
   - [ ] Fill in required fields
   - [ ] Save successfully

3. **Test Module Access**
   - [ ] Click on a user's permission icon
   - [ ] Verify module access dialog opens
   - [ ] No errors in console

4. **Test Other Features** (if accessible in your UI)
   - [ ] Navigate to Products page (if exists)
   - [ ] Navigate to Sales Reports page (if exists)
   - [ ] Navigate to Deliveries page (if exists)

## Troubleshooting

### If Database Tests Fail:
1. Ensure you're connected to the correct database
2. Check if you have sufficient permissions
3. Try running the migration again
4. Check Supabase logs for errors

### If Frontend Tests Fail:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh the page (Ctrl+Shift+R)
3. Ensure the latest code is deployed
4. Check browser console for specific errors

### If API Tests Show "Table not found":
1. The migration hasn't been applied yet
2. There might be a connection issue
3. The table IDs might be different in your environment

## Success Criteria

✅ All database verification tests pass
✅ No TypeErrors in UserManagement page
✅ All API endpoints respond without "table does not exist" errors
✅ Manual testing shows features working correctly

## Need Help?

If you encounter issues:
1. Check the Supabase logs for database errors
2. Review the browser console for JavaScript errors
3. Verify the deployment completed successfully
4. Ensure all environment variables are set correctly
