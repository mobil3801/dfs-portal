-- ============================================
-- DFS Portal Complete Database Schema
-- Supabase PostgreSQL Migration Script
-- ============================================

-- Enable UUID extension (if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE CREATION
-- ============================================

-- Gas Stations Table
CREATE TABLE IF NOT EXISTS gas_stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    manager_id INTEGER,
    status VARCHAR(50) DEFAULT 'active',
    fuel_capacity JSONB,
    operating_hours JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'employee',
    station_id INTEGER,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    hire_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fuel Inventory Table
CREATE TABLE IF NOT EXISTS fuel_inventory (
    id SERIAL PRIMARY KEY,
    station_id INTEGER NOT NULL,
    fuel_type VARCHAR(50) NOT NULL,
    tank_number INTEGER NOT NULL,
    current_level DECIMAL(10,2),
    capacity DECIMAL(10,2),
    reorder_level DECIMAL(10,2),
    cost_per_gallon DECIMAL(10,4),
    supplier_id INTEGER,
    last_delivery_date DATE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sales Transactions Table
CREATE TABLE IF NOT EXISTS sales_transactions (
    id SERIAL PRIMARY KEY,
    station_id INTEGER NOT NULL,
    user_id INTEGER,
    transaction_type VARCHAR(50) NOT NULL,
    fuel_type VARCHAR(50),
    quantity DECIMAL(10,3),
    price_per_unit DECIMAL(10,4),
    total_amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50),
    pump_number INTEGER,
    receipt_number VARCHAR(100),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Equipment Maintenance Table
CREATE TABLE IF NOT EXISTS equipment_maintenance (
    id SERIAL PRIMARY KEY,
    station_id INTEGER NOT NULL,
    equipment_type VARCHAR(100) NOT NULL,
    equipment_id VARCHAR(100) NOT NULL,
    maintenance_type VARCHAR(50) NOT NULL,
    description TEXT,
    technician_id INTEGER,
    scheduled_date DATE,
    completed_date DATE,
    cost DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Financial Reports Table
CREATE TABLE IF NOT EXISTS financial_reports (
    id SERIAL PRIMARY KEY,
    station_id INTEGER NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    report_period VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_sales DECIMAL(12,2),
    total_fuel_sold DECIMAL(10,2),
    total_expenses DECIMAL(12,2),
    net_profit DECIMAL(12,2),
    report_data JSONB,
    generated_by INTEGER,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    fuel_types JSONB,
    contract_terms TEXT,
    payment_terms VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fuel Orders Table
CREATE TABLE IF NOT EXISTS fuel_orders (
    id SERIAL PRIMARY KEY,
    station_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    fuel_type VARCHAR(50) NOT NULL,
    quantity_ordered DECIMAL(10,2) NOT NULL,
    quantity_received DECIMAL(10,2),
    price_per_gallon DECIMAL(10,4),
    total_cost DECIMAL(12,2),
    order_date DATE NOT NULL,
    expected_delivery DATE,
    actual_delivery DATE,
    status VARCHAR(50) DEFAULT 'pending',
    delivery_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Employee Shifts Table
CREATE TABLE IF NOT EXISTS employee_shifts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    station_id INTEGER NOT NULL,
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    scheduled_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    hourly_rate DECIMAL(8,2),
    total_pay DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    category VARCHAR(50),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_station_id ON users(station_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_fuel_inventory_station_id ON fuel_inventory(station_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_station_id ON sales_transactions(station_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_date ON sales_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_station_id ON equipment_maintenance(station_id);
CREATE INDEX IF NOT EXISTS idx_financial_reports_station_id ON financial_reports(station_id);
CREATE INDEX IF NOT EXISTS idx_fuel_orders_station_id ON fuel_orders(station_id);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_user_id ON employee_shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_station_id ON employee_shifts(station_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- ============================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================

ALTER TABLE users ADD CONSTRAINT fk_users_station FOREIGN KEY (station_id) REFERENCES gas_stations(id);
ALTER TABLE fuel_inventory ADD CONSTRAINT fk_fuel_inventory_station FOREIGN KEY (station_id) REFERENCES gas_stations(id);
ALTER TABLE fuel_inventory ADD CONSTRAINT fk_fuel_inventory_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id);
ALTER TABLE sales_transactions ADD CONSTRAINT fk_sales_transactions_station FOREIGN KEY (station_id) REFERENCES gas_stations(id);
ALTER TABLE sales_transactions ADD CONSTRAINT fk_sales_transactions_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE equipment_maintenance ADD CONSTRAINT fk_equipment_maintenance_station FOREIGN KEY (station_id) REFERENCES gas_stations(id);
ALTER TABLE equipment_maintenance ADD CONSTRAINT fk_equipment_maintenance_technician FOREIGN KEY (technician_id) REFERENCES users(id);
ALTER TABLE financial_reports ADD CONSTRAINT fk_financial_reports_station FOREIGN KEY (station_id) REFERENCES gas_stations(id);
ALTER TABLE financial_reports ADD CONSTRAINT fk_financial_reports_user FOREIGN KEY (generated_by) REFERENCES users(id);
ALTER TABLE fuel_orders ADD CONSTRAINT fk_fuel_orders_station FOREIGN KEY (station_id) REFERENCES gas_stations(id);
ALTER TABLE fuel_orders ADD CONSTRAINT fk_fuel_orders_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id);
ALTER TABLE employee_shifts ADD CONSTRAINT fk_employee_shifts_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE employee_shifts ADD CONSTRAINT fk_employee_shifts_station FOREIGN KEY (station_id) REFERENCES gas_stations(id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE gas_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Gas Stations Policies
CREATE POLICY "Users can view stations" ON gas_stations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers can modify stations" ON gas_stations FOR ALL USING (auth.role() = 'service_role' OR auth.jwt() ->> 'role' IN ('admin', 'manager'));

-- Users Policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text OR auth.role() = 'service_role');
CREATE POLICY "Admins can manage users" ON users FOR ALL USING (auth.role() = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

-- Audit Logs Policies
CREATE POLICY "Service role can access audit logs" ON audit_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Fuel Inventory Policies
CREATE POLICY "Authenticated users can view inventory" ON fuel_inventory FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers can modify inventory" ON fuel_inventory FOR ALL USING (auth.role() = 'service_role' OR auth.jwt() ->> 'role' IN ('admin', 'manager'));

-- Sales Transactions Policies
CREATE POLICY "Users can view station transactions" ON sales_transactions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Service role can manage transactions" ON sales_transactions FOR ALL USING (auth.role() = 'service_role');

-- Equipment Maintenance Policies
CREATE POLICY "Authenticated users can view maintenance" ON equipment_maintenance FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers can modify maintenance" ON equipment_maintenance FOR ALL USING (auth.role() = 'service_role' OR auth.jwt() ->> 'role' IN ('admin', 'manager'));

-- Financial Reports Policies
CREATE POLICY "Managers can access reports" ON financial_reports FOR SELECT USING (auth.role() = 'service_role' OR auth.jwt() ->> 'role' IN ('admin', 'manager'));
CREATE POLICY "Service role can manage reports" ON financial_reports FOR ALL USING (auth.role() = 'service_role');

-- Suppliers Policies
CREATE POLICY "Authenticated users can view suppliers" ON suppliers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers can modify suppliers" ON suppliers FOR ALL USING (auth.role() = 'service_role' OR auth.jwt() ->> 'role' IN ('admin', 'manager'));

-- Fuel Orders Policies
CREATE POLICY "Authenticated users can view orders" ON fuel_orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers can modify orders" ON fuel_orders FOR ALL USING (auth.role() = 'service_role' OR auth.jwt() ->> 'role' IN ('admin', 'manager'));

-- Employee Shifts Policies
CREATE POLICY "Users can view own shifts" ON employee_shifts FOR SELECT USING (auth.uid()::text = user_id::text OR auth.role() = 'service_role');
CREATE POLICY "Managers can manage shifts" ON employee_shifts FOR ALL USING (auth.role() = 'service_role' OR auth.jwt() ->> 'role' IN ('admin', 'manager'));

-- System Settings Policies
CREATE POLICY "Public settings are viewable" ON system_settings FOR SELECT USING (is_public = true OR auth.role() = 'authenticated');
CREATE POLICY "Only admins can modify settings" ON system_settings FOR ALL USING (auth.role() = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- SAMPLE DATA INSERTION
-- ============================================

-- Insert sample gas station
INSERT INTO gas_stations (name, address, phone, email, status, fuel_capacity, operating_hours) VALUES 
('Main Street Station', '123 Main Street, City, State 12345', '(555) 123-4567', 'main@station.com', 'active',
'{"regular": 10000, "premium": 5000, "diesel": 8000}',
'{"monday": "6:00-22:00", "tuesday": "6:00-22:00", "wednesday": "6:00-22:00", "thursday": "6:00-22:00", "friday": "6:00-23:00", "saturday": "7:00-23:00", "sunday": "8:00-20:00"}')
ON CONFLICT DO NOTHING;

-- Insert sample admin user
INSERT INTO users (username, email, password_hash, role, full_name, status) VALUES 
('admin', 'admin@station.com', '$2b$10$example.hash.placeholder', 'admin', 'System Administrator', 'active')
ON CONFLICT (username) DO NOTHING;

-- Insert sample system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category, is_public) VALUES 
('app_version', '1.0.0', 'string', 'Application version', 'system', true),
('maintenance_mode', 'false', 'boolean', 'Maintenance mode toggle', 'system', false)
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

-- Query to verify all tables were created
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'gas_stations', 'users', 'audit_logs', 'fuel_inventory', 
        'sales_transactions', 'equipment_maintenance', 'financial_reports', 
        'suppliers', 'fuel_orders', 'employee_shifts', 'system_settings'
    )
ORDER BY table_name;

-- Show final message
SELECT 'DFS Portal Database Migration Completed Successfully!' as message;