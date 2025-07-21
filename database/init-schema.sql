-- ============================================
-- DFS Portal Unified Database Schema
-- Supabase PostgreSQL - Authoritative Version
-- This schema resolves conflicts between multiple schema files
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types for better data integrity
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee', 'viewer');
CREATE TYPE station_status AS ENUM ('active', 'inactive', 'maintenance');
CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE sms_status AS ENUM ('pending', 'sent', 'failed', 'delivered');
CREATE TYPE delivery_status AS ENUM ('scheduled', 'in_transit', 'delivered', 'cancelled');
CREATE TYPE report_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');

-- ============================================
-- CORE TABLES
-- ============================================

-- Stations table (Table ID: 12599)
CREATE TABLE IF NOT EXISTS stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    station_name VARCHAR(255), -- Alias for compatibility
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    status station_status DEFAULT 'active',
    manager_id UUID,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    fuel_types JSONB DEFAULT '[]',
    pump_count INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table (Table ID: 11725)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role user_role DEFAULT 'viewer',
    permissions JSONB DEFAULT '{}',
    station_access JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees table (Table ID: 11727)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    position VARCHAR(100),
    department VARCHAR(100),
    station_id UUID REFERENCES stations(id),
    hire_date DATE,
    termination_date DATE,
    salary DECIMAL(10, 2),
    hourly_rate DECIMAL(8, 2),
    is_active BOOLEAN DEFAULT true,
    emergency_contact JSONB DEFAULT '{}',
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table (Table ID: 11726)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    barcode VARCHAR(100),
    price DECIMAL(10, 2),
    cost DECIMAL(10, 2),
    category_id UUID,
    brand_id UUID,
    unit VARCHAR(50),
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    station_id UUID REFERENCES stations(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales reports table (Table ID: 12356)
CREATE TABLE IF NOT EXISTS sales_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id VARCHAR(50) UNIQUE,
    station_id UUID REFERENCES stations(id),
    report_date DATE NOT NULL,
    shift VARCHAR(50),
    total_sales DECIMAL(12, 2),
    fuel_sales DECIMAL(12, 2),
    non_fuel_sales DECIMAL(12, 2),
    cash_sales DECIMAL(12, 2),
    card_sales DECIMAL(12, 2),
    fuel_volume DECIMAL(10, 2),
    transaction_count INTEGER DEFAULT 0,
    report_data JSONB,
    status report_status DEFAULT 'draft',
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deliveries table (Table ID: 12196)
CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id VARCHAR(50) UNIQUE,
    station_id UUID REFERENCES stations(id),
    supplier_id UUID,
    delivery_date DATE NOT NULL,
    expected_time TIME,
    actual_time TIME,
    fuel_type VARCHAR(50),
    quantity_ordered DECIMAL(10, 2),
    quantity_delivered DECIMAL(10, 2),
    price_per_gallon DECIMAL(10, 4),
    total_cost DECIMAL(12, 2),
    driver_name VARCHAR(255),
    truck_number VARCHAR(100),
    delivery_notes TEXT,
    status delivery_status DEFAULT 'scheduled',
    created_by UUID REFERENCES auth.users(id),
    received_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File uploads table (Table ID: 26928)
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    mime_type VARCHAR(100),
    upload_purpose VARCHAR(100),
    related_table VARCHAR(100),
    related_id UUID,
    station_id UUID REFERENCES stations(id),
    uploaded_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SUPPORTING TABLES
-- ============================================

-- Audit logs table (Table ID: 12706)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    action_performed VARCHAR(255),
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    table_name VARCHAR(100),
    record_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    severity alert_severity DEFAULT 'low',
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Licenses table (Table ID: 11731)
CREATE TABLE IF NOT EXISTS licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_number VARCHAR(100) UNIQUE NOT NULL,
    license_type VARCHAR(100) NOT NULL,
    station_id UUID REFERENCES stations(id),
    issued_date DATE,
    expiration_date DATE,
    expiry_date DATE,
    issuing_authority VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    renewal_cost DECIMAL(10, 2),
    notes TEXT,
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert settings table (Table ID: 12611)
CREATE TABLE IF NOT EXISTS alert_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    conditions JSONB NOT NULL DEFAULT '{}',
    notification_methods JSONB DEFAULT '[]',
    recipients JSONB DEFAULT '[]',
    station_id UUID REFERENCES stations(id),
    is_active BOOLEAN DEFAULT true,
    frequency INTEGER DEFAULT 60,
    severity alert_severity DEFAULT 'medium',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert history table (Table ID: 12613)
CREATE TABLE IF NOT EXISTS alert_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_setting_id UUID REFERENCES alert_settings(id),
    station_id UUID REFERENCES stations(id),
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    severity alert_severity DEFAULT 'medium',
    triggered_by JSONB DEFAULT '{}',
    notification_methods JSONB DEFAULT '[]',
    recipients_notified JSONB DEFAULT '[]',
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS contacts table (Table ID: 12612)
CREATE TABLE IF NOT EXISTS sms_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    group_name VARCHAR(100),
    station_id UUID REFERENCES stations(id),
    is_active BOOLEAN DEFAULT true,
    opt_out BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS settings table (Table ID: 24061)
CREATE TABLE IF NOT EXISTS sms_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_name VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS configuration table (Table ID: 24201)
CREATE TABLE IF NOT EXISTS sms_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL DEFAULT 'twilio',
    api_key VARCHAR(255),
    api_secret VARCHAR(255),
    from_number VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    rate_limit INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS history table (Table ID: 24202)
CREATE TABLE IF NOT EXISTS sms_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_number VARCHAR(20) NOT NULL,
    from_number VARCHAR(20),
    message TEXT NOT NULL,
    status sms_status DEFAULT 'pending',
    provider VARCHAR(50) DEFAULT 'twilio',
    provider_id VARCHAR(255),
    cost DECIMAL(8, 4),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    station_id UUID REFERENCES stations(id),
    user_id UUID REFERENCES auth.users(id),
    campaign_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Module access table (Table ID: 25712)
CREATE TABLE IF NOT EXISTS module_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    module_name VARCHAR(100) NOT NULL,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_stations_station_id ON stations(station_id);
CREATE INDEX IF NOT EXISTS idx_stations_status ON stations(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_station_id ON employees(station_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_station_id ON products(station_id);
CREATE INDEX IF NOT EXISTS idx_sales_reports_station_id ON sales_reports(station_id);
CREATE INDEX IF NOT EXISTS idx_sales_reports_report_date ON sales_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_deliveries_station_id ON deliveries(station_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_delivery_date ON deliveries(delivery_date);
CREATE INDEX IF NOT EXISTS idx_file_uploads_related ON file_uploads(related_table, related_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_station_id ON file_uploads(station_id);

-- Supporting table indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_alert_settings_station_id ON alert_settings(station_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_station_id ON alert_history(station_id);
CREATE INDEX IF NOT EXISTS idx_sms_history_status ON sms_history(status);
CREATE INDEX IF NOT EXISTS idx_sms_history_to_number ON sms_history(to_number);

-- ============================================
-- TRIGGERS AND FUNCTIONS
-- ============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER IF NOT EXISTS update_stations_updated_at BEFORE UPDATE ON stations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_sales_reports_updated_at BEFORE UPDATE ON sales_reports FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_deliveries_updated_at BEFORE UPDATE ON deliveries FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_file_uploads_updated_at BEFORE UPDATE ON file_uploads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_licenses_updated_at BEFORE UPDATE ON licenses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_alert_settings_updated_at BEFORE UPDATE ON alert_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_sms_contacts_updated_at BEFORE UPDATE ON sms_contacts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_sms_settings_updated_at BEFORE UPDATE ON sms_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_sms_config_updated_at BEFORE UPDATE ON sms_config FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_module_access_updated_at BEFORE UPDATE ON module_access FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Sync station_name with name
CREATE OR REPLACE FUNCTION sync_station_name()
RETURNS TRIGGER AS $$
BEGIN
    NEW.station_name = NEW.name;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS sync_stations_name BEFORE INSERT OR UPDATE ON stations FOR EACH ROW EXECUTE PROCEDURE sync_station_name();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_access ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies
CREATE POLICY IF NOT EXISTS "Station access based on user permissions" ON stations FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND (role IN ('admin', 'manager') OR id::text = ANY(station_access))
    )
);

CREATE POLICY IF NOT EXISTS "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Apply station-based access to all related tables
CREATE POLICY IF NOT EXISTS "Station access for products" ON products FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND (role IN ('admin', 'manager') OR station_id::text = ANY(station_access))
    )
);

CREATE POLICY IF NOT EXISTS "Station access for sales_reports" ON sales_reports FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND (role IN ('admin', 'manager') OR station_id::text = ANY(station_access))
    )
);

CREATE POLICY IF NOT EXISTS "Station access for deliveries" ON deliveries FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND (role IN ('admin', 'manager') OR station_id::text = ANY(station_access))
    )
);

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default configurations
INSERT INTO sms_config (provider, is_active, settings) VALUES 
('twilio', false, '{"test_mode": true}')
ON CONFLICT DO NOTHING;

INSERT INTO sms_settings (setting_name, setting_value, description) VALUES 
('max_daily_messages', '1000', 'Maximum SMS messages per day'),
('default_sender_name', 'DFS Portal', 'Default sender name for SMS messages'),
('enable_delivery_reports', 'true', 'Enable SMS delivery status tracking')
ON CONFLICT (setting_name) DO NOTHING;