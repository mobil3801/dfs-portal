-- Automated Migration Verification Script
-- Run this after applying fix-production-schema.sql to verify all changes

-- =====================================================
-- TEST 1: Verify all tables exist
-- =====================================================
DO $$
DECLARE
    missing_tables TEXT[];
    required_tables TEXT[] := ARRAY['module_access', 'products', 'sales_reports', 'deliveries'];
    table_name TEXT;
BEGIN
    -- Check for missing tables
    SELECT ARRAY_AGG(t.table_name)
    INTO missing_tables
    FROM UNNEST(required_tables) AS t(table_name)
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND information_schema.tables.table_name = t.table_name
    );
    
    IF missing_tables IS NOT NULL THEN
        RAISE EXCEPTION 'FAILED: Missing tables: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE 'PASSED: All required tables exist';
    END IF;
END $$;

-- =====================================================
-- TEST 2: Verify column additions
-- =====================================================
DO $$
BEGIN
    -- Check licenses.expiry_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'licenses' 
        AND column_name = 'expiry_date'
    ) THEN
        RAISE EXCEPTION 'FAILED: Column licenses.expiry_date does not exist';
    ELSE
        RAISE NOTICE 'PASSED: Column licenses.expiry_date exists';
    END IF;
    
    -- Check audit_logs.event_timestamp
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs' 
        AND column_name = 'event_timestamp'
    ) THEN
        RAISE EXCEPTION 'FAILED: Column audit_logs.event_timestamp does not exist';
    ELSE
        RAISE NOTICE 'PASSED: Column audit_logs.event_timestamp exists';
    END IF;
END $$;

-- =====================================================
-- TEST 3: Verify table structures
-- =====================================================
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    -- Check module_access columns
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'module_access';
    
    IF col_count < 11 THEN
        RAISE EXCEPTION 'FAILED: module_access table has % columns, expected at least 11', col_count;
    ELSE
        RAISE NOTICE 'PASSED: module_access table structure verified (% columns)', col_count;
    END IF;
    
    -- Check products columns
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'products';
    
    IF col_count < 18 THEN
        RAISE EXCEPTION 'FAILED: products table has % columns, expected at least 18', col_count;
    ELSE
        RAISE NOTICE 'PASSED: products table structure verified (% columns)', col_count;
    END IF;
    
    -- Check sales_reports columns
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sales_reports';
    
    IF col_count < 19 THEN
        RAISE EXCEPTION 'FAILED: sales_reports table has % columns, expected at least 19', col_count;
    ELSE
        RAISE NOTICE 'PASSED: sales_reports table structure verified (% columns)', col_count;
    END IF;
    
    -- Check deliveries columns
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'deliveries';
    
    IF col_count < 16 THEN
        RAISE EXCEPTION 'FAILED: deliveries table has % columns, expected at least 16', col_count;
    ELSE
        RAISE NOTICE 'PASSED: deliveries table structure verified (% columns)', col_count;
    END IF;
END $$;

-- =====================================================
-- TEST 4: Verify indexes exist
-- =====================================================
DO $$
DECLARE
    missing_indexes TEXT[];
    required_indexes TEXT[] := ARRAY[
        'idx_module_access_user_id',
        'idx_module_access_module_name',
        'idx_module_access_user_module',
        'idx_products_barcode',
        'idx_products_station_id',
        'idx_sales_reports_station_id',
        'idx_sales_reports_report_date',
        'idx_deliveries_station_id',
        'idx_deliveries_delivery_date',
        'idx_audit_logs_event_timestamp'
    ];
BEGIN
    SELECT ARRAY_AGG(idx.index_name)
    INTO missing_indexes
    FROM UNNEST(required_indexes) AS idx(index_name)
    WHERE NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname = idx.index_name
    );
    
    IF missing_indexes IS NOT NULL THEN
        RAISE WARNING 'Missing indexes (non-critical): %', array_to_string(missing_indexes, ', ');
    ELSE
        RAISE NOTICE 'PASSED: All indexes exist';
    END IF;
END $$;

-- =====================================================
-- TEST 5: Verify RLS is enabled
-- =====================================================
DO $$
DECLARE
    tables_without_rls TEXT[];
BEGIN
    SELECT ARRAY_AGG(tablename)
    INTO tables_without_rls
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('module_access', 'products', 'sales_reports', 'deliveries')
    AND NOT rowsecurity;
    
    IF tables_without_rls IS NOT NULL THEN
        RAISE EXCEPTION 'FAILED: RLS not enabled on tables: %', array_to_string(tables_without_rls, ', ');
    ELSE
        RAISE NOTICE 'PASSED: RLS enabled on all new tables';
    END IF;
