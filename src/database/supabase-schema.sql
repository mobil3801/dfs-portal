-- Supabase Database Schema for DFS Portal
-- This script creates all necessary tables to replace the Easysite database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types for better data integrity
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee', 'viewer');
CREATE TYPE station_status AS ENUM ('active', 'inactive', 'maintenance');
CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE sms_status AS ENUM ('pending', 'sent', 'failed', 'delivered');

-- Stations table (replaces table ID 12599)
CREATE TABLE stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
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

-- User profiles table (replaces table ID 11725)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role user_role DEFAULT 'viewer',
    permissions JSONB DEFAULT '{}',
    station_access JSONB DEFAULT '[]', -- Array of station IDs user can access
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees table (replaces table ID 11727)
CREATE TABLE employees (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table (replaces table ID 12706)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
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

-- SMS configuration table (replaces table ID 24201)
CREATE TABLE sms_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL DEFAULT 'twilio',
    api_key VARCHAR(255),
    api_secret VARCHAR(255),
    from_number VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    rate_limit INTEGER DEFAULT 100, -- messages per hour
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS history table (replaces table ID 24202)
CREATE TABLE sms_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_number VARCHAR(20) NOT NULL,
    from_number VARCHAR(20),
    message TEXT NOT NULL,
    status sms_status DEFAULT 'pending',
    provider VARCHAR(50) DEFAULT 'twilio',
    provider_id VARCHAR(255), -- External provider message ID
    cost DECIMAL(8, 4),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    station_id UUID REFERENCES stations(id),
    user_id UUID REFERENCES auth.users(id),
    campaign_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS settings table (replaces table ID 24061)
CREATE TABLE sms_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_name VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert settings table (replaces table ID 12611)
CREATE TABLE alert_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    conditions JSONB NOT NULL DEFAULT '{}',
    notification_methods JSONB DEFAULT '[]', -- ['email', 'sms', 'dashboard']
    recipients JSONB DEFAULT '[]', -- Array of user IDs or phone numbers
    station_id UUID REFERENCES stations(id),
    is_active BOOLEAN DEFAULT true,
    frequency INTEGER DEFAULT 60, -- minutes between alerts
    severity alert_severity DEFAULT 'medium',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Licenses table (replaces table ID 11731)
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_number VARCHAR(100) UNIQUE NOT NULL,
    license_type VARCHAR(100) NOT NULL,
    station_id UUID REFERENCES stations(id),
    issued_date DATE,
    expiration_date DATE,
    issuing_authority VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    renewal_cost DECIMAL(10, 2),
    notes TEXT,
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS contacts table (replaces table ID 12612)
CREATE TABLE sms_contacts (
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

-- Alert history table (replaces table ID 12613)
CREATE TABLE alert_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_setting_id UUID REFERENCES alert_settings(id),
    station_id UUID REFERENCES stations(id),
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    severity alert_severity DEFAULT 'medium',
    triggered_by JSONB DEFAULT '{}', -- Conditions that triggered the alert
    notification_methods JSONB DEFAULT '[]',
    recipients_notified JSONB DEFAULT '[]',
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_stations_station_id ON stations(station_id);
CREATE INDEX idx_stations_status ON stations(status);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_station_id ON employees(station_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_sms_history_status ON sms_history(status);
CREATE INDEX idx_sms_history_to_number ON sms_history(to_number);
CREATE INDEX idx_sms_history_created_at ON sms_history(created_at);
CREATE INDEX idx_alert_settings_station_id ON alert_settings(station_id);
CREATE INDEX idx_alert_settings_alert_type ON alert_settings(alert_type);
CREATE INDEX idx_alert_history_station_id ON alert_history(station_id);
CREATE INDEX idx_alert_history_created_at ON alert_history(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_stations_updated_at BEFORE UPDATE ON stations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_sms_config_updated_at BEFORE UPDATE ON sms_config FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_sms_settings_updated_at BEFORE UPDATE ON sms_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_alert_settings_updated_at BEFORE UPDATE ON alert_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON licenses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_sms_contacts_updated_at BEFORE UPDATE ON sms_contacts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles (users can only see their own profile)
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for stations (based on user role and station access)
CREATE POLICY "Station access based on user permissions" ON stations FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND (role IN ('admin', 'manager') OR station_id::text = ANY(station_access))
    )
);

-- Create RLS policies for audit logs (admins can see all, users can see their own)
CREATE POLICY "Audit log access" ON audit_logs FOR SELECT 
USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Insert default SMS configuration
INSERT INTO sms_config (provider, is_active, settings) VALUES 
('twilio', false, '{"test_mode": true}');

-- Insert default SMS settings
INSERT INTO sms_settings (setting_name, setting_value, description) VALUES 
('max_daily_messages', '1000', 'Maximum SMS messages per day'),
('default_sender_name', 'DFS Portal', 'Default sender name for SMS messages'),
('enable_delivery_reports', 'true', 'Enable SMS delivery status tracking');

-- Comments for documentation
COMMENT ON TABLE stations IS 'Gas stations managed by the DFS Portal system';
COMMENT ON TABLE user_profiles IS 'User profiles with roles and permissions';
COMMENT ON TABLE employees IS 'Employee records for all gas stations';
COMMENT ON TABLE audit_logs IS 'System audit trail for security and compliance';
COMMENT ON TABLE sms_config IS 'SMS service provider configuration';
COMMENT ON TABLE sms_history IS 'History of all SMS messages sent through the system';
COMMENT ON TABLE alert_settings IS 'Configuration for automated alerts and notifications';