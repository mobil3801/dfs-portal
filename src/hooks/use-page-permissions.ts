import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PagePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
  print: boolean;
  approve?: boolean;
  bulk_operations?: boolean;
  advanced_features?: boolean;
}

interface UserProfile {
  id: number;
  user_id: number;
  role: string;
  station: string;
  employee_id: string;
  phone: string;
  hire_date: string;
  is_active: boolean;
  detailed_permissions: string;
}

interface DetailedPermissions {
  [key: string]: PagePermission;
}

const defaultPagePermission: PagePermission = {
  view: false,
  create: false,
  edit: false,
  delete: false,
  export: false,
  print: false,
  approve: false,
  bulk_operations: false,
  advanced_features: false
};

export const usePagePermissions = (pageKey: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<PagePermission>(defaultPagePermission);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserPermissions();
    } else {
      setPermissions(defaultPagePermission);
      setLoading(false);
    }
  }, [user, pageKey]);

  const fetchUserPermissions = async () => {
    try {
      setLoading(true);
      console.log('Fetching permissions for user:', user?.ID, 'Page:', pageKey);

      // Fetch user profile from database
      const { data, error } = await window.ezsite.apis.tablePage(11725, {
        PageNo: 1,
        PageSize: 1,
        OrderByField: "id",
        IsAsc: false,
        Filters: [
        {
          name: "user_id",
          op: "Equal",
          value: user?.ID
        }]

      });

      if (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }

      const profile = data?.List?.[0];
      if (!profile) {
        console.log('No profile found for user, using default permissions');
        setPermissions(defaultPagePermission);
        setUserProfile(null);
        return;
      }

      console.log('User profile found:', profile.employee_id, 'Role:', profile.role);
      setUserProfile(profile);

      // Parse detailed permissions
      let userPermissions: DetailedPermissions = {};
      try {
        if (profile.detailed_permissions && profile.detailed_permissions.trim() !== '' && profile.detailed_permissions !== '{}') {
          userPermissions = JSON.parse(profile.detailed_permissions);
          console.log('Parsed user permissions for page:', pageKey, userPermissions[pageKey]);
        } else {
          console.log('No detailed permissions found, applying role-based defaults');
          userPermissions = getDefaultRolePermissions(profile.role);
        }
      } catch (parseError) {
        console.error('Error parsing permissions, applying role defaults:', parseError);
        userPermissions = getDefaultRolePermissions(profile.role);
      }

      // Get permissions for the specific page
      const pagePermissions = userPermissions[pageKey] || defaultPagePermission;
      setPermissions(pagePermissions);

      console.log('Final permissions for page', pageKey, ':', pagePermissions);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      setPermissions(defaultPagePermission);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultRolePermissions = (role: string): DetailedPermissions => {
    const allPermissions: DetailedPermissions = {};

    // Define all pages
    const allPages = [
    'dashboard', 'products', 'product_form', 'employees', 'employee_form',
    'sales_reports', 'sales_report_form', 'vendors', 'vendor_form',
    'orders', 'order_form', 'delivery', 'delivery_form', 'licenses',
    'license_form', 'inventory_alerts', 'alert_settings', 'gas_delivery_inventory',
    'salary', 'salary_form', 'settings', 'user_management', 'site_management',
    'system_logs', 'security_settings'];


    // Initialize all pages with default permissions
    allPages.forEach((page) => {
      allPermissions[page] = { ...defaultPagePermission };
    });

    switch (role) {
      case 'Administrator':
        // Full access to everything
        allPages.forEach((page) => {
          allPermissions[page] = {
            view: true,
            create: true,
            edit: true,
            delete: true,
            export: true,
            print: true,
            approve: true,
            bulk_operations: true,
            advanced_features: true
          };
        });
        break;

      case 'Management':
        // Full operational access, limited admin access
        const managementPages = [
        'dashboard', 'products', 'product_form', 'employees', 'employee_form',
        'sales_reports', 'sales_report_form', 'vendors', 'vendor_form',
        'orders', 'order_form', 'delivery', 'delivery_form', 'licenses',
        'license_form', 'inventory_alerts', 'alert_settings', 'gas_delivery_inventory',
        'salary', 'salary_form'];


        managementPages.forEach((page) => {
          allPermissions[page] = {
            view: true,
            create: true,
            edit: true,
            delete: true,
            export: true,
            print: true,
            approve: true,
            bulk_operations: true,
            advanced_features: false
          };
        });

        // Limited admin access
        ['settings', 'user_management'].forEach((page) => {
          allPermissions[page] = {
            view: true,
            create: false,
            edit: true,
            delete: false,
            export: true,
            print: true,
            approve: false,
            bulk_operations: false,
            advanced_features: false
          };
        });
        break;

      case 'Employee':
        // Basic operational access
        const employeePages = ['dashboard', 'sales_reports', 'sales_report_form', 'delivery', 'delivery_form'];
        employeePages.forEach((page) => {
          allPermissions[page] = {
            view: true,
            create: true,
            edit: true,
            delete: false,
            export: false,
            print: true,
            approve: false,
            bulk_operations: false,
            advanced_features: false
          };
        });

        // View-only access
        ['products', 'inventory_alerts', 'gas_delivery_inventory'].forEach((page) => {
          allPermissions[page] = {
            view: true,
            create: false,
            edit: false,
            delete: false,
            export: false,
            print: false,
            approve: false,
            bulk_operations: false,
            advanced_features: false
          };
        });
        break;

      default:
        // Minimal access for unknown roles
        allPermissions['dashboard'] = {
          view: true,
          create: false,
          edit: false,
          delete: false,
          export: false,
          print: false,
          approve: false,
          bulk_operations: false,
          advanced_features: false
        };
        break;
    }

    return allPermissions;
  };

  const hasPermission = (permissionType: keyof PagePermission): boolean => {
    if (loading) return false;
    return permissions[permissionType] === true;
  };

  const checkPermissionAndNotify = (permissionType: keyof PagePermission, action?: string): boolean => {
    const hasAccess = hasPermission(permissionType);

    if (!hasAccess && action) {
      toast({
        title: "Access Denied",
        description: `You don't have permission to ${action}. Contact your administrator for access.`,
        variant: "destructive"
      });
    }

    return hasAccess;
  };

  return {
    permissions,
    userProfile,
    loading,
    hasPermission,
    checkPermissionAndNotify,
    canView: hasPermission('view'),
    canCreate: hasPermission('create'),
    canEdit: hasPermission('edit'),
    canDelete: hasPermission('delete'),
    canExport: hasPermission('export'),
    canPrint: hasPermission('print'),
    canApprove: hasPermission('approve'),
    canBulkOperations: hasPermission('bulk_operations'),
    canAdvancedFeatures: hasPermission('advanced_features'),
    refreshPermissions: fetchUserPermissions
  };
};

export default usePagePermissions;