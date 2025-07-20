import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useModuleAccess } from '@/contexts/ModuleAccessContext';
import { Loader2, Shield, Edit, Plus, Trash2, RefreshCw, Database, AlertCircle } from 'lucide-react';

const ModuleAccessManager: React.FC = () => {
  const {
    moduleAccess,
    loading,
    error,
    updateModuleAccess,
    createDefaultModules,
    fetchModuleAccess,
    isModuleAccessEnabled
  } = useModuleAccess();

  const [updatingModules, setUpdatingModules] = useState<Set<number>>(new Set());

  const handleToggle = async (moduleId: number, field: string, value: boolean) => {
    setUpdatingModules((prev) => new Set(prev).add(moduleId));

    try {
      await updateModuleAccess(moduleId, { [field]: value });
    } catch (error) {
      console.error('Failed to update module access:', error);
    } finally {
      setUpdatingModules((prev) => {
        const newSet = new Set(prev);
        newSet.delete(moduleId);
        return newSet;
      });
    }
  };

  const handleInitializeModules = async () => {
    await createDefaultModules();
  };

  const handleRefresh = async () => {
    await fetchModuleAccess();
  };

  if (loading && moduleAccess.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading module access settings...</span>
      </div>);

  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h2 className="text-2xl font-bold">Real-Time Module Access Control</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}>

            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {moduleAccess.length === 0 &&
          <Button
            onClick={handleInitializeModules}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white">

              <Database className="h-4 w-4 mr-2" />
              Initialize Modules
            </Button>
          }
        </div>
      </div>
      
      <p className="text-gray-600">
        Control which CRUD operations are available for each module in real-time. When disabled, users won't see the corresponding action buttons.
      </p>

      {!isModuleAccessEnabled &&
      <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Module access system is currently disabled. All permissions are set to allow by default.
          </AlertDescription>
        </Alert>
      }

      {error &&
      <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error: {error}
          </AlertDescription>
        </Alert>
      }

      {moduleAccess.length === 0 ?
      <Card className="border-dashed border-2">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Module Access Configuration Found</h3>
              <p className="text-gray-500 mb-4">
                Initialize the module access system to start controlling permissions.
              </p>
              <Button
              onClick={handleInitializeModules}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white">

                <Database className="h-4 w-4 mr-2" />
                Initialize Default Modules
              </Button>
            </div>
          </CardContent>
        </Card> :

      <div className="grid gap-4">
          {moduleAccess.map((module) => {
          const isUpdating = updatingModules.has(module.id);

          return (
            <Card key={module.id} className="border-l-4 border-l-blue-500 relative">
                {isUpdating &&
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-lg">
                    <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg shadow-lg">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Updating...</span>
                    </div>
                  </div>
              }
                
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{module.display_name}</span>
                    <Badge variant="outline">{module.module_name}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Control access to {module.display_name} module operations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Create Access */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Plus className="h-4 w-4 text-green-600" />
                        <Label htmlFor={`create-${module.id}`} className="text-sm font-medium">
                          Create Access
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                        id={`create-${module.id}`}
                        checked={module.create_enabled}
                        onCheckedChange={(checked) =>
                        handleToggle(module.id, 'create_enabled', checked)
                        }
                        disabled={isUpdating} />

                        <span className="text-sm text-gray-600">
                          {module.create_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>

                    {/* Edit Access */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Edit className="h-4 w-4 text-blue-600" />
                        <Label htmlFor={`edit-${module.id}`} className="text-sm font-medium">
                          Edit Access
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                        id={`edit-${module.id}`}
                        checked={module.edit_enabled}
                        onCheckedChange={(checked) =>
                        handleToggle(module.id, 'edit_enabled', checked)
                        }
                        disabled={isUpdating} />

                        <span className="text-sm text-gray-600">
                          {module.edit_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>

                    {/* Delete Access */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Trash2 className="h-4 w-4 text-red-600" />
                        <Label htmlFor={`delete-${module.id}`} className="text-sm font-medium">
                          Delete Access
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                        id={`delete-${module.id}`}
                        checked={module.delete_enabled}
                        onCheckedChange={(checked) =>
                        handleToggle(module.id, 'delete_enabled', checked)
                        }
                        disabled={isUpdating} />

                        <span className="text-sm text-gray-600">
                          {module.delete_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={module.create_enabled ? 'default' : 'secondary'}>
                      Create: {module.create_enabled ? 'ON' : 'OFF'}
                    </Badge>
                    <Badge variant={module.edit_enabled ? 'default' : 'secondary'}>
                      Edit: {module.edit_enabled ? 'ON' : 'OFF'}
                    </Badge>
                    <Badge variant={module.delete_enabled ? 'default' : 'secondary'}>
                      Delete: {module.delete_enabled ? 'ON' : 'OFF'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Updated: {new Date(module.updated_at).toLocaleString()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>);

        })}
        </div>
      }

      {loading && moduleAccess.length > 0 &&
      <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Updating module access...</span>
        </div>
      }
    </div>);

};

export default ModuleAccessManager;