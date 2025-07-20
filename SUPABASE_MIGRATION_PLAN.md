# DFS Portal Supabase Migration Plan

## Current Architecture Analysis

### Database System
- **Current**: Easysite Built-in Database
- **Target**: Supabase PostgreSQL
- **API Interface**: `window.ezsite.apis` → Supabase Client

### Key Tables Identified
| Table ID | Purpose | Service |
|----------|---------|---------|
| 12599 | Stations | StationService |
| 11725 | User Profiles | UserValidationService |
| 11727 | Employees | UserValidationService |
| 12706 | Audit Logs | AuditLogger |
| 24201 | SMS Config | ClickSendSmsService |
| 24202 | SMS History | ClickSendSmsService |
| 24061 | SMS Settings | EnhancedSmsService |
| 24062 | SMS History | EnhancedSmsService |
| 12611 | Alert Settings | LicenseAlertService |
| 11731 | Licenses | LicenseAlertService |
| 12612 | SMS Contacts | LicenseAlertService |
| 12613 | Alert History | LicenseAlertService |

### Critical Services to Migrate
1. **DatabaseConnectionManager** - Connection pooling (80 max connections)
2. **OptimizedDataService** - Caching and performance optimization
3. **StationService** - Gas station management
4. **UserValidationService** - User validation and role management
5. **AuditLogger** - Security and activity logging
6. **SMS Services** - ClickSend integration services
7. **LicenseAlertService** - License expiration monitoring

## Migration Strategy: Phase 1 (Quick Migration)

### Step 1: Install Dependencies
```bash
npm install @supabase/supabase-js
```

### Step 2: Environment Configuration
Update `.env.local`:
```env
# Remove Easysite Database references
# EASYSITE_DATABASE_URL=...

# Add Supabase Configuration
VITE_SUPABASE_URL=https://nehhjsiuhthflfwkfequ.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5laGhqc2l1aHRoZmxmd2tmZXF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTMxNzUsImV4cCI6MjA2ODU4OTE3NX0.osjykkMo-WoYdRdh6quNu2F8DQHi5dN32JwSiaT5eLc
```

### Step 3: Create Supabase Tables Schema

#### Tables to Create:
1. **stations** (replaces Table 12599)
```sql
CREATE TABLE stations (
  id SERIAL PRIMARY KEY,
  station_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  operating_hours TEXT,
  manager_name TEXT,
  status TEXT DEFAULT 'Active',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

2. **user_profiles** (replaces Table 11725)
```sql
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  role TEXT,
  station TEXT,
  is_active BOOLEAN DEFAULT true,
  permissions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

3. **employees** (replaces Table 11727)
```sql
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  position TEXT,
  station TEXT,
  hire_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

4. **audit_logs** (replaces Table 12706)
```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id INTEGER,
  username TEXT,
  ip_address TEXT,
  user_agent TEXT,
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  event_status TEXT,
  resource_accessed TEXT,
  action_performed TEXT,
  failure_reason TEXT,
  session_id TEXT,
  risk_level TEXT,
  additional_data JSONB,
  station TEXT,
  geo_location TEXT
);
```

5. **sms_config** (replaces Table 24201)
```sql
CREATE TABLE sms_config (
  id SERIAL PRIMARY KEY,
  provider TEXT DEFAULT 'ClickSend',
  api_username TEXT,
  api_key TEXT,
  from_number TEXT,
  is_enabled BOOLEAN DEFAULT true,
  test_mode BOOLEAN DEFAULT false,
  daily_limit INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

6. **sms_history** (replaces Tables 24202, 24062)
```sql
CREATE TABLE sms_history (
  id SERIAL PRIMARY KEY,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  cost DECIMAL(10,4),
  message_id TEXT,
  sent_by_user_id INTEGER,
  station TEXT,
  campaign_id TEXT,
  provider TEXT DEFAULT 'ClickSend'
);
```

### Step 4: Create Supabase Service Adapter

Create `src/services/supabase/supabaseAdapter.ts` that mimics the `window.ezsite.apis` interface:

```typescript
interface EzsiteApiAdapter {
  tablePage(tableId: string | number, params: any): Promise<{data: any, error: string | null}>;
  tableCreate(tableId: string | number, data: any): Promise<{error: string | null}>;
  tableUpdate(tableId: string | number, data: any): Promise<{error: string | null}>;
  tableDelete(tableId: string | number, data: any): Promise<{error: string | null}>;
  sendEmail?(emailData: any): Promise<{error: string | null}>;
}
```

#### Table ID Mapping:
```typescript
const TABLE_ID_MAPPING = {
  12599: 'stations',
  11725: 'user_profiles', 
  11727: 'employees',
  12706: 'audit_logs',
  24201: 'sms_config',
  24202: 'sms_history',
  24062: 'sms_history',
  24061: 'sms_settings',
  12611: 'alert_settings',
  11731: 'licenses',
  12612: 'sms_contacts',
  12613: 'alert_history',
  'User': 'auth.users' // Built-in users table
};
```

### Step 5: Replace Database Calls

Replace the global `window.ezsite.apis` with our Supabase adapter while maintaining the same interface.

## Data Migration Plan

### Data Export Requirements
Need backup files for:
1. **Stations** (Table 12599) - Station information, managers, addresses
2. **User Profiles** (Table 11725) - User roles, permissions, station assignments  
3. **Employees** (Table 11727) - Employee records, contact information
4. **Audit Logs** (Table 12706) - Historical security logs
5. **SMS Configuration** (Tables 24201, 24202, 24062) - SMS settings and history
6. **License Data** (Tables 11731, 12611-12613) - License information and alerts
7. **Built-in Users** ('User' table) - Authentication data

### Migration Scripts
Create `src/scripts/migrate-data.ts` to:
1. Parse backup files (JSON/CSV format)
2. Transform data to match new schema
3. Insert data into Supabase tables
4. Validate data integrity
5. Generate migration report

## Testing Strategy

### Phase 1: Technical Migration
1. **Service Layer Testing** - Ensure all services work with Supabase adapter
2. **Connection Testing** - Verify database connectivity and credentials
3. **CRUD Operations** - Test create, read, update, delete operations
4. **Error Handling** - Ensure proper error handling and fallbacks

### Phase 2: Data Migration Testing  
1. **Data Integrity** - Verify all records migrated correctly
2. **Relationship Validation** - Check foreign key relationships
3. **Performance Testing** - Compare response times with original system
4. **User Flow Testing** - Test critical user workflows end-to-end

## Implementation Checklist

### Technical Setup
- [ ] Install @supabase/supabase-js dependency
- [ ] Update environment configuration with Supabase credentials
- [ ] Create Supabase database tables with proper schema
- [ ] Implement Supabase service adapter layer
- [ ] Create table ID mapping system

### Service Migration  
- [ ] Replace DatabaseConnectionManager with Supabase client
- [ ] Update OptimizedDataService for Supabase operations
- [ ] Migrate StationService to use Supabase adapter
- [ ] Migrate UserValidationService to use Supabase adapter  
- [ ] Migrate AuditLogger to use Supabase adapter
- [ ] Update all SMS services for Supabase integration
- [ ] Migrate LicenseAlertService to Supabase

### Data Migration
- [ ] Receive backup files from user
- [ ] Create data transformation scripts  
- [ ] Test migration scripts on sample data
- [ ] Perform full data migration
- [ ] Validate data integrity and completeness

### Testing & Validation
- [ ] Test all CRUD operations through services
- [ ] Verify user authentication and authorization
- [ ] Test SMS functionality and history tracking
- [ ] Validate audit logging functionality
- [ ] Test station management features
- [ ] Perform end-to-end user workflow testing

### Cleanup
- [ ] Remove Easysite database references
- [ ] Update documentation and comments
- [ ] Remove unused connection pooling code (Phase 2)
- [ ] Remove custom caching layer (Phase 2)

## Risk Mitigation

### Data Loss Prevention
- Create complete backup before migration
- Test migration scripts thoroughly
- Implement rollback procedures
- Validate data integrity at each step

### Service Continuity
- Maintain existing API interface during migration
- Implement graceful error handling and fallbacks
- Monitor performance during transition
- Keep old system accessible during testing phase

### Security Considerations
- Secure Supabase credentials in environment variables
- Implement proper Row Level Security (RLS) policies
- Maintain audit logging throughout migration
- Validate user permissions and access control

## Phase 2: Future Optimizations (Post-Migration)

### Leverage Supabase Features
- Replace custom connection pooling with Supabase connection management
- Implement real-time subscriptions for live updates
- Use Supabase's built-in caching and performance features  
- Implement Supabase Auth for user management
- Add Row Level Security policies for data protection

### Performance Enhancements
- Optimize database queries and indexes
- Implement Supabase Edge Functions for complex operations
- Use Supabase Storage for file management
- Implement Supabase Realtime for live notifications

This migration plan prioritizes getting the system working quickly with minimal disruption, then optimizing in a second phase.