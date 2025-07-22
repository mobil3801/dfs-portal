#!/usr/bin/env node

/**
 * Test new Supabase connection
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nehhjsiuhthflfwkfequ.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5laGhqc2l1aHRoZmxmd2tmZXF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAxMzE3NSwiZXhwIjoyMDY4NTg5MTc1fQ.7naT6l_oNH8VI5MaEKgJ19PoYw1EErv6-ftkEin12wE';

async function testConnection() {
    console.log('Testing Supabase connection...');
    
    try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Test connection by listing tables
        const { data, error } = await supabase
            .from('stations')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('Connection test failed:', error.message);
        } else {
            console.log('✅ Connection successful!');
            console.log('Sample data:', data);
        }
    } catch (error) {
        console.error('Connection error:', error.message);
    }
}

testConnection();
