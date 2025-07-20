import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

interface ModuleAccess {
  id: number;
  module_name: string;
  display_name: string;
  create_enabled: boolean;
  edit_enabled: boolean;
  delete_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface ModuleAccessContextType {
  moduleAccess: ModuleAccess[];
  loading: boolean;
  error: string | null;
  fetchModuleAccess: () => Promise<void>;
  updateModuleAccess: (id: number, updates: Partial<ModuleAccess>) => Promise<void>;
  createDefaultModules: () => Promise<void>;
  canCreate: (moduleName: string) => boolean;
  canEdit: (moduleName: string) => boolean;
  canDelete: (moduleName: string) => boolean;
  isModuleAccessEnabled: boolean;
}

const ModuleAccessContext = createContext<ModuleAccessContextType | undefined>(undefined);

export const useModuleAccess = () => {
  const context = useContext(ModuleAccessContext);
  if (!context) {
    throw new Error('useModuleAccess must be used within a ModuleAccessProvider');
  }
  return context;
};

export const ModuleAccessProvider: React.FC<{children: React.ReactNode;}> = ({ children }) => {
  const [moduleAccess, setModuleAccess] = useState<ModuleAccess[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModuleAccessEnabled, setIsModuleAccessEnabled] = useState(true);

  const defaultModules = [
  { module_name: 'products', display_name: 'Products', create_enabled: true, edit_enabled: true, delete_enabled: true },
  { module_name: 'employees', display_name: 'Employees', create_enabled: true, edit_enabled: true, delete_enabled: true },
  { module_name: 'sales', display_name: 'Sales Reports', create_enabled: true, edit_enabled: true, delete_enabled: true },
  { module_name: 'vendors', display_name: 'Vendors', create_enabled: true, edit_enabled: true, delete_enabled: true },
  { module_name: 'orders', display_name: 'Orders', create_enabled: true, edit_enabled: true, delete_enabled: true },
  { module_name: 'licenses', display_name: 'Licenses & Certificates', create_enabled: true, edit_enabled: true, delete_enabled: true },
  { module_name: 'salary', display_name: 'Salary Records', create_enabled: true, edit_enabled: true, delete_enabled: true },
  { module_name: 'delivery', display_name: 'Delivery Records', create_enabled: true, edit_enabled: true, delete_enabled: true }];


  const createDefaultModules = async () => {
    try {
      setLoading(true);

      for (const module of defaultModules) {
        const { error: createError } = await window.ezsite.apis.tableCreate("25712", {
          module_name: module.module_name,
          display_name: module.display_name,
          create_enabled: module.create_enabled,
          edit_enabled: module.edit_enabled,
          delete_enabled: module.delete_enabled,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        if (createError) {
          console.warn(`Failed to create module ${module.module_name}:`, createError);
        }
      }

      // Refresh the module access data
      await fetchModuleAccess();

      toast.success('Default modules created successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create default modules';
      console.error('Error creating default modules:', err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchModuleAccess = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await window.ezsite.apis.tablePage("25712", {
        PageNo: 1,
        PageSize: 100,
        OrderByField: "id",
        IsAsc: true,
        Filters: []
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const moduleData = response.data.List || [];

      // If no modules exist, create default ones
      if (moduleData.length === 0) {
        console.log('No modules found, creating default modules...');
        await createDefaultModules();
        return;
      }

      setModuleAccess(moduleData);
      setIsModuleAccessEnabled(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch module access';
      setError(errorMessage);
      setIsModuleAccessEnabled(false);
      console.error('Error fetching module access:', err);

      // Set default permissions when there's an error
      setModuleAccess(defaultModules.map((module, index) => ({
        id: index + 1,
        ...module,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })));
    } finally {
      setLoading(false);
    }
  };

  const updateModuleAccess = async (id: number, updates: Partial<ModuleAccess>) => {
    try {
      const response = await window.ezsite.apis.tableUpdate("25712", {
        ID: id,
        ...updates,
        updated_at: new Date().toISOString()
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Update local state immediately for real-time feedback
      setModuleAccess((prev) =>
      prev.map((module) =>
      module.id === id ? { ...module, ...updates, updated_at: new Date().toISOString() } : module
      )
      );

      toast.success('Module access updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update module access';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error updating module access:', err);

      // Revert local state change by refetching data
      await fetchModuleAccess();
    }
  };

  const canCreate = (moduleName: string): boolean => {
    if (!isModuleAccessEnabled) return true; // If module access is disabled, allow everything

    const module = moduleAccess.find((m) => m.module_name.toLowerCase() === moduleName.toLowerCase());
    return module?.create_enabled ?? true; // Default to true if module not found
  };

  const canEdit = (moduleName: string): boolean => {
    if (!isModuleAccessEnabled) return true;

    const module = moduleAccess.find((m) => m.module_name.toLowerCase() === moduleName.toLowerCase());
    return module?.edit_enabled ?? true;
  };

  const canDelete = (moduleName: string): boolean => {
    if (!isModuleAccessEnabled) return true;

    const module = moduleAccess.find((m) => m.module_name.toLowerCase() === moduleName.toLowerCase());
    return module?.delete_enabled ?? true;
  };

  useEffect(() => {
    fetchModuleAccess();
  }, []);

  const value: ModuleAccessContextType = {
    moduleAccess,
    loading,
    error,
    fetchModuleAccess,
    updateModuleAccess,
    createDefaultModules,
    canCreate,
    canEdit,
    canDelete,
    isModuleAccessEnabled
  };

  return (
    <ModuleAccessContext.Provider value={value}>
      {children}
    </ModuleAccessContext.Provider>);

};