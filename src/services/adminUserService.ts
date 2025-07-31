import { createClient } from '@supabase/supabase-js'

// Create a separate Supabase client with service role key for admin operations
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing VITE_SUPABASE_SERVICE_ROLE_KEY environment variable')
}

// Admin client with service role privileges
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export interface AdminCreateUserData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  role: string
  station: string
  employee_id: string
  hire_date: string
}

export interface AdminCreateUserResult {
  success: boolean
  error?: string
  userId?: string
}

/**
 * Admin service for creating users without signup restrictions
 * This service uses the service role key to bypass Supabase signup restrictions
 */
export class AdminUserService {
  
  /**
   * Create a new user account as admin (bypasses signup restrictions)
   * @param userData User data for account creation
   * @returns Promise with creation result
   */
  async createUser(userData: AdminCreateUserData): Promise<AdminCreateUserResult> {
    try {
      console.log('AdminUserService: Starting user creation process...')
      
      // Step 1: Create user in Supabase Auth using admin client
      console.log('AdminUserService: Creating auth user with email:', userData.email)
      
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Auto-confirm email to skip verification
        user_metadata: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          full_name: `${userData.firstName} ${userData.lastName}`
        }
      })

      if (authError) {
        console.error('AdminUserService: Auth user creation failed:', authError)
        return {
          success: false,
          error: `Failed to create user account: ${authError.message}`
        }
      }

      if (!authUser.user) {
        console.error('AdminUserService: No user returned from auth creation')
        return {
          success: false,
          error: 'Failed to create user account: No user data returned'
        }
      }

      console.log('AdminUserService: Auth user created successfully with ID:', authUser.user.id)

      // Step 2: Create user profile in the database
      const profileData = {
        user_id: authUser.user.id, // Use the actual UUID from Supabase Auth
        role: userData.role,
        station: userData.station,
        employee_id: userData.employee_id,
        phone: userData.phone,
        hire_date: userData.hire_date,
        is_active: true,
        created_at: new Date().toISOString(),
        detailed_permissions: JSON.stringify({
          dashboard: { view: true, create: false, edit: false, delete: false },
          products: { view: userData.role !== 'Employee', create: false, edit: false, delete: false },
          employees: { view: userData.role === 'Administrator', create: false, edit: false, delete: false },
          sales_reports: { view: true, create: userData.role !== 'Employee', edit: userData.role !== 'Employee', delete: false },
          vendors: { view: userData.role !== 'Employee', create: false, edit: false, delete: false },
          orders: { view: userData.role !== 'Employee', create: userData.role !== 'Employee', edit: userData.role !== 'Employee', delete: false },
          licenses: { view: userData.role !== 'Employee', create: false, edit: false, delete: false },
          salary: { view: userData.role === 'Administrator', create: userData.role === 'Administrator', edit: userData.role === 'Administrator', delete: false },
          inventory: { view: true, create: userData.role !== 'Employee', edit: userData.role !== 'Employee', delete: false },
          delivery: { view: userData.role !== 'Employee', create: userData.role !== 'Employee', edit: userData.role !== 'Employee', delete: false },
          settings: { view: userData.role === 'Administrator', create: false, edit: userData.role === 'Administrator', delete: false },
          user_management: { view: userData.role === 'Administrator', create: userData.role === 'Administrator', edit: userData.role === 'Administrator', delete: userData.role === 'Administrator' },
          site_management: { view: userData.role === 'Administrator', create: userData.role === 'Administrator', edit: userData.role === 'Administrator', delete: userData.role === 'Administrator' },
          system_logs: { view: userData.role === 'Administrator', create: false, edit: false, delete: false },
          security_settings: { view: userData.role === 'Administrator', create: false, edit: userData.role === 'Administrator', delete: false }
        })
      }

      console.log('AdminUserService: Creating user profile in database...')
      
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert(profileData)

      if (profileError) {
        console.error('AdminUserService: Profile creation failed:', profileError)
        
        // If profile creation fails, we should clean up the auth user
        try {
          await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
          console.log('AdminUserService: Cleaned up auth user after profile creation failure')
        } catch (cleanupError) {
          console.error('AdminUserService: Failed to cleanup auth user:', cleanupError)
        }
        
        return {
          success: false,
          error: `Failed to create user profile: ${profileError.message}`
        }
      }

      console.log('AdminUserService: User profile created successfully')

      // Step 3: Send welcome email (optional, can be implemented later)
      try {
        await this.sendWelcomeEmail(userData, authUser.user.id)
      } catch (emailError) {
        console.warn('AdminUserService: Failed to send welcome email:', emailError)
        // Don't fail the entire process if email fails
      }

      return {
        success: true,
        userId: authUser.user.id
      }

    } catch (error: any) {
      console.error('AdminUserService: Unexpected error during user creation:', error)
      return {
        success: false,
        error: error.message || 'An unexpected error occurred during user creation'
      }
    }
  }

  /**
   * Send welcome email to newly created user
   * @param userData User data
   * @param userId Created user ID
   */
  private async sendWelcomeEmail(userData: AdminCreateUserData, userId: string): Promise<void> {
    try {
      const stationDisplay = userData.station === 'ALL' ? 'All Stations' : userData.station
      
      // For now, just log the email content
      // In production, this would integrate with an email service
      const emailContent = {
        to: userData.email,
        subject: 'Welcome to DFS Manager Portal - Account Created',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1f2937;">Welcome to DFS Manager Portal</h2>
            <p>Hello ${userData.firstName} ${userData.lastName},</p>
            <p>Your account has been successfully created for the DFS Manager Portal.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">Account Details:</h3>
              <p><strong>Email:</strong> ${userData.email}</p>
              <p><strong>Employee ID:</strong> ${userData.employee_id}</p>
              <p><strong>Role:</strong> ${userData.role}</p>
              <p><strong>Station:</strong> ${stationDisplay}</p>
              <p><strong>Hire Date:</strong> ${new Date(userData.hire_date).toLocaleDateString()}</p>
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <h4 style="color: #92400e; margin-top: 0;">Login Information:</h4>
              <p style="color: #92400e; margin-bottom: 0;"><strong>Temporary Password:</strong> ${userData.password}</p>
              <p style="color: #92400e; font-size: 14px;"><em>Please change your password after your first login for security purposes.</em></p>
            </div>
            
            ${userData.station === 'ALL' ? `
            <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
              <h4 style="color: #1e40af; margin-top: 0;">Multi-Station Access:</h4>
              <p style="color: #1e40af; margin-bottom: 0;">You have been granted access to <strong>ALL stations</strong>. This means you can view, edit, and delete data from all locations based on your role permissions.</p>
            </div>
            ` : ''}
            
            <p>You can access the portal at: <a href="${window.location.origin}" style="color: #2563eb;">${window.location.origin}</a></p>
            
            <p>If you have any questions or need assistance, please contact your administrator.</p>
            
            <p>Best regards,<br>DFS Manager Portal Team</p>
          </div>
        `
      }
      
      console.log('AdminUserService: Welcome email content prepared:', emailContent)
      
      // TODO: Implement actual email sending using a service like Resend, SendGrid, etc.
      // For now, we'll just log it
      
    } catch (error) {
      console.error('AdminUserService: Error preparing welcome email:', error)
      throw error
    }
  }

  /**
   * Check if the current user has admin privileges
   * @returns Promise<boolean> indicating if user is admin
   */
  async isCurrentUserAdmin(): Promise<boolean> {
    try {
      // Get current user from regular Supabase client
      const { data: { user } } = await supabaseAdmin.auth.getUser()
      
      if (!user) {
        return false
      }

      // Check if user has admin role in user_profiles
      const { data: profile, error } = await supabaseAdmin
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (error || !profile) {
        return false
      }

      return profile.role === 'Administrator' || profile.role === 'Admin'
      
    } catch (error) {
      console.error('AdminUserService: Error checking admin status:', error)
      return false
    }
  }
}

// Export singleton instance
export const adminUserService = new AdminUserService()
export default adminUserService