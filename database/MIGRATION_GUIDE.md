# Production Database Migration Guide

This guide explains how to apply the database fixes to resolve the production errors.

## Issues Fixed

1. **Missing Tables**:
   - `module_access` (Table ID: 25712)
   - `products` (Table ID: 11726)
   - `sales_reports` (Table ID: 12356)
   - `deliveries` (Table ID: 12196)

2. **Missing Columns**:
   - `licenses.expiry_date` - Added DATE column
   - `audit_logs.event_timestamp` - Added TIMESTAMP WITH TIME ZONE column

3. **Application Error**:
   - Fixed TypeError in UserManagement component by removing reference to non-existent `detailed_permissions` field

## How to Apply the Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. Log in to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy the entire contents of `database/fix-production-schema.sql`
4. Paste it into the SQL Editor
5. Click "Run" to execute the migration
6. Verify the migration was successful by checking the output

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project (replace with your project ref)
supabase link --project-ref your-project-ref

# Run the migration
supabase db push database/fix-production-schema.sql
```

### Option 3: Using psql

```bash
# Connect to your database
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the migration
\i database/fix-production-schema.sql
```

## Verification Steps

After running the migration, verify that:

1. **Tables exist**:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('module_access', 'products', 'sales_reports', 'deliveries');
```

2. **Columns exist**:
```sql
-- Check licenses.expiry_date
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'licenses' 
AND column_name = 'expiry_date';

-- Check audit_logs.event_timestamp
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'audit_logs' 
AND column_name = 'event_timestamp';
```

3. **RLS is enabled**:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('module_access', 'products', 'sales_reports', 'deliveries');
```

## Post-Migration Steps

1. **Deploy the updated UserManagement component** to fix the TypeError
2. **Clear browser cache** to ensure the latest code is loaded
3. **Test the application** to verify all errors are resolved
4. **Monitor logs** for any new issues

## Rollback Plan

If you need to rollback the changes:

```sql
-- Drop the newly created tables
DROP TABLE IF EXISTS public.module_access CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.sales_reports CASCADE;
DROP TABLE IF EXISTS public.deliveries CASCADE;

-- Remove the added columns (be careful with this if data exists)
ALTER TABLE public.licenses DROP COLUMN IF EXISTS expiry_date;
ALTER TABLE public.audit_logs DROP COLUMN IF EXISTS event_timestamp;
```

## Notes

- The migration script is idempotent - it can be run multiple times safely
- All new tables have Row Level Security (RLS) enabled
- Proper indexes are created for performance
- The script uses `IF NOT EXISTS` clauses to prevent errors if objects already exist
