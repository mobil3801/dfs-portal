import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

export interface PermissionConfig {
  canView: boolean;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
  canExport: boolean;
  canImport: boolean;
  canManageUsers: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
  canViewLogs: boolean;
  canAccessMonitoring: boolean;
}

export interface RoleCapabilities {
  dashboard: PermissionConfig;
  products: PermissionConfig;
  employees: PermissionConfig;
  sales: PermissionConfig;
  vendors: PermissionConfig;
  orders: PermissionConfig;
  licenses: PermissionConfig;
  salary: PermissionConfig;
  inventory: PermissionConfig;
  delivery: PermissionConfig;
  settings: PermissionConfig;
  admin: PermissionConfig;
  monitoring: PermissionConfig;
}

export interface EnhancedRoleAccess {
  userRole: 'Administrator' | 'Management' | 'Employee' | null;
  capabilities: RoleCapabilities;
  hasFeatureAccess: (feature: keyof RoleCapabilities, permission: keyof PermissionConfig) => boolean;
  canAccessAdminArea: boolean;
  canAccessMonitoringArea: boolean;
  canManageOtherUsers: boolean;
  stationAccess: string;
  getRestrictedMessage: (feature: string) => string;
  isFullyRestricted: boolean;
}

// Define comprehensive role-based permissions
const ROLE_PERMISSIONS: Record<'Administrator' | 'Management' | 'Employee', RoleCapabilities> = {
  Administrator: {
    dashboard: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: true,
      canExport: true,
      canImport: true,
      canManageUsers: true,
      canViewReports: true,
      canManageSettings: true,
      canViewLogs: true,
      canAccessMonitoring: true
    },
    products: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: true,
      canExport: true,
      canImport: true,
      canManageUsers: false,
      canViewReports: true,
      canManageSettings: true,
      canViewLogs: true,
      canAccessMonitoring: true
    },
    employees: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: true,
      canExport: true,
      canImport: true,
      canManageUsers: true,
      canViewReports: true,
      canManageSettings: true,
      canViewLogs: true,
      canAccessMonitoring: true
    },
    sales: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: true,
      canExport: true,
      canImport: true,
      canManageUsers: false,
      canViewReports: true,
      canManageSettings: true,
      canViewLogs: true,
      canAccessMonitoring: true
    },
    vendors: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: true,
      canExport: true,
      canImport: true,
      canManageUsers: false,
      canViewReports: true,
      canManageSettings: true,
      canViewLogs: true,
      canAccessMonitoring: false
    },
    orders: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: true,
      canExport: true,
      canImport: true,
      canManageUsers: false,
      canViewReports: true,
      canManageSettings: false,
      canViewLogs: true,
      canAccessMonitoring: false
    },
    licenses: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: true,
      canExport: true,
      canImport: true,
      canManageUsers: false,
      canViewReports: true,
      canManageSettings: true,
      canViewLogs: true,
      canAccessMonitoring: true
    },
    salary: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: true,
      canExport: true,
      canImport: true,
      canManageUsers: false,
      canViewReports: true,
      canManageSettings: true,
      canViewLogs: true,
      canAccessMonitoring: false
    },
    inventory: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: true,
      canExport: true,
      canImport: true,
      canManageUsers: false,
      canViewReports: true,
      canManageSettings: true,
      canViewLogs: true,
      canAccessMonitoring: true
    },
    delivery: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: true,
      canExport: true,
      canImport: true,
      canManageUsers: false,
      canViewReports: true,
      canManageSettings: false,
      canViewLogs: true,
      canAccessMonitoring: false
    },
    settings: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: true,
      canExport: true,
      canImport: true,
      canManageUsers: true,
      canViewReports: true,
      canManageSettings: true,
      canViewLogs: true,
      canAccessMonitoring: true
    },
    admin: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: true,
      canExport: true,
      canImport: true,
      canManageUsers: true,
      canViewReports: true,
      canManageSettings: true,
      canViewLogs: true,
      canAccessMonitoring: true
    },
    monitoring: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: true,
      canExport: true,
      canImport: true,
      canManageUsers: true,
      canViewReports: true,
      canManageSettings: true,
      canViewLogs: true,
      canAccessMonitoring: true
    }
  },
  Management: {
    dashboard: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: false,
      canExport: true,
      canImport: true,
      canManageUsers: false,
      canViewReports: true,
      canManageSettings: false,
      canViewLogs: true,
      canAccessMonitoring: false
    },
    products: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: false,
      canExport: true,
      canImport: true,
      canManageUsers: false,
      canViewReports: true,
      canManageSettings: false,
      canViewLogs: false,
      canAccessMonitoring: false
    },
    employees: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: false,
      canExport: true,
      canImport: false,
      canManageUsers: false,
      canViewReports: true,
      canManageSettings: false,
      canViewLogs: false,
      canAccessMonitoring: false
    },
    sales: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: false,
      canExport: true,
      canImport: true,
      canManageUsers: false,
      canViewReports: true,
      canManageSettings: false,
      canViewLogs: false,
      canAccessMonitoring: false
    },
    vendors: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: false,
      canExport: true,
      canImport: false,
      canManageUsers: false,
      canViewReports: true,
      canManageSettings: false,
      canViewLogs: false,
      canAccessMonitoring: false
    },
    orders: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: false,
      canExport: true,
      canImport: false,
      canManageUsers: false,
      canViewReports: true,
      canManageSettings: false,
      canViewLogs: false,
      canAccessMonitoring: false
    },
    licenses: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: false,
      canExport: true,
      canImport: false,
      canManageUsers: false,
      canViewReports: true,
      canManageSettings: false,
      canViewLogs: false,
      canAccessMonitoring: false
    },
    salary: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: false,
      canExport: true,
      canImport: false,
      canManageUsers: false,
      canViewReports: true,
      canManageSettings: false,
      canViewLogs: false,
      canAccessMonitoring: false
    },
    inventory: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: false,
      canExport: true,
      canImport: true,
      canManageUsers: false,
      canViewReports: true,
      canManageSettings: false,
      canViewLogs: false,
      canAccessMonitoring: false
    },
    delivery: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: false,
      canExport: true,
      canImport: false,
      canManageUsers: false,
      canViewReports: true,
      canManageSettings: false,
      canViewLogs: false,
      canAccessMonitoring: false
    },
    settings: {
      canView: true,
      canEdit: false,
      canCreate: false,
      canDelete: false,
      canExport: false,
      canImport: false,
      canManageUsers: false,
      canViewReports: true,
      canManageSettings: false,
      canViewLogs: false,
      canAccessMonitoring: false
    },
    admin: {
      canView: false,
      canEdit: false,
      canCreate: false,
      canDelete: false,
      canExport: false,
      canImport: false,
      canManageUsers: false,
      canViewReports: false,
      canManageSettings: false,
      canViewLogs: false,
      canAccessMonitoring: false
    },
    monitoring: {
      canView: false,
      canEdit: false,
      canCreate: false,
      canDelete: false,
      canExport: false,
      canImport: false,
      canManageUsers: false,
      canViewReports: false,
      canManageSettings: false,
      canViewLogs: false,
      canAccessMonitoring: false
    }
  },
  Employee: {
    dashboard: {
      canView: true,
      canEdit: false,
      canCreate: false,
      canDelete: false,
      canExport: false,
      canImport: false,
      canManageUsers: false,
      canViewReports: false,
      canManageSettings: false,
      canViewLogs: false,
      canAccessMonitoring: false
    },
    products: {
      canView: true,
      canEdit: false,
      canCreate: false,
      canDelete: false,
      canExport: false,
      canImport: false,
      canManageUsers: false,
      canViewReports: false,
      canManageSettings: false,
      canViewLogs: false,
      canAccessMonitoring: false
    },
    employees: {
      canView: false,
      canEdit: false,
      canCreate: false,
      canDelete: false,
      canExport: false,
      canImport: false,
      canManageUsers: false,
      canViewReports: false,
      canManageSettings: false,
      canViewLogs: false,
      canAccessMonitoring: false
    },
    sales: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: false,
      canExport: false,
      canImport: false,
      canManageUsers: false,
      canViewReports: false,
      canManageSettings: false,
      canViewLogs: false,
      canAccessMonitoring: false
    },
    vendors: {
      canView: true,
      canEdit: false,
      canCreate: false,
      canDelete: false,
      canExport: false,
      canImport: false,
      canManageUsers: false,
      canViewReports: false,
      canManageSettings: false,
      canViewLogs: false,
      canAccessMonitoring: false
    },
    orders: {
      canView: true,
      canEdit: false,
      canCreate: true,
      canDelete: false,
      canExport: false,
      canImport: false,
      canManageUsers: false,
      canViewReports: false,
      canManageSettings: false,
      canViewLogs: false,
      canAccessMonitoring: false
    },
    licenses: {
      canView: false,
      canEdit: false,
      canCreate: false,
      canDelete: false,
      canExport: false,
      canImport: false,
      canManageUsers: false,
      canViewReports: false,
      canManageSettings: false,
      canViewLogs: false,
      canAccessMonitoring: false
    },
    salary: {
      canView: false,
      canEdit: false,
      canCreate: false,
      canDelete: false,
      canExport: false,
      canImport: false,
      canManageUsers: false,
      canViewReports: false,
      canManageSettings: false,
      canViewLogs: false,
      canAccessMonitoring: false
    },
    inventory: {
      canView: true,
      canEdit: false,
      canCreate: false,
      canDelete: false,
      canExport: false,
      canImport: false,
      canManageUsers: false,
      canViewReports: false,
      canManageSettings: false,
      canViewLogs: false,
      canAccessMonitoring: false
    },
    delivery: {
      canView: true,
      canEdit: true,
      canCreate: true,
      canDelete: false,
      canExport: false,
      canImport: false,
      canManageUsers: false,
      canViewReports: false,
      canManageSettings: false,
      canViewLogs: false,
      canAccessMonitoring: false
    },
    settings: {
      canView: false,
      canEdit: false,
      canCreate: false,
      canDelete: false,
      canExport: false,
      canImport: false,
      canManageUsers: false,
      canViewReports: false,
      canManageSettings: false,
      canViewLogs: false,
      canAccessMonitoring: false
    },
    admin: {
      canView: false,
      canEdit: false,
      canCreate: false,
      canDelete: false,
      canExport: false,
      canImport: false,
      canManageUsers: false,
      canViewReports: false,
      canManageSettings: false,
      canViewLogs: false,
      canAccessMonitoring: false
    },
    monitoring: {
      canView: false,
      canEdit: false,
      canCreate: false,
      canDelete: false,
      canExport: false,
      canImport: false,
      canManageUsers: false,
      canViewReports: false,
      canManageSettings: false,
      canViewLogs: false,
      canAccessMonitoring: false
    }
  }
};

