# Production Fix Test Checklist

## Pre-Deployment Testing

### 1. Database Migration Verification
Run `database/verify-migration.sql` after applying the migration to ensure:

- [ ] All 4 missing tables are created:
  - [ ] `module_access`
  - [ ] `products`
  - [ ] `sales_reports`
  - [ ] `deliveries`

- [ ] Missing columns are added:
  - [ ] `licenses.expiry_date` (DATE type)
  - [ ] `audit_logs.event_timestamp` (TIMESTAMP WITH TIME ZONE type)

- [ ] All indexes are created
- [ ] Row Level Security (RLS) is enabled on new tables
- [ ] Triggers are set up for `updated_at` columns
- [ ] Basic CRUD operations work on all new tables

### 2. Code Deployment Verification
After deploying the updated UserManagement component:

- [ ] UserManagement page loads without TypeError
- [ ] All 4 stat cards display correctly
- [ ] "Managers" stat card shows (replaced "With Permissions")
- [ ] No console errors related to `toLowerCase()` on undefined

## Post-Deployment Testing

### 3. Frontend Functionality Tests
Run `scripts/test-frontend-fixes.js` in browser console:

#### UserManagement Page
- [ ] Page loads without errors
- [ ] User list displays correctly
- [ ] Search functionality works
- [ ] Role filtering works
- [ ] Station filtering works
- [ ] Create new user profile works
- [ ] Edit user profile works
- [ ] Delete user profile works
- [ ] Batch operations work

#### Module Access Features
- [ ] Module access data loads
- [ ] Can assign module permissions
- [ ] Can view user module access
- [ ] Permission changes save correctly

#### Products Management
- [ ] Products page loads
- [ ] Can create new products
- [ ] Can edit existing products
- [ ] Can delete products
- [ ] Product search works
- [ ] Category filtering works

#### Sales Reports
- [ ] Sales reports page loads
- [ ] Can create new reports
- [ ] Date filtering works
- [ ] Report generation works
- [ ] Can view report details

#### Deliveries Tracking
- [ ] Deliveries page loads
- [ ] Can create new deliveries
- [ ] Can update delivery status
- [ ] Delivery search works
- [ ] Date filtering works

### 4. API Endpoint Tests
Verify these API calls work without errors:

- [ ] `tablePage(25712, ...)` - module_access
- [ ] `tablePage(11726, ...)` - products
- [ ] `tablePage(12356, ...)` - sales_reports
- [ ] `tablePage(12196, ...)` - deliveries
- [ ] `tablePage(11731, { Filters: [{ name: 'expiry_date', ... }] })` - licenses with expiry_date
- [ ] `tablePage(12706, { Filters: [{ name: 'event_timestamp', ... }] })` - audit_logs with event_timestamp

### 5. Performance Tests
- [ ] Page load times are acceptable
- [ ] No significant increase in database query times
- [ ] No memory leaks in UserManagement component
- [ ] Batch operations complete in reasonable time

### 6. Edge Case Tests
- [ ] Empty state displays correctly when no data
- [ ] Handles large datasets (100+ users)
- [ ] Graceful error handling for network issues
- [ ] Proper validation messages for invalid inputs

## Manual Test Scenarios

### Scenario 1: Complete User Management Flow
1. Navigate to UserManagement page
2. Create a new user with all fields
3. Edit the user's role
4. Assign module permissions
5. Delete the user
6. Verify audit log entry created

### Scenario 2: Product Management Flow
1. Navigate to Products page
2. Add a new product with all details
3. Update stock quantity
4. Change product category
5. Mark product as inactive
6. Verify changes persist

### Scenario 3: Sales Report Generation
1. Navigate to Sales Reports
2. Create a new daily report
3. Add sales data
4. Generate report summary
5. Export report (if available)
6. Verify calculations are correct

### Scenario 4: Delivery Tracking Flow
1. Navigate to Deliveries
2. Create a new delivery
3. Update delivery status to "in-transit"
4. Mark as delivered
5. Verify timeline updates
6. Check delivery history

## Rollback Test Plan

If issues are discovered:

1. [ ] Rollback script ready (`database/MIGRATION_GUIDE.md` has rollback SQL)
2. [ ] Previous version of UserManagement component available
3. [ ] Deployment rollback procedure documented
4. [ ] Database backup available before migration

## Sign-off Checklist

- [ ] All database tests pass
- [ ] All frontend tests pass
- [ ] No new errors in production logs
- [ ] Performance metrics acceptable
- [ ] User acceptance testing complete
- [ ] Documentation updated
- [ ] Team notified of changes

## Notes

- Run tests in this order: Database → Frontend → API → Manual
- Clear browser cache between test runs
- Test in multiple browsers if possible
- Monitor error logs during testing
- Document any issues found

## Test Results Log

| Test Category | Pass/Fail | Notes | Tester | Date |
|--------------|-----------|-------|---------|------|
| Database Migration | | | | |
| Frontend Tests | | | | |
| API Tests | | | | |
| Manual Tests | | | | |
| Performance | | | | |
