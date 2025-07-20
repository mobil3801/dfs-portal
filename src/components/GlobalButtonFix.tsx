import React from 'react';
import { toast } from '@/hooks/use-toast';

// Global button functionality fixes and improvements
// This component provides utility functions for ensuring all buttons work correctly

interface ButtonFixOptions {
  showLoadingStates?: boolean;
  validateBeforeAction?: boolean;
  confirmDeletion?: boolean;
  logActions?: boolean;
}

export const useButtonFix = (options: ButtonFixOptions = {}) => {
  const {
    showLoadingStates = true,
    validateBeforeAction = true,
    confirmDeletion = true,
    logActions = true
  } = options;

  // Enhanced delete handler with proper confirmation and error handling
  const handleDelete = async (
  itemId: number,
  itemName: string,
  tableId: string,
  onSuccess?: () => void,
  customConfirmMessage?: string) =>
  {
    if (logActions) {
      console.log(`Delete action triggered for ${itemName} (ID: ${itemId})`);
    }

    if (confirmDeletion) {
      const confirmed = confirm(
        customConfirmMessage ||
        `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
      );
      if (!confirmed) {
        if (logActions) {
          console.log('Delete action cancelled by user');
        }
        return false;
      }
    }

    try {
      if (logActions) {
        console.log(`Attempting to delete from table ${tableId}:`, { ID: itemId });
      }

      const { error } = await window.ezsite.apis.tableDelete(tableId, { ID: itemId });

      if (error) {
        console.error('API returned error:', error);
        throw error;
      }

      if (logActions) {
        console.log(`Successfully deleted ${itemName} (ID: ${itemId})`);
      }

      toast({
        title: "Success",
        description: `${itemName} deleted successfully`
      });

      if (onSuccess) {
        onSuccess();
      }

      return true;
    } catch (error) {
      console.error(`Error deleting ${itemName}:`, error);
      toast({
        title: "Error",
        description: `Failed to delete ${itemName}: ${error}`,
        variant: "destructive"
      });
      return false;
    }
  };

  // Enhanced save handler with proper validation and error handling
  const handleSave = async (
  data: any,
  tableId: string,
  isEditing: boolean,
  itemId?: number,
  onSuccess?: () => void,
  customValidation?: (data: any) => string | null) =>
  {
    if (logActions) {
      console.log(`Save action triggered for table ${tableId}:`, { isEditing, itemId, data });
    }

    // Custom validation
    if (validateBeforeAction && customValidation) {
      const validationError = customValidation(data);
      if (validationError) {
        toast({
          title: "Validation Error",
          description: validationError,
          variant: "destructive"
        });
        return false;
      }
    }

    try {
      let result;

      if (isEditing && itemId) {
        if (logActions) {
          console.log(`Updating record in table ${tableId}:`, { ID: itemId, ...data });
        }
        result = await window.ezsite.apis.tableUpdate(tableId, { ID: itemId, ...data });
      } else {
        if (logActions) {
          console.log(`Creating new record in table ${tableId}:`, data);
        }
        result = await window.ezsite.apis.tableCreate(tableId, data);
      }

      if (result.error) {
        console.error('API returned error:', result.error);
        throw result.error;
      }

      if (logActions) {
        console.log(`Successfully ${isEditing ? 'updated' : 'created'} record`);
      }

      toast({
        title: "Success",
        description: `Record ${isEditing ? 'updated' : 'created'} successfully`
      });

      if (onSuccess) {
        onSuccess();
      }

      return true;
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} record:`, error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} record: ${error}`,
        variant: "destructive"
      });
      return false;
    }
  };

  // Enhanced navigation handler with proper logging
  const handleNavigation = (navigate: any, path: string, params?: Record<string, any>) => {
    if (logActions) {
      console.log(`Navigation triggered to: ${path}`, params);
    }

    try {
      navigate(path, params);
      return true;
    } catch (error) {
      console.error('Navigation error:', error);
      toast({
        title: "Navigation Error",
        description: "Failed to navigate to the requested page",
        variant: "destructive"
      });
      return false;
    }
  };

  // Enhanced form validation
  const validateForm = (data: any, requiredFields: string[]): string | null => {
    for (const field of requiredFields) {
      if (!data[field] || typeof data[field] === 'string' && data[field].trim() === '') {
        return `${field.replace(/_/g, ' ')} is required`;
      }
    }
    return null;
  };

  // Enhanced API call wrapper
  const safeApiCall = async (
  apiCall: () => Promise<any>,
  errorMessage: string = "API operation failed") =>
  {
    try {
      const result = await apiCall();
      if (result.error) {
        throw result.error;
      }
      return { success: true, data: result.data || result };
    } catch (error) {
      console.error('API call failed:', error);
      toast({
        title: "Error",
        description: `${errorMessage}: ${error}`,
        variant: "destructive"
      });
      return { success: false, error };
    }
  };

  return {
    handleDelete,
    handleSave,
    handleNavigation,
    validateForm,
    safeApiCall
  };
};

// Component to test all button functionality
export const ButtonTestComponent: React.FC = () => {
  const { handleDelete, handleSave, safeApiCall } = useButtonFix();

  const testDelete = async () => {
    await handleDelete(999, "Test Item", "11726", () => {
      console.log("Delete test completed successfully");
    });
  };

  const testSave = async () => {
    const testData = {
      product_name: "Test Product",
      category: "Test Category",
      price: 10.99
    };

    await handleSave(testData, "11726", false, undefined, () => {
      console.log("Save test completed successfully");
    });
  };

  const testApiCall = async () => {
    await safeApiCall(
      () => window.ezsite.apis.tablePage("11726", {
        PageNo: 1,
        PageSize: 1,
        OrderByField: "ID",
        IsAsc: false,
        Filters: []
      }),
      "Failed to fetch test data"
    );
  };

  return (
    <div className="hidden">
      {/* This component is for testing purposes only */}
    </div>);

};

export default useButtonFix;