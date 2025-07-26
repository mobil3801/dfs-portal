#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('Required: VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function debugAuthIssues() {
    console.log('🔍 DFS Portal Authentication Debug Report');
    console.log('=========================================\n');

    try {
        // 1. Check Supabase connection
        console.log('1️⃣ Testing Supabase Connection...');
        const { data: connectionTest, error: connectionError } = await supabase
            .from('user_profiles')
            .select('id')
            .limit(1);
        
        if (connectionError) {
            console.error('❌ Supabase connection failed:', connectionError.message);
            return;
        }
        console.log('✅ Supabase connection successful\n');

        // 2. List all Supabase Auth users
        console.log('2️⃣ Checking Supabase Auth Users...');
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
            console.error('❌ Failed to fetch auth users:', authError.message);
        } else {
            console.log(`📊 Total Auth Users: ${authUsers.users?.length || 0}`);
            
            if (authUsers.users?.length > 0) {
                console.log('\n🔍 Auth Users Details:');
                authUsers.users.forEach((user, index) => {
                    console.log(`   ${index + 1}. Email: ${user.email}`);
                    console.log(`      ID: ${user.id}`);
                    console.log(`      Created: ${user.created_at}`);
                    console.log(`      Last Sign In: ${user.last_sign_in_at || 'Never'}`);
                    console.log(`      Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
                    console.log(`      Role: ${user.user_metadata?.role || 'Not Set'}`);
                    console.log('      ---');
                });
            } else {
                console.log('⚠️  No users found in Supabase Auth!');
            }
        }
        console.log();

        // 3. Check database users
        console.log('3️⃣ Checking Database Users...');
        const { data: dbUsers, error: dbError } = await supabase
            .from('user_profiles')
            .select('*')
            .order('created_at');
            
        if (dbError) {
            console.error('❌ Database users query failed:', dbError.message);
        } else {
            console.log(`📊 Total Database Users: ${dbUsers?.length || 0}`);
            
            if (dbUsers?.length > 0) {
                console.log('\n🔍 Database Users Details:');
                dbUsers.forEach((user, index) => {
                    console.log(`   ${index + 1}. Email: ${user.email}`);
                    console.log(`      Name: ${user.full_name}`);
                    console.log(`      Role: ${user.role}`);
                    console.log(`      Active: ${user.is_active}`);
                    console.log(`      Auth ID: ${user.user_id || 'NULL'}`);
                    console.log('      ---');
                });
            }
        }
        console.log();

        // 4. Check specific admin user
        console.log('4️⃣ Checking Admin User Specifically...');
        const adminEmail = 'admin@dfs-portal.com';
        
        // Check in auth
        const authAdmin = authUsers.users?.find(u => u.email === adminEmail);
        if (authAdmin) {
            console.log(`✅ Admin found in Supabase Auth: ${authAdmin.id}`);
            console.log(`   Email Confirmed: ${authAdmin.email_confirmed_at ? 'Yes' : 'No'}`);
            console.log(`   Role Metadata: ${JSON.stringify(authAdmin.user_metadata)}`);
        } else {
            console.log('❌ Admin NOT found in Supabase Auth');
        }
        
        // Check in database
        const { data: dbAdmin, error: dbAdminError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('email', adminEmail)
            .single();
            
        if (dbAdminError) {
            console.log('❌ Admin NOT found in database:', dbAdminError.message);
        } else {
            console.log(`✅ Admin found in database: ${dbAdmin.id}`);
            console.log(`   Auth ID Link: ${dbAdmin.auth_user_id || 'NULL'}`);
            console.log(`   Role: ${dbAdmin.role}`);
            console.log(`   Active: ${dbAdmin.is_active}`);
        }
        console.log();

        // 5. Test RPC functions
        console.log('5️⃣ Testing RPC Functions...');
        
        try {
            const { data: rpcTest, error: rpcError } = await supabase
                .rpc('get_current_user_profile');
                
            if (rpcError) {
                console.log('❌ RPC get_current_user_profile failed:', rpcError.message);
            } else {
                console.log('✅ RPC get_current_user_profile works');
            }
        } catch (error) {
            console.log('❌ RPC test failed:', error.message);
        }

        try {
            const { data: auditTest, error: auditError } = await supabase
                .rpc('log_user_action', {
                    p_user_id: '00000000-0000-0000-0000-000000000000',
                    p_action_type: 'TEST',
                    p_resource_type: 'DEBUG',
                    p_resource_id: 'test',
                    p_details: { test: true }
                });
                
            if (auditError) {
                console.log('❌ RPC log_user_action failed:', auditError.message);
            } else {
                console.log('✅ RPC log_user_action works');
            }
        } catch (error) {
            console.log('❌ Audit RPC test failed:', error.message);
        }
        console.log();

        // 6. Attempt test login
        console.log('6️⃣ Testing Login Process...');
        
        if (authAdmin) {
            console.log('Testing login with existing auth user...');
            // We can't test password directly, but we can check if user can sign in
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: adminEmail,
                password: 'DFS@Admin2024!'
            });
            
            if (signInError) {
                console.log('❌ Login test failed:', signInError.message);
                console.log('   This suggests the password is incorrect or user is disabled');
            } else {
                console.log('✅ Login test successful');
                // Sign out immediately
                await supabase.auth.signOut();
            }
        } else {
            console.log('⚠️  Cannot test login - admin not in Supabase Auth');
        }

    } catch (error) {
        console.error('💥 Debug script error:', error.message);
        console.error(error.stack);
    }
}

debugAuthIssues().then(() => {
    console.log('\n🏁 Debug complete. Check results above for issues.');
}).catch(error => {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
});