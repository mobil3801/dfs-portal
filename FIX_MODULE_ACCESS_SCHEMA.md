# Fix for ModuleAccessContext Error

## Problem Summary
The error `Could not find the 'create_enabled' column of 'module_access' in the schema cache` occurred because the `module_access` table structure didn't match what the React context expected.

## Root Cause
The existing `module_access` table (Table ID: 25712) had these columns:
- `permissions` (JSONB)
- `is_active` (BOOLEAN)

But the React context expected:
- `create_enabled` (BOOLEAN)
- `edit_enabled` (BOOLEAN)
- `delete_enabled` (BOOLEAN)
- `display_name` (VARCHAR)

## Solution
Created a comprehensive migration to fix the schema and ensure compatibility.

## Files Created/Updated

### 1. Migration File
**File**: `supabase/migrations/20240721153001_fix_module_access_schema.sql`
- Adds missing columns: `display_name`, `create_enabled`, `edit_enabled`, `delete_enabled`
- Updates existing records with sensible defaults
- Creates necessary indexes for performance
- Sets up proper RLS policies

### 2. Updated React Context
**File**: `src/contexts/ModuleAccessContext.tsx`
- Maintains backward compatibility
- Properly handles the new schema structure

## Migration Steps

1. **Apply the migration**:
   ```bash
   # The migration will automatically run when you restart your Supabase project
   # or you can manually apply it via the Supabase dashboard
   ```

2. **Verify the fix**:
   - Check that the `module_access` table now has all required columns
   - Test the React application to ensure it can create module delivery records

3. **Test the functionality**:
   - The `createDefaultModules` function should now work correctly
   - All module access permissions should be properly set

## Schema Changes Summary

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `display_name` | VARCHAR(255) | - | Human-readable module name |
| `create_enabled` | BOOLEAN | false | Allow creation of records |
| `edit_enabled` | BOOLEAN | false | Allow editing of records |
| `delete_enabled` | BOOLEAN | false | Allow deletion of records |

## Testing Checklist

- [ ] Migration applies successfully
- [ ] All required columns exist in `module_access` table
- [ ] React context can access the table without errors
- [ ] Default modules are created successfully
- [ ] Module permissions work correctly

## Rollback Plan

If issues occur, you can rollback by:
1. Dropping the new columns: `ALTER TABLE module_access DROP COLUMN create_enabled, DROP COLUMN edit_enabled, DROP COLUMN delete_enabled, DROP COLUMN display_name;`
2. Restoring the original table structure

The migration is designed to be idempotent and can be safely re-run if needed.
