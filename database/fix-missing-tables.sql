-- ============================================
-- DFS Portal - Fix Missing Database Tables
-- Addresses 42P01 and 42703 PostgreSQL Errors
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fix 1: Create missing 'products' table (Error: relation "public.products" does not exist)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price DECIMAL(10,2),
    cost DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    supplier_id UUID,
    barcode VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fix 2: Create missing 'sales_reports' table (Error: relation "public.sales_reports" does not exist)
CREATE TABLE IF NOT EXISTS public.sales_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_date DATE NOT NULL,
    station_id UUID,
    total_sales DECIMAL(12,2) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    cash_sales DECIMAL(12,2) DEFAULT 0,
    card_sales DECIMAL(12,2) DEFAULT 0,
    fuel_sales DECIMAL(12,2) DEFAULT 0,
    merchandise_sales DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    profit_margin DECIMAL(5,2),
    generated_by UUID REFERENCES auth.users(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Fix 3: Create missing 'deliveries' table (Error: relation "public.deliveries" does not exist)
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_date DATE NOT NULL,
    supplier_name VARCHAR(255),
    product_name VARCHAR(255),
    quantity DECIMAL(10,2),
    unit_price DECIMAL(10,2),
    total_amount DECIMAL(12,2),
    delivery_status VARCHAR(50) DEFAULT 'Pending' CHECK (delivery_status IN ('Pending', 'In Transit', 'Delivered', 'Cancelled')),
    tracking_number VARCHAR(100),
    station_id UUID,
    received_by UUID REFERENCES auth.users(id),
    received_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Fix 4: Add missing 'expiry_date' column to licenses table (Error: column licenses.expiry_date does not exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'licenses' 
        AND column_name = 'expiry_date'
    ) THEN
        ALTER TABLE public.licenses ADD COLUMN expiry_date DATE;
    END IF;
END $$;

-- Fix 5: Add missing 'status' column to licenses table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'licenses' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.licenses ADD COLUMN status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Expired', 'Suspended', 'Cancelled'));
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at);

CREATE INDEX IF NOT EXISTS idx_sales_reports_date ON public.sales_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_sales_reports_station ON public.sales_reports(station_id);
CREATE INDEX IF NOT EXISTS idx_sales_reports_generated_at ON public.sales_reports(generated_at);

CREATE INDEX IF NOT EXISTS idx_deliveries_date ON public.deliveries(delivery_date);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(delivery_status);
CREATE INDEX IF NOT EXISTS idx_deliveries_station ON public.deliveries(station_id);

CREATE INDEX IF NOT EXISTS idx_licenses_expiry_date ON public.licenses(expiry_date);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON public.licenses(status);

-- Enable Row Level Security (RLS) on new tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for products table
CREATE POLICY "Authenticated users can view products" ON public.products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers can modify products" ON public.products FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Create RLS policies for sales_reports table
CREATE POLICY "Authenticated users can view sales reports" ON public.sales_reports FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers can modify sales reports" ON public.sales_reports FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Create RLS policies for deliveries table
CREATE POLICY "Authenticated users can view deliveries" ON public.deliveries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers can modify deliveries" ON public.deliveries FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Insert sample data to prevent empty table errors
INSERT INTO public.products (name, description, category, price, cost, stock_quantity, is_active) VALUES
('Sample Product', 'Default product for testing', 'General', 10.00, 7.50, 100, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.sales_reports (report_date, total_sales, total_transactions) VALUES
(CURRENT_DATE, 0.00, 0)
ON CONFLICT DO NOTHING;

INSERT INTO public.deliveries (delivery_date, supplier_name, product_name, quantity, delivery_status) VALUES
(CURRENT_DATE, 'Sample Supplier', 'Sample Delivery', 1, 'Delivered')
ON CONFLICT DO NOTHING;

-- Update licenses table with sample data if empty
INSERT INTO public.licenses (license_type, license_number, expiry_date, status) VALUES
('Business License', 'BL-2025-001', CURRENT_DATE + INTERVAL '1 year', 'Active')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.sales_reports TO authenticated;
GRANT ALL ON public.deliveries TO authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Database schema fixes completed successfully!';
    RAISE NOTICE 'Fixed tables: products, sales_reports, deliveries';
    RAISE NOTICE 'Fixed columns: licenses.expiry_date, licenses.status';
    RAISE NOTICE 'Added indexes and RLS policies for security';
END $$;