export const useEnhancedRoleAccess = (): EnhancedRoleAccess => {
  const { userProfile } = useAuth();

  const roleData = useMemo(() => {
    const userRole = userProfile?.role || null;
    const stationAccess = userProfile?.station || 'ALL';

    // Get capabilities based on role, default to Employee permissions if no role
    const capabilities = userRole ? ROLE_PERMISSIONS[userRole] : ROLE_PERMISSIONS.Employee;

    const canAccessAdminArea = userRole === 'Administrator';
    const canAccessMonitoringArea = userRole === 'Administrator';
    const canManageOtherUsers = userRole === 'Administrator';
    const isFullyRestricted = userRole === 'Employee';

    const hasFeatureAccess = (
    feature: keyof RoleCapabilities,
    permission: keyof PermissionConfig)
    : boolean => {
      if (!userRole) return false;
      return capabilities[feature][permission];
    };

    const getRestrictedMessage = (feature: string): string => {
      switch (userRole) {
        case 'Employee':
          return `Employee access level does not permit ${feature} operations. Contact your manager for assistance.`;
        case 'Management':
          return `Management access level has limited ${feature} permissions. Contact an administrator for full access.`;
        case 'Administrator':
          return `Administrator access confirmed for ${feature}.`;
        default:
          return `Please log in to access ${feature}.`;
      }
    };

    return {
      userRole,
      capabilities,
      hasFeatureAccess,
      canAccessAdminArea,
      canAccessMonitoringArea,
      canManageOtherUsers,
      stationAccess,
      getRestrictedMessage,
      isFullyRestricted
    };
  }, [userProfile]);

  return roleData;
};

export default useEnhancedRoleAccess;