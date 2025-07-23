-- Migration: Add missing tables and columns to fix schema issues

-- Create audit_logs table if not exists
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(255) NOT NULL,
  event_status VARCHAR(255) NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  risk_level VARCHAR(50),
  ip_address VARCHAR(50),
  user_agent TEXT,
  session_id VARCHAR(255),
  username VARCHAR(255),
  user_id UUID,
  action_performed VARCHAR(255),
  additional_data JSONB,
  sensitive_fields_removed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create products table if not exists
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create sales_reports table if not exists
CREATE TABLE IF NOT EXISTS sales_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL,
  total_sales NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create deliveries table if not exists
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create licenses table if not exists
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key VARCHAR(255) NOT NULL,
  expiry_date TIMESTAMPTZ,
  status VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add missing columns to existing tables if needed
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS action_performed VARCHAR(255);

ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_timestamp ON audit_logs(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_sales_reports_report_date ON sales_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_deliveries_delivery_date ON deliveries(delivery_date);
CREATE INDEX IF NOT EXISTS idx_licenses_expiry_date ON licenses(expiry_date);
