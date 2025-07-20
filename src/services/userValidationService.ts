// User validation service for role conflicts, email uniqueness, and admin protection
export interface UserValidationError {
  field: string;
  message: string;
  type: 'email' | 'role' | 'admin_protection' | 'general';
}

export interface UserData {
  id?: number;
  user_id?: number;
  email?: string;
  role?: string;
  station?: string;
  is_active?: boolean;
}

class UserValidationService {
  private readonly PROTECTED_ADMIN_EMAIL = 'admin@dfs-portal.com';
  private readonly VALID_ROLES = ['Administrator', 'Management', 'Employee'];
  private readonly CONFLICTING_ROLES = [
  ['Administrator', 'Employee'], // Admin cannot be employee
  ['Management', 'Employee'] // Management cannot be employee at same station
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
  private async validateEmail(email: string, userId?: number): Promise<UserValidationError[]> {
    const errors: UserValidationError[] = [];

    try {
      // Check in User table (built-in)
      const userResponse = await window.ezsite.apis.tablePage('User', {
        PageNo: 1,
        PageSize: 1,
        Filters: [
        {
          name: 'Email',
          op: 'Equal',
          value: email
        }]

      });

      if (userResponse.error) {
        throw new Error(userResponse.error);
      }

      // If found and it's not the current user being updated
      if (userResponse.data?.List?.length > 0) {
        const existingUser = userResponse.data.List[0];
        if (!userId || existingUser.ID !== userId) {
          errors.push({
            field: 'email',
            message: 'This email address is already in use by another user',
            type: 'email'
          });
        }
      }

      // Check in employees table as well
      const employeeResponse = await window.ezsite.apis.tablePage(11727, {
        PageNo: 1,
        PageSize: 1,
        Filters: [
        {
          name: 'email',
          op: 'Equal',
          value: email
        }]

      });

      if (employeeResponse.data?.List?.length > 0) {
        errors.push({
          field: 'email',
          message: 'This email address is already registered as an employee',
          type: 'email'
        });
      }

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

    // Check if role is valid
    if (!this.VALID_ROLES.includes(userData.role!)) {
      errors.push({
        field: 'role',
        message: `Invalid role. Must be one of: ${this.VALID_ROLES.join(', ')}`,
        type: 'role'
      });
      return errors;
    }

    try {
      // Check for role conflicts at the same station
      if (userData.station && userData.user_id) {
        const existingProfiles = await window.ezsite.apis.tablePage(11725, {
          PageNo: 1,
          PageSize: 100,
          Filters: [
          {
            name: 'station',
            op: 'Equal',
            value: userData.station
          },
          {
            name: 'user_id',
            op: 'Equal',
            value: userData.user_id
          },
          {
            name: 'is_active',
            op: 'Equal',
            value: true
          }]

        });

        if (existingProfiles.data?.List?.length > 0) {
          const existingProfile = existingProfiles.data.List[0];

          // Check for conflicting roles
          for (const [role1, role2] of this.CONFLICTING_ROLES) {
            if (userData.role === role1 && existingProfile.role === role2 ||
            userData.role === role2 && existingProfile.role === role1) {
              errors.push({
                field: 'role',
                message: `Role conflict: Cannot assign ${userData.role} role when user already has ${existingProfile.role} role at ${userData.station}`,
                type: 'role'
              });
            }
          }
        }

        // Check for multiple admin roles (only one admin per system)
        if (userData.role === 'Administrator') {
          const adminResponse = await window.ezsite.apis.tablePage(11725, {
            PageNo: 1,
            PageSize: 1,
            Filters: [
            {
              name: 'role',
              op: 'Equal',
              value: 'Administrator'
            },
            {
              name: 'is_active',
              op: 'Equal',
              value: true
            }]

          });

          if (adminResponse.data?.List?.length > 0) {
            const existingAdmin = adminResponse.data.List[0];
            // Check if it's not the same user profile being updated
            if (existingAdmin.id !== userData.id) {
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
   * Protect admin account from losing admin privileges
   */
  private validateAdminProtection(userData: UserData): UserValidationError[] {
    const errors: UserValidationError[] = [];

    // Prevent removing admin role from protected admin email
    if (userData.email === this.PROTECTED_ADMIN_EMAIL) {
      if (userData.role && userData.role !== 'Administrator') {
        errors.push({
          field: 'role',
          message: 'Admin@dfs-portal.com must maintain Administrator role for system security',
          type: 'admin_protection'
        });
      }

      if (userData.is_active === false) {
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
  async canDeleteUser(userId: number, userEmail?: string): Promise<UserValidationError[]> {
    const errors: UserValidationError[] = [];

    try {
      // Get user email if not provided
      if (!userEmail) {
        const userResponse = await window.ezsite.apis.tablePage('User', {
          PageNo: 1,
          PageSize: 1,
          Filters: [
          {
            name: 'ID',
            op: 'Equal',
            value: userId
          }]

        });

        if (userResponse.data?.List?.length > 0) {
          userEmail = userResponse.data.List[0].Email;
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
  async validateBulkOperation(users: UserData[], operation: 'create' | 'update' | 'delete'): Promise<{[userId: string]: UserValidationError[];}> {
    const results: {[userId: string]: UserValidationError[];} = {};

    for (const user of users) {
      const userId = user.id?.toString() || user.user_id?.toString() || 'new';

      switch (operation) {
        case 'create':
          results[userId] = await this.validateUser(user, false);
          break;
        case 'update':
          results[userId] = await this.validateUser(user, true);
          break;
        case 'delete':
          results[userId] = await this.canDeleteUser(user.id!, user.email);
          break;
      }
    }

    return results;
  }

  /**
   * Get role conflicts for a specific role and station
   */
  async getRoleConflicts(role: string, station: string, excludeUserId?: number): Promise<any[]> {
    const conflicts = [];

    try {
      // Find conflicting roles
      const conflictingRoles = this.CONFLICTING_ROLES.
      filter(([role1, role2]) => role1 === role || role2 === role).
      flatMap(([role1, role2]) => role === role1 ? [role2] : [role1]);

      for (const conflictRole of conflictingRoles) {
        const response = await window.ezsite.apis.tablePage(11725, {
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
            name: 'is_active',
            op: 'Equal',
            value: true
          }]

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
}

export const userValidationService = new UserValidationService();
export default userValidationService;