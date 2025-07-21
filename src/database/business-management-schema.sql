-- ============================================
-- DFS Portal Business Management Database Schema
-- Supabase PostgreSQL Migration Script
-- Replaces gas station schema with business management tables
-- ============================================

-- Enable UUID extension and create custom functions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- DROP EXISTING GAS STATION TABLES (Clean Migration)
-- ============================================
DROP TABLE IF EXISTS employee_shifts CASCADE;
DROP TABLE IF EXISTS fuel_orders CASCADE;
DROP TABLE IF EXISTS equipment_maintenance CASCADE;
DROP TABLE IF EXISTS financial_reports CASCADE;
DROP TABLE IF EXISTS sales_transactions CASCADE;
DROP TABLE IF EXISTS fuel_inventory CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS gas_stations CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;

-- ============================================
-- BUSINESS MANAGEMENT TABLES
-- ============================================

-- User Profiles Table (ID: 11725)
-- Links to Supabase auth.users via UUID
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee', 'guest')),
    station VARCHAR(100) DEFAULT 'MOBIL',
    employee_id VARCHAR(50),
    phone VARCHAR(20),
    hire_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    detailed_permissions JSONB DEFAULT '{}',
    profile_image_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products Table (ID: 11726)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE,
    category VARCHAR(100),
    price DECIMAL(10,2),
    cost DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 0,
    supplier_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Employees Table (ID: 11727)
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    position VARCHAR(100),
    department VARCHAR(100),
    hire_date DATE,
    termination_date DATE,
    salary DECIMAL(10,2),
    hourly_rate DECIMAL(8,2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    manager_id UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Licenses Table (ID: 11731)
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    license_type VARCHAR(100) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    issuing_authority VARCHAR(255),
    issue_date DATE,
    expiry_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'revoked')),
    renewal_reminder_sent BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Deliveries Table (ID: 12196)
CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_number VARCHAR(100) UNIQUE NOT NULL,
    supplier VARCHAR(255),
    destination VARCHAR(255),
    delivery_date DATE,
    scheduled_time TIME,
    actual_delivery_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_transit', 'delivered', 'cancelled')),
    driver_name VARCHAR(255),
    driver_phone VARCHAR(20),
    items JSONB DEFAULT '[]',
    total_value DECIMAL(12,2),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sales Reports Table (ID: 12356)
CREATE TABLE sales_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_name VARCHAR(255) NOT NULL,
    report_period VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_sales DECIMAL(12,2),
    total_transactions INTEGER DEFAULT 0,
    average_transaction DECIMAL(10,2),
    top_products JSONB DEFAULT '[]',
    sales_by_category JSONB DEFAULT '{}',
    profit_margin DECIMAL(5,2),
    generated_by UUID REFERENCES auth.users(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stations Table (ID: 12599)
CREATE TABLE stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) UNIQUE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    manager_id UUID REFERENCES employees(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    operating_hours JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alert Settings Table (ID: 12611)
CREATE TABLE alert_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    alert_type VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    threshold_value DECIMAL(10,2),
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    frequency VARCHAR(20) DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'daily', 'weekly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SMS Contacts Table (ID: 12612)
CREATE TABLE sms_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    group_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alert History Table (ID: 12613)
CREATE TABLE alert_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    triggered_by UUID REFERENCES auth.users(id),
    recipients JSONB DEFAULT '[]',
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SMS Settings Table (ID: 24061)
CREATE TABLE sms_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL,
    api_key VARCHAR(255),
    sender_id VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    daily_limit INTEGER DEFAULT 1000,
    current_usage INTEGER DEFAULT 0,
    reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SMS History Table (ID: 24062, 24202)
CREATE TABLE sms_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    provider VARCHAR(50),
    cost DECIMAL(8,4),
    sent_by UUID REFERENCES auth.users(id),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SMS Config Table (ID: 24201)
CREATE TABLE sms_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Module Access Table (ID: 25712)
CREATE TABLE module_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    module_name VARCHAR(100) NOT NULL,
    permissions JSONB DEFAULT '{"read": false, "write": false, "delete": false}',
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- File Uploads Table (ID: 26928)
CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) UNIQUE NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT,
    storage_path VARCHAR(500),
    uploaded_by UUID REFERENCES auth.users(id),
    category VARCHAR(100),
    is_public BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table (Updated for UUID compatibility)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- User Profiles
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_employee_id ON user_profiles(employee_id);

-- Products
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);

-- Employees
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_manager_id ON employees(manager_id);

-- Licenses
CREATE INDEX idx_licenses_employee_id ON licenses(employee_id);
CREATE INDEX idx_licenses_expiry_date ON licenses(expiry_date);
CREATE INDEX idx_licenses_status ON licenses(status);

-- Other tables
CREATE INDEX idx_deliveries_delivery_number ON deliveries(delivery_number);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_sales_reports_period ON sales_reports(start_date, end_date);
CREATE INDEX idx_stations_code ON stations(code);
CREATE INDEX idx_alert_history_severity ON alert_history(severity);
CREATE INDEX idx_sms_history_recipient ON sms_history(recipient);
CREATE INDEX idx_module_access_user_module ON module_access(user_id, module_name);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all profiles" ON user_profiles FOR ALL USING (
    auth.role() = 'service_role' OR 
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Products Policies
CREATE POLICY "Authenticated users can view products" ON products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers can modify products" ON products FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Employees Policies
CREATE POLICY "Users can view employee directory" ON employees FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers can manage employees" ON employees FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Generic policies for other tables (admin/manager access)
CREATE POLICY "Admin access all" ON licenses FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "Admin access deliveries" ON deliveries FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "Admin access reports" ON sales_reports FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "Admin access stations" ON stations FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Alert and SMS policies (user-specific)
CREATE POLICY "Users manage own alerts" ON alert_settings FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY "Admins manage SMS" ON sms_contacts FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "View alert history" ON alert_history FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin SMS settings" ON sms_settings FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "View SMS history" ON sms_history FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin SMS config" ON sms_config FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Module access and file policies
CREATE POLICY "Users view own module access" ON module_access FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY "Admins manage module access" ON module_access FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users manage own files" ON file_uploads FOR ALL USING (auth.uid() = uploaded_by OR auth.role() = 'service_role');
CREATE POLICY "Public files viewable" ON file_uploads FOR SELECT USING (is_public = true OR auth.uid() = uploaded_by OR auth.role() = 'service_role');

CREATE POLICY "Audit logs admin only" ON audit_logs FOR SELECT USING (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Insert sample admin user profile (will be linked after user registration)
INSERT INTO user_profiles (id, user_id, role, station, employee_id, phone, is_active, detailed_permissions)
SELECT 
    uuid_generate_v4(),
    id,
    'admin',
    'MOBIL',
    'ADM001',
    '+1-555-0001',
    true,
    '{"products": {"read": true, "write": true, "delete": true}, "employees": {"read": true, "write": true, "delete": true}}'
FROM auth.users 
WHERE email = 'admin@dfsportal.com'
LIMIT 1
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample station
INSERT INTO stations (name, code, address, city, state, zip_code, phone, status) VALUES
('Main Station', 'MAIN001', '123 Main Street', 'City', 'State', '12345', '+1-555-0100', 'active')
ON CONFLICT DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, sku, category, price, cost, stock_quantity) VALUES
('Premium Gasoline', 'High-quality premium gasoline', 'FUEL-PREM-001', 'Fuel', 3.89, 3.20, 10000),
('Regular Gasoline', 'Standard regular gasoline', 'FUEL-REG-001', 'Fuel', 3.59, 2.95, 15000),
('Motor Oil 5W-30', 'Synthetic motor oil', 'OIL-5W30-001', 'Automotive', 24.99, 15.50, 200)
ON CONFLICT (sku) DO NOTHING;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

SELECT 'DFS Portal Business Management Schema Created Successfully!' as message,
       COUNT(*) as tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'user_profiles', 'products', 'employees', 'licenses', 
        'deliveries', 'sales_reports', 'stations', 'alert_settings',
        'sms_contacts', 'alert_history', 'sms_settings', 'sms_history',
        'sms_config', 'module_access', 'file_uploads', 'audit_logs'
    );