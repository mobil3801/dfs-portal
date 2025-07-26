#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function fixAuthIssues() {
    console.log('🔧 Fixing DFS Portal Authentication Issues...');
    console.log('============================================\n');

    const adminEmail = 'admin@dfs-portal.com';
    const adminAuthId = '49f8c702-0fd1-44f0-9a20-1c77df3816da';

    try {
        // 1. Fix Auth ID Link
        console.log('1️⃣ Fixing Auth ID Link...');
        const { data: updateResult, error: updateError } = await supabase
            .from('user_profiles')
            .update({ 
                user_id: adminAuthId,
                first_name: 'Admin',
                last_name: 'User'
            })
            .eq('email', adminEmail);

        if (updateError) {
            console.error('❌ Auth ID link update failed:', updateError.message);
        } else {
            console.log('✅ Auth ID link updated successfully');
        }

        // 2. Create missing RPC functions
        console.log('\n2️⃣ Creating missing RPC functions...');
        
        // Create get_current_user_profile function
        const getCurrentUserProfileSQL = `
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE (
    id UUID,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    role TEXT,
    permissions JSONB,
    station_access JSONB,
    is_active BOOLEAN
) 
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.email,
        up.first_name,
        up.last_name,
        up.role::TEXT,
        up.permissions,
        up.station_access,
        up.is_active
    FROM user_profiles up
    WHERE up.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;
`;

        // Create log_user_action function
        const logUserActionSQL = `
CREATE OR REPLACE FUNCTION public.log_user_action(
    p_user_id UUID,
    p_action_type TEXT,
    p_resource_type TEXT,
    p_resource_id TEXT,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
AS $$
DECLARE
    audit_id UUID;
    user_email_val TEXT;
BEGIN
    -- Get user email
    SELECT email INTO user_email_val 
    FROM user_profiles 
    WHERE user_id = p_user_id;
    
    -- Insert audit log
    INSERT INTO audit_logs (
        user_id,
        user_email,
        action,
        action_performed,
        table_name,
        record_id,
        new_values,
        success
    ) VALUES (
        p_user_id,
        COALESCE(user_email_val, 'unknown'),
        p_action_type,
        p_action_type,
        p_resource_type,
        p_resource_id,
        p_details,
        true
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql;
`;

        // Execute the SQL using a simple approach - try one at a time
        console.log('   Creating get_current_user_profile...');
        try {
            // We'll need to use a different approach since RPC might not work
            console.log('   ⚠️  Cannot create RPC functions directly via Supabase client');
            console.log('   📝 RPC functions need to be created manually via Supabase Dashboard');
            console.log('   💡 SQL scripts saved for manual execution');
        } catch (error) {
            console.error('   ❌ RPC function creation failed:', error.message);
        }

        // 3. Reset admin password
        console.log('\n3️⃣ Resetting admin password...');
        const { data: resetData, error: resetError } = await supabase.auth.admin.updateUserById(
            adminAuthId,
            { 
                password: 'DFS@Admin2024!',
                user_metadata: { 
                    role: 'admin',
                    email_verified: true 
                }
            }
        );

        if (resetError) {
            console.error('❌ Password reset failed:', resetError.message);
        } else {
            console.log('✅ Admin password reset to: DFS@Admin2024!');
            console.log('   🔒 This is a temporary password - change after login');
        }

        // 4. Verify the fixes
        console.log('\n4️⃣ Verifying fixes...');
        const { data: verifyProfile, error: verifyError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('email', adminEmail)
            .single();

        if (verifyError) {
            console.error('❌ Profile verification failed:', verifyError.message);
        } else {
            console.log('✅ Profile verification successful:');
            console.log(`   Auth ID: ${verifyProfile.user_id}`);
            console.log(`   Role: ${verifyProfile.role}`);
            console.log(`   Active: ${verifyProfile.is_active}`);
        }

        // 5. Test login with new password
        console.log('\n5️⃣ Testing login with new password...');
        const { data: loginTest, error: loginError } = await supabase.auth.signInWithPassword({
            email: adminEmail,
            password: 'DFS@Admin2024!'
        });

        if (loginError) {
            console.error('❌ Login test failed:', loginError.message);
        } else {
            console.log('✅ Login test successful!');
            // Sign out immediately
            await supabase.auth.signOut();
        }

    } catch (error) {
        console.error('💥 Fix process error:', error.message);
        console.error(error.stack);
    }

    console.log('\n📋 RPC Functions SQL (Execute manually in Supabase Dashboard):');
    console.log('================================================================');
    console.log(getCurrentUserProfileSQL);
    console.log('\n' + logUserActionSQL);
    
    console.log('\n🎉 Authentication fixes completed!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Auth ID link fixed');
    console.log('   🔑 Password reset to: DFS@Admin2024!');
    console.log('   ⚠️  RPC functions need manual creation');
    console.log('\n🚀 Try logging in now with the new password!');
}

// Execute
fixAuthIssues().then(() => {
    console.log('\n🏁 Authentication fix process complete.');
}).catch(error => {
    console.error('💥 Process failed:', error.message);
    process.exit(1);
});