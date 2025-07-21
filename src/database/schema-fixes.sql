-- Schema fixes for DFS Portal database errors
-- This script adds missing tables and columns to resolve application errors

-- Add missing created_by column to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Fix stations table column name (code expects station_name, but schema has name)
-- We'll add station_name as an alias/view or update the column
ALTER TABLE stations ADD COLUMN IF NOT EXISTS station_name VARCHAR(255);
UPDATE stations SET station_name = name WHERE station_name IS NULL;

-- Create missing products table (table ID 11726)
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

-- Create missing sales_reports table (table ID 12356)
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
    status VARCHAR(50) DEFAULT 'draft',
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create missing deliveries table (table ID 12196)
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
    status VARCHAR(50) DEFAULT 'scheduled',
    created_by UUID REFERENCES auth.users(id),
    received_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create missing file_uploads table (table ID 26928)
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    mime_type VARCHAR(100),
    upload_purpose VARCHAR(100), -- 'employee_photo', 'document', etc.
    related_table VARCHAR(100),
    related_id UUID,
    station_id UUID REFERENCES stations(id),
    uploaded_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_station_id ON products(station_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_sales_reports_station_id ON sales_reports(station_id);
CREATE INDEX IF NOT EXISTS idx_sales_reports_report_date ON sales_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_deliveries_station_id ON deliveries(station_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_delivery_date ON deliveries(delivery_date);
CREATE INDEX IF NOT EXISTS idx_file_uploads_related ON file_uploads(related_table, related_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_station_id ON file_uploads(station_id);

-- Add updated_at triggers
CREATE TRIGGER IF NOT EXISTS update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    
CREATE TRIGGER IF NOT EXISTS update_sales_reports_updated_at 
    BEFORE UPDATE ON sales_reports 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    
CREATE TRIGGER IF NOT EXISTS update_deliveries_updated_at 
    BEFORE UPDATE ON deliveries 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    
CREATE TRIGGER IF NOT EXISTS update_file_uploads_updated_at 
    BEFORE UPDATE ON file_uploads 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS on new tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
CREATE POLICY "Station access for products" ON products FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND (role IN ('admin', 'manager') OR station_id::text = ANY(station_access))
    )
);

CREATE POLICY "Station access for sales_reports" ON sales_reports FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND (role IN ('admin', 'manager') OR station_id::text = ANY(station_access))
    )
);

CREATE POLICY "Station access for deliveries" ON deliveries FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND (role IN ('admin', 'manager') OR station_id::text = ANY(station_access))
    )
);

CREATE POLICY "Station access for file_uploads" ON file_uploads FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND (role IN ('admin', 'manager') OR station_id::text = ANY(station_access))
    )
);

-- Comments for documentation
COMMENT ON TABLE products IS 'Product inventory and catalog for gas stations';
COMMENT ON TABLE sales_reports IS 'Daily and shift-based sales reporting data';
COMMENT ON TABLE deliveries IS 'Fuel and product delivery tracking';
COMMENT ON TABLE file_uploads IS 'File upload tracking and metadata storage';
-- Create module_access table for access control (Table ID: 25712)
CREATE TABLE IF NOT EXISTS module_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    module_name VARCHAR(100) NOT NULL,
    access_level VARCHAR(50) DEFAULT 'read', -- read, write, admin
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for module_access
CREATE INDEX IF NOT EXISTS idx_module_access_user_id ON module_access(user_id);
CREATE INDEX IF NOT EXISTS idx_module_access_module_name ON module_access(module_name);
CREATE INDEX IF NOT EXISTS idx_module_access_user_module ON module_access(user_id, module_name);

-- Create updated_at trigger for module_access
CREATE TRIGGER IF NOT EXISTS update_module_access_updated_at 
    BEFORE UPDATE ON module_access 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS on module_access table
ALTER TABLE module_access ENABLE ROW LEVEL SECURITY;

-- Create policy for module_access (users can see their own access)
CREATE POLICY "module_access_policy" ON module_access
    FOR ALL USING (auth.uid() = user_id OR auth.uid() IN (
        SELECT user_id FROM module_access 
        WHERE module_name = 'admin' AND access_level = 'admin' AND is_active = true
    ));