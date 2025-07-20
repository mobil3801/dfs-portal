import { supabaseAdapter } from './supabase/supabaseAdapter';

// User validation service for role conflicts, email uniqueness, and admin protection
export interface UserValidationError {
  field: string;
  message: string;
  type: 'email' | 'role' | 'admin_protection' | 'general';
}

export interface UserData {
  id?: string; // UUID in Supabase
  user_id?: string; // UUID reference
  email?: string;
  role?: string;
  station?: string;
  station_id?: string; // UUID reference to station
  is_active?: boolean;
  active?: boolean; // Alternative field name
  
  // Legacy compatibility
  ID?: number;
}

class SupabaseUserValidationService {
  private readonly PROTECTED_ADMIN_EMAIL = 'admin@dfs-portal.com';
  private readonly VALID_ROLES = [
    'Administrator', 
    'Management', 
    'Employee',
    'admin',
    'manager',
    'employee'
  ];
  private readonly CONFLICTING_ROLES = [
    ['Administrator', 'Employee'], // Admin cannot be employee
    ['Management', 'Employee'], // Management cannot be employee at same station
    ['admin', 'employee'], // Lowercase variants
    ['manager', 'employee']
  ];

  /**
   * Validate user data before creation or update
   */
  async validateUser(userData: UserData, isUpdate = false): Promise<UserValidationError[]> {
    const errors: UserValidationError[] = [];

    try {
      // Email validation
      if (userData.email) {
        const emailErrors = await this.validateEmail(userData.email, userData.id);
        errors.push(...emailErrors);
      }

      // Role validation
      if (userData.role) {
        const roleErrors = await this.validateRole(userData);
        errors.push(...roleErrors);
      }

      // Admin protection validation
      if (isUpdate && userData.email === this.PROTECTED_ADMIN_EMAIL) {
        const adminErrors = this.validateAdminProtection(userData);
        errors.push(...adminErrors);
      }

      return errors;
    } catch (error) {
      console.error('User validation error:', error);
      return [{
        field: 'general',
        message: 'Validation service error occurred',
        type: 'general'
      }];
    }
  }

  /**
   * Check if email is unique across all users
   */
  private async validateEmail(email: string, userId?: string): Promise<UserValidationError[]> {
    const errors: UserValidationError[] = [];

    try {
      // Check in user_profiles table (11725)
      const profileResponse = await supabaseAdapter.tablePage(11725, {
        PageNo: 1,
        PageSize: 1,
        Filters: [
          {
            name: 'email',
            op: 'Equal',
            value: email
          }
        ]
      });

      if (profileResponse.error) {
        console.error('Error checking user profiles for email:', profileResponse.error);
      } else if (profileResponse.data?.List?.length > 0) {
        const existingProfile = profileResponse.data.List[0];
        // Check if it's not the current user being updated
        if (!userId || existingProfile.id !== userId) {
          errors.push({
            field: 'email',
            message: 'This email address is already in use by another user profile',
            type: 'email'
          });
        }
      }

      // Check in employees table (11727)
      const employeeResponse = await supabaseAdapter.tablePage(11727, {
        PageNo: 1,
        PageSize: 1,
        Filters: [
          {
            name: 'email',
            op: 'Equal',
            value: email
          }
        ]
      });

      if (employeeResponse.error) {
        console.error('Error checking employees for email:', employeeResponse.error);
      } else if (employeeResponse.data?.List?.length > 0) {
        const existingEmployee = employeeResponse.data.List[0];
        // Check if it's not the current user being updated
        if (!userId || existingEmployee.user_id !== userId) {
          errors.push({
            field: 'email',
            message: 'This email address is already registered as an employee',
            type: 'email'
          });
        }
      }

      // Note: The built-in 'User' table from Easysite doesn't have a direct equivalent in Supabase
      // User authentication is handled by Supabase Auth, so we may need to check auth.users differently
      // For now, we'll focus on the custom user_profiles and employees tables

    } catch (error) {
      console.error('Email validation error:', error);
      errors.push({
        field: 'email',
        message: 'Unable to verify email uniqueness',
        type: 'email'
      });
    }

    return errors;
  }

  /**
   * Validate role assignments and check for conflicts
   */
  private async validateRole(userData: UserData): Promise<UserValidationError[]> {
    const errors: UserValidationError[] = [];

    // Normalize role for comparison
    const normalizedRole = this.normalizeRole(userData.role!);

    // Check if role is valid
    if (!this.isValidRole(normalizedRole)) {
      errors.push({
        field: 'role',
        message: `Invalid role. Must be one of: ${this.VALID_ROLES.join(', ')}`,
        type: 'role'
      });
      return errors;
    }

    try {
      // Check for role conflicts at the same station
      if ((userData.station || userData.station_id) && userData.user_id) {
        const stationFilter = userData.station_id 
          ? { name: 'station_id', op: 'Equal', value: userData.station_id }
          : { name: 'station', op: 'Equal', value: userData.station };

        const existingProfiles = await supabaseAdapter.tablePage(11725, {
          PageNo: 1,
          PageSize: 100,
          Filters: [
            stationFilter,
            {
              name: 'user_id',
              op: 'Equal',
              value: userData.user_id
            },
            {
              name: 'active',
              op: 'Equal',
              value: true
            }
          ]
        });

        if (existingProfiles.data?.List?.length > 0) {
          for (const existingProfile of existingProfiles.data.List) {
            // Skip if it's the same profile being updated
            if (userData.id && existingProfile.id === userData.id) {
              continue;
            }

            const existingNormalizedRole = this.normalizeRole(existingProfile.role);

            // Check for conflicting roles
            if (this.rolesConflict(normalizedRole, existingNormalizedRole)) {
              errors.push({
                field: 'role',
                message: `Role conflict: Cannot assign ${userData.role} role when user already has ${existingProfile.role} role at ${userData.station || 'this station'}`,
                type: 'role'
              });
            }
          }
        }

        // Check for multiple admin roles (only one admin per system)
        if (this.isAdminRole(normalizedRole)) {
          const adminResponse = await supabaseAdapter.tablePage(11725, {
            PageNo: 1,
            PageSize: 5,
            Filters: [
              {
                name: 'role',
                op: 'In', 
                value: ['Administrator', 'admin']
              },
              {
                name: 'active',
                op: 'Equal',
                value: true
              }
            ]
          });

          if (adminResponse.data?.List?.length > 0) {
            const existingAdmins = adminResponse.data.List.filter((admin: any) => 
              userData.id !== admin.id
            );

            if (existingAdmins.length > 0) {
              errors.push({
                field: 'role',
                message: 'Only one Administrator role is allowed in the system',
                type: 'role'
              });
            }
          }
        }
      }

    } catch (error) {
      console.error('Role validation error:', error);
      errors.push({
        field: 'role',
        message: 'Unable to verify role conflicts',
        type: 'role'
      });
    }

    return errors;
  }

  /**
   * Normalize role names for consistent comparison
   */
  private normalizeRole(role: string): string {
    const roleMap: { [key: string]: string } = {
      'Administrator': 'admin',
      'admin': 'admin',
      'Management': 'manager',
      'Manager': 'manager',
      'manager': 'manager',
      'Employee': 'employee',
      'employee': 'employee'
    };

    return roleMap[role] || role.toLowerCase();
  }

  /**
   * Check if role is valid
   */
  private isValidRole(role: string): boolean {
    return this.VALID_ROLES.some(validRole => 
      this.normalizeRole(validRole) === this.normalizeRole(role)
    );
  }

  /**
   * Check if role is an admin role
   */
  private isAdminRole(role: string): boolean {
    const normalizedRole = this.normalizeRole(role);
    return normalizedRole === 'admin';
  }

  /**
   * Check if two roles conflict
   */
  private rolesConflict(role1: string, role2: string): boolean {
    const normalized1 = this.normalizeRole(role1);
    const normalized2 = this.normalizeRole(role2);

    return this.CONFLICTING_ROLES.some(([conflictRole1, conflictRole2]) => {
      const normalizedConflict1 = this.normalizeRole(conflictRole1);
      const normalizedConflict2 = this.normalizeRole(conflictRole2);

      return (normalized1 === normalizedConflict1 && normalized2 === normalizedConflict2) ||
             (normalized1 === normalizedConflict2 && normalized2 === normalizedConflict1);
    });
  }

  /**
   * Protect admin account from losing admin privileges
   */
  private validateAdminProtection(userData: UserData): UserValidationError[] {
    const errors: UserValidationError[] = [];

    // Prevent removing admin role from protected admin email
    if (userData.email === this.PROTECTED_ADMIN_EMAIL) {
      if (userData.role && !this.isAdminRole(userData.role)) {
        errors.push({
          field: 'role',
          message: 'Admin@dfs-portal.com must maintain Administrator role for system security',
          type: 'admin_protection'
        });
      }

      const isActive = userData.is_active !== undefined ? userData.is_active : userData.active;
      if (isActive === false) {
        errors.push({
          field: 'is_active',
          message: 'Admin@dfs-portal.com account cannot be deactivated',
          type: 'admin_protection'
        });
      }
    }

    return errors;
  }

  /**
   * Check if user can be deleted
   */
  async canDeleteUser(userId: string, userEmail?: string): Promise<UserValidationError[]> {
    const errors: UserValidationError[] = [];

    try {
      // Get user email if not provided
      if (!userEmail) {
        const userResponse = await supabaseAdapter.tablePage(11725, {
          PageNo: 1,
          PageSize: 1,
          Filters: [
            {
              name: 'id',
              op: 'Equal',
              value: userId
            }
          ]
        });

        if (userResponse.data?.List?.length > 0) {
          userEmail = userResponse.data.List[0].email;
        }
      }

      // Protect admin account from deletion
      if (userEmail === this.PROTECTED_ADMIN_EMAIL) {
        errors.push({
          field: 'delete',
          message: 'Admin@dfs-portal.com account cannot be deleted for system security',
          type: 'admin_protection'
        });
      }

    } catch (error) {
      console.error('Delete validation error:', error);
      errors.push({
        field: 'delete',
        message: 'Unable to verify if user can be deleted',
        type: 'general'
      });
    }

    return errors;
  }

  /**
   * Validate bulk operations
   */
  async validateBulkOperation(
    users: UserData[], 
    operation: 'create' | 'update' | 'delete'
  ): Promise<{ [userId: string]: UserValidationError[] }> {
    const results: { [userId: string]: UserValidationError[] } = {};

    for (const user of users) {
      const userId = user.id || user.user_id || 'new';

      switch (operation) {
        case 'create':
          results[userId] = await this.validateUser(user, false);
          break;
        case 'update':
          results[userId] = await this.validateUser(user, true);
          break;
        case 'delete':
          if (user.id) {
            results[userId] = await this.canDeleteUser(user.id, user.email);
          } else {
            results[userId] = [{
              field: 'id',
              message: 'User ID is required for deletion',
              type: 'general'
            }];
          }
          break;
      }
    }

    return results;
  }

  /**
   * Get role conflicts for a specific role and station
   */
  async getRoleConflicts(
    role: string, 
    station: string, 
    excludeUserId?: string
  ): Promise<any[]> {
    const conflicts = [];

    try {
      const normalizedRole = this.normalizeRole(role);

      // Find conflicting roles
      const conflictingRoles = this.CONFLICTING_ROLES
        .filter(([role1, role2]) => 
          this.normalizeRole(role1) === normalizedRole || 
          this.normalizeRole(role2) === normalizedRole
        )
        .flatMap(([role1, role2]) => 
          this.normalizeRole(role) === this.normalizeRole(role1) ? [role2] : [role1]
        );

      for (const conflictRole of conflictingRoles) {
        const response = await supabaseAdapter.tablePage(11725, {
          PageNo: 1,
          PageSize: 100,
          Filters: [
            {
              name: 'role',
              op: 'Equal',
              value: conflictRole
            },
            {
              name: 'station',
              op: 'Equal',
              value: station
            },
            {
              name: 'active',
              op: 'Equal',
              value: true
            }
          ]
        });

        if (response.data?.List) {
          const filteredConflicts = excludeUserId ?
            response.data.List.filter((profile: any) => profile.user_id !== excludeUserId) :
            response.data.List;

          conflicts.push(...filteredConflicts.map((profile: any) => ({
            ...profile,
            conflictType: `${role} conflicts with ${conflictRole}`
          })));
        }
      }

    } catch (error) {
      console.error('Error checking role conflicts:', error);
    }

    return conflicts;
  }

  /**
   * Check email uniqueness across Supabase Auth users
   */
  async checkSupabaseAuthUser(email: string): Promise<boolean> {
    try {
      // This would require admin access to check Supabase Auth users
      // For now, we'll rely on client-side auth checks or handle this differently
      // In production, this might be handled by RLS policies or server-side functions
      
      console.warn('Supabase Auth user check not implemented - relying on user_profiles table');
      return false; // Assume no conflict for now
    } catch (error) {
      console.error('Error checking Supabase Auth user:', error);
      return false;
    }
  }

  /**
   * Validate station access permissions
   */
  async validateStationAccess(
    userId: string, 
    stationId: string, 
    requiredRole?: string
  ): Promise<UserValidationError[]> {
    const errors: UserValidationError[] = [];

    try {
      const response = await supabaseAdapter.tablePage(11725, {
        PageNo: 1,
        PageSize: 1,
        Filters: [
          {
            name: 'user_id',
            op: 'Equal',
            value: userId
          },
          {
            name: 'station_id',
            op: 'Equal',
            value: stationId
          },
          {
            name: 'active',
            op: 'Equal',
            value: true
          }
        ]
      });

      if (!response.data?.List?.length) {
        errors.push({
          field: 'station_access',
          message: 'User does not have access to this station',
          type: 'role'
        });
        return errors;
      }

      const userProfile = response.data.List[0];

      if (requiredRole) {
        const userNormalizedRole = this.normalizeRole(userProfile.role);
        const requiredNormalizedRole = this.normalizeRole(requiredRole);

        if (userNormalizedRole !== requiredNormalizedRole && userNormalizedRole !== 'admin') {
          errors.push({
            field: 'station_access',
            message: `User role '${userProfile.role}' insufficient. Required role: '${requiredRole}'`,
            type: 'role'
          });
        }
      }

    } catch (error) {
      console.error('Station access validation error:', error);
      errors.push({
        field: 'station_access',
        message: 'Unable to verify station access permissions',
        type: 'general'
      });
    }

    return errors;
  }

  /**
   * Get validation statistics
   */
  getValidationStats() {
    return {
      validRoles: this.VALID_ROLES,
      conflictingRoles: this.CONFLICTING_ROLES,
      protectedEmail: this.PROTECTED_ADMIN_EMAIL
    };
  }
}

export const supabaseUserValidationService = new SupabaseUserValidationService();
export default supabaseUserValidationService;