-- Fix Production Schema Issues
-- This migration adds missing tables and columns that are causing errors in production

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- FIX 1: Add missing columns to existing tables
-- =====================================================

-- Add expiry_date column to licenses table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'licenses' 
        AND column_name = 'expiry_date'
    ) THEN
        ALTER TABLE public.licenses ADD COLUMN expiry_date DATE;
        COMMENT ON COLUMN public.licenses.expiry_date IS 'License expiration date';
    END IF;
END $$;

-- Add event_timestamp column to audit_logs table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs' 
        AND column_name = 'event_timestamp'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        COMMENT ON COLUMN public.audit_logs.event_timestamp IS 'Timestamp when the event occurred';
        
        -- Create index for better query performance
        CREATE INDEX IF NOT EXISTS idx_audit_logs_event_timestamp ON public.audit_logs(event_timestamp);
    END IF;
END $$;

-- =====================================================
-- FIX 2: Create missing tables
-- =====================================================

-- Create module_access table (Table ID: 25712)
CREATE TABLE IF NOT EXISTS public.module_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    access_level VARCHAR(50) DEFAULT 'read',
    permissions JSONB DEFAULT '{}',
    create_enabled BOOLEAN DEFAULT false,
    edit_enabled BOOLEAN DEFAULT false,
    delete_enabled BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, module_name)
);

-- Create indexes for module_access
CREATE INDEX IF NOT EXISTS idx_module_access_user_id ON public.module_access(user_id);
CREATE INDEX IF NOT EXISTS idx_module_access_module_name ON public.module_access(module_name);
CREATE INDEX IF NOT EXISTS idx_module_access_user_module ON public.module_access(user_id, module_name);

-- Create products table (Table ID: 11726)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100),
    barcode VARCHAR(100),
    category VARCHAR(100),
    category_id UUID,
    price DECIMAL(10,2) DEFAULT 0,
    cost DECIMAL(10,2) DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER DEFAULT 1000,
    unit_of_measure VARCHAR(50) DEFAULT 'unit',
    weight DECIMAL(10,3),
    station_id UUID,
    supplier_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for products
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_station_id ON public.products(station_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- Create sales_reports table (Table ID: 12356)
CREATE TABLE IF NOT EXISTS public.sales_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_date DATE NOT NULL,
    station_id UUID NOT NULL,
    shift_number INTEGER,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    total_sales DECIMAL(12,2) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    average_transaction DECIMAL(10,2) DEFAULT 0,
    fuel_sales DECIMAL(12,2) DEFAULT 0,
    store_sales DECIMAL(12,2) DEFAULT 0,
    tax_collected DECIMAL(10,2) DEFAULT 0,
    discounts_given DECIMAL(10,2) DEFAULT 0,
    payment_methods JSONB DEFAULT '{}',
    top_products JSONB DEFAULT '[]',
    sales_by_category JSONB DEFAULT '{}',
    employee_id UUID,
    status VARCHAR(50) DEFAULT 'draft',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for sales_reports
CREATE INDEX IF NOT EXISTS idx_sales_reports_station_id ON public.sales_reports(station_id);
CREATE INDEX IF NOT EXISTS idx_sales_reports_report_date ON public.sales_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_sales_reports_period ON public.sales_reports(start_date, end_date);

-- Create deliveries table (Table ID: 12196)
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_number VARCHAR(100) UNIQUE,
    station_id UUID NOT NULL,
    supplier_id UUID,
    delivery_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expected_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending',
    delivery_type VARCHAR(50) DEFAULT 'fuel',
    items JSONB DEFAULT '[]',
    total_amount DECIMAL(12,2) DEFAULT 0,
    invoice_number VARCHAR(100),
    driver_name VARCHAR(255),
    vehicle_number VARCHAR(100),
    notes TEXT,
    received_by UUID,
    verified_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for deliveries
CREATE INDEX IF NOT EXISTS idx_deliveries_station_id ON public.deliveries(station_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_delivery_date ON public.deliveries(delivery_date);
CREATE INDEX IF NOT EXISTS idx_deliveries_delivery_number ON public.deliveries(delivery_number);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);

-- =====================================================
-- FIX 3: Create update triggers for new tables
-- =====================================================

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_module_access_updated_at 
    BEFORE UPDATE ON public.module_access 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON public.products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_reports_updated_at 
    BEFORE UPDATE ON public.sales_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at 
    BEFORE UPDATE ON public.deliveries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FIX 4: Enable Row Level Security (RLS)
-- =====================================================

ALTER TABLE public.module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FIX 5: Create RLS Policies
-- =====================================================

-- Module Access Policies
CREATE POLICY "Users can view their own module access" 
    ON public.module_access FOR SELECT 
    USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Service role can manage module access" 
    ON public.module_access FOR ALL 
    USING (auth.role() = 'service_role');

-- Products Policies
CREATE POLICY "Authenticated users can view products" 
    ON public.products FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage products" 
    ON public.products FOR ALL 
    USING (auth.role() = 'service_role');

-- Sales Reports Policies
CREATE POLICY "Authenticated users can view sales reports" 
    ON public.sales_reports FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage sales reports" 
    ON public.sales_reports FOR ALL 
    USING (auth.role() = 'service_role');

-- Deliveries Policies
CREATE POLICY "Authenticated users can view deliveries" 
    ON public.deliveries FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage deliveries" 
    ON public.deliveries FOR ALL 
    USING (auth.role() = 'service_role');

-- =====================================================
-- FIX 6: Add table comments
-- =====================================================

COMMENT ON TABLE public.module_access IS 'User module access control and permissions';
COMMENT ON TABLE public.products IS 'Product inventory and catalog for gas stations';
COMMENT ON TABLE public.sales_reports IS 'Daily and shift-based sales reporting data';
COMMENT ON TABLE public.deliveries IS 'Fuel and product delivery tracking';

-- =====================================================
-- FIX 7: Grant permissions
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant permissions on tables
GRANT SELECT ON public.module_access TO authenticated;
GRANT ALL ON public.module_access TO service_role;

GRANT SELECT ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

GRANT SELECT ON public.sales_reports TO authenticated;
GRANT ALL ON public.sales_reports TO service_role;

GRANT SELECT ON public.deliveries TO authenticated;
GRANT ALL ON public.deliveries TO service_role;

-- Grant permissions on sequences (for auto-generated IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =====================================================
-- Verification queries (commented out, run manually to verify)
-- =====================================================

-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('module_access', 'products', 'sales_reports', 'deliveries');
-- SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'licenses' AND column_name = 'expiry_date';
-- SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'event_timestamp';