END $$;

-- =====================================================
-- TEST 6: Verify triggers exist
-- =====================================================
DO $$
DECLARE
    missing_triggers TEXT[];
    required_triggers TEXT[] := ARRAY[
        'update_module_access_updated_at',
        'update_products_updated_at',
        'update_sales_reports_updated_at',
        'update_deliveries_updated_at'
    ];
BEGIN
    SELECT ARRAY_AGG(trg.trigger_name)
    INTO missing_triggers
    FROM UNNEST(required_triggers) AS trg(trigger_name)
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_schema = 'public' 
        AND trigger_name = trg.trigger_name
    );
    
    IF missing_triggers IS NOT NULL THEN
        RAISE WARNING 'Missing triggers (non-critical): %', array_to_string(missing_triggers, ', ');
    ELSE
        RAISE NOTICE 'PASSED: All triggers exist';
    END IF;
END $$;

-- =====================================================
-- TEST 7: Test basic operations (INSERT/SELECT)
-- =====================================================
DO $$
DECLARE
    test_id UUID;
BEGIN
    -- Test module_access
    BEGIN
        INSERT INTO module_access (user_id, module_name, access_level) 
        VALUES (gen_random_uuid(), 'test_module', 'read')
        RETURNING id INTO test_id;
        
        DELETE FROM module_access WHERE id = test_id;
        RAISE NOTICE 'PASSED: module_access table operations work';
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'FAILED: module_access operations - %', SQLERRM;
    END;
    
    -- Test products
    BEGIN
        INSERT INTO products (product_name, price, stock_quantity) 
        VALUES ('Test Product', 9.99, 100)
        RETURNING id INTO test_id;
        
        DELETE FROM products WHERE id = test_id;
        RAISE NOTICE 'PASSED: products table operations work';
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'FAILED: products operations - %', SQLERRM;
    END;
    
    -- Test sales_reports
    BEGIN
        INSERT INTO sales_reports (report_date, station_id, total_sales) 
        VALUES (CURRENT_DATE, gen_random_uuid(), 1000.00)
        RETURNING id INTO test_id;
        
        DELETE FROM sales_reports WHERE id = test_id;
        RAISE NOTICE 'PASSED: sales_reports table operations work';
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'FAILED: sales_reports operations - %', SQLERRM;
    END;
    
    -- Test deliveries
    BEGIN
        INSERT INTO deliveries (delivery_number, station_id, status) 
        VALUES ('TEST-001', gen_random_uuid(), 'pending')
        RETURNING id INTO test_id;
        
        DELETE FROM deliveries WHERE id = test_id;
        RAISE NOTICE 'PASSED: deliveries table operations work';
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'FAILED: deliveries operations - %', SQLERRM;
    END;
END $$;

-- =====================================================
-- TEST 8: Verify column data types
-- =====================================================
DO $$
DECLARE
    actual_type TEXT;
BEGIN
    -- Check licenses.expiry_date type
    SELECT data_type INTO actual_type
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'licenses' 
    AND column_name = 'expiry_date';
    
    IF actual_type != 'date' THEN
        RAISE EXCEPTION 'FAILED: licenses.expiry_date has wrong type: %, expected date', actual_type;
    ELSE
        RAISE NOTICE 'PASSED: licenses.expiry_date has correct data type';
    END IF;
    
    -- Check audit_logs.event_timestamp type
    SELECT data_type INTO actual_type
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_logs' 
    AND column_name = 'event_timestamp';
    
    IF actual_type != 'timestamp with time zone' THEN
        RAISE EXCEPTION 'FAILED: audit_logs.event_timestamp has wrong type: %, expected timestamp with time zone', actual_type;
    ELSE
        RAISE NOTICE 'PASSED: audit_logs.event_timestamp has correct data type';
    END IF;
END $$;

-- =====================================================
-- SUMMARY
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRATION VERIFICATION COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'If you see this message, all critical tests passed!';
    RAISE NOTICE 'Check for any WARNING messages above for non-critical issues.';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Deploy the updated UserManagement component';
    RAISE NOTICE '2. Clear browser cache and test the application';
    RAISE NOTICE '3. Run the frontend test script to verify UI functionality';
END $$;
