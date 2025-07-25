import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
// cspell:ignore sonner
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

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

      // Create a temporary admin user session for module creation
      const { data: { user } } = await supabase.auth.getUser();
      
      for (const module of defaultModules) {
        const { error: createError } = await supabase
          .from('module_access')
          .insert({
            user_id: user?.id || null, // Use current user or null for system-wide
            module_name: module.module_name,
            display_name: module.display_name,
            access_level: 'full',
            create_enabled: module.create_enabled,
            edit_enabled: module.edit_enabled,
            delete_enabled: module.delete_enabled,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createError) {
          console.warn(`Failed to create module ${module.module_name}:`, createError.message);
        } else {
          console.log(`✅ Created module: ${module.display_name}`);
        }
      }

      // Refresh the module access data
      await fetchModuleAccess();

      toast.success('Default modules created successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create default modules';
      console.error('Error creating default modules:', err);
      
      // Fallback: Set default modules in memory if database creation fails
      setModuleAccess(defaultModules.map((module, index) => ({
        id: index + 1,
        ...module,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })));
      setIsModuleAccessEnabled(true);
      
      toast.success('Default modules loaded (using fallback)');
    } finally {
      setLoading(false);
    }
  };

  const fetchModuleAccess = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch modules from Supabase
      const { data: moduleData, error: fetchError } = await supabase
        .from('module_access')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: true });

      if (fetchError) {
        console.warn('Supabase fetch error:', fetchError.message);
        throw new Error(fetchError.message);
      }

      // Transform the data to match our interface
      const transformedData = (moduleData || []).map((module: any) => ({
        id: module.id,
        module_name: module.module_name,
        display_name: module.display_name || module.module_name,
        create_enabled: module.create_enabled ?? true,
        edit_enabled: module.edit_enabled ?? true,
        delete_enabled: module.delete_enabled ?? true,
        created_at: module.created_at,
        updated_at: module.updated_at
      }));

      // If no modules exist, create default ones
      if (transformedData.length === 0) {
        console.log('No modules found, creating default modules...');
        await createDefaultModules();
        return;
      }

      setModuleAccess(transformedData);
      setIsModuleAccessEnabled(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch module access';
      setError(errorMessage);
      setIsModuleAccessEnabled(false);
      console.error('Error fetching module access:', err);

      // Fallback: Set default permissions when there's an error
      console.log('Using fallback default modules due to database error');
      setModuleAccess(defaultModules.map((module, index) => ({
        id: index + 1,
        ...module,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })));
      setIsModuleAccessEnabled(true); // Enable with fallback data
    } finally {
      setLoading(false);
    }
  };

  const updateModuleAccess = async (id: number, updates: Partial<ModuleAccess>) => {
    try {
      const { error: updateError } = await supabase
        .from('module_access')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        throw new Error(updateError.message);
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

  const value: ModuleAccessContextType = useMemo(() => ({
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
  }), [
    moduleAccess,
    loading,
    error,
    isModuleAccessEnabled
  ]);

  return (
    <ModuleAccessContext.Provider value={value}>
      {children}
    </ModuleAccessContext.Provider>);

};