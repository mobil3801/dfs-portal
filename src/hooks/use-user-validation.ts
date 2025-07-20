import { useState, useCallback } from 'react';
import { userValidationService, UserValidationError, UserData } from '@/services/userValidationService';
import { useToast } from '@/hooks/use-toast';

export interface UseUserValidationOptions {
  showToasts?: boolean;
  onValidationError?: (errors: UserValidationError[]) => void;
  onValidationSuccess?: () => void;
}

export function useUserValidation(options: UseUserValidationOptions = {}) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<UserValidationError[]>([]);
  const { toast } = useToast();
  const { showToasts = true, onValidationError, onValidationSuccess } = options;

  const validateUser = useCallback(async (userData: UserData, isUpdate = false): Promise<boolean> => {
    setIsValidating(true);
    setValidationErrors([]);

    try {
      const errors = await userValidationService.validateUser(userData, isUpdate);
      setValidationErrors(errors);

      if (errors.length > 0) {
        if (showToasts) {
          errors.forEach((error) => {
            toast({
              title: "Validation Error",
              description: error.message,
              variant: "destructive"
            });
          });
        }
        onValidationError?.(errors);
        return false;
      } else {
        if (showToasts) {
          toast({
            title: "Validation Passed",
            description: "User data is valid",
            variant: "default"
          });
        }
        onValidationSuccess?.();
        return true;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Validation failed';
      if (showToasts) {
        toast({
          title: "Validation Error",
          description: errorMsg,
          variant: "destructive"
        });
      }
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [toast, showToasts, onValidationError, onValidationSuccess]);

  const validateEmail = useCallback(async (email: string, userId?: number): Promise<boolean> => {
    setIsValidating(true);

    try {
      const errors = await userValidationService.validateUser({ email, id: userId }, !!userId);
      const emailErrors = errors.filter((e) => e.type === 'email');

      if (emailErrors.length > 0) {
        if (showToasts) {
          emailErrors.forEach((error) => {
            toast({
              title: "Email Validation Error",
              description: error.message,
              variant: "destructive"
            });
          });
        }
        return false;
      }
      return true;
    } catch (error) {
      if (showToasts) {
        toast({
          title: "Email Validation Error",
          description: "Failed to validate email",
          variant: "destructive"
        });
      }
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [toast, showToasts]);

  const checkRoleConflicts = useCallback(async (role: string, station: string, excludeUserId?: number): Promise<any[]> => {
    try {
      return await userValidationService.getRoleConflicts(role, station, excludeUserId);
    } catch (error) {
      console.error('Error checking role conflicts:', error);
      return [];
    }
  }, []);

  const validateBulkOperation = useCallback(async (
  users: UserData[],
  operation: 'create' | 'update' | 'delete')
  : Promise<{[userId: string]: UserValidationError[];}> => {
    setIsValidating(true);

    try {
      const results = await userValidationService.validateBulkOperation(users, operation);

      // Show summary toast
      const totalErrors = Object.values(results).reduce((sum, errors) => sum + errors.length, 0);
      const totalUsers = users.length;

      if (showToasts) {
        if (totalErrors > 0) {
          toast({
            title: "Bulk Validation Results",
            description: `${totalErrors} errors found across ${totalUsers} users`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Bulk Validation Passed",
            description: `All ${totalUsers} users passed validation`,
            variant: "default"
          });
        }
      }

      return results;
    } catch (error) {
      if (showToasts) {
        toast({
          title: "Bulk Validation Error",
          description: "Failed to validate users",
          variant: "destructive"
        });
      }
      return {};
    } finally {
      setIsValidating(false);
    }
  }, [toast, showToasts]);

  const canDeleteUser = useCallback(async (userId: number, userEmail?: string): Promise<boolean> => {
    try {
      const errors = await userValidationService.canDeleteUser(userId, userEmail);

      if (errors.length > 0) {
        if (showToasts) {
          errors.forEach((error) => {
            toast({
              title: "Delete Validation Error",
              description: error.message,
              variant: "destructive"
            });
          });
        }
        return false;
      }
      return true;
    } catch (error) {
      if (showToasts) {
        toast({
          title: "Delete Validation Error",
          description: "Failed to validate user deletion",
          variant: "destructive"
        });
      }
      return false;
    }
  }, [toast, showToasts]);

  const getValidationErrorsByField = useCallback((field: string): UserValidationError[] => {
    return validationErrors.filter((error) => error.field === field);
  }, [validationErrors]);

  const hasValidationErrors = validationErrors.length > 0;
  const hasEmailErrors = validationErrors.some((e) => e.type === 'email');
  const hasRoleErrors = validationErrors.some((e) => e.type === 'role');
  const hasAdminProtectionErrors = validationErrors.some((e) => e.type === 'admin_protection');

  return {
    // State
    isValidating,
    validationErrors,
    hasValidationErrors,
    hasEmailErrors,
    hasRoleErrors,
    hasAdminProtectionErrors,

    // Methods
    validateUser,
    validateEmail,
    checkRoleConflicts,
    validateBulkOperation,
    canDeleteUser,
    getValidationErrorsByField,

    // Utils
    clearErrors: () => setValidationErrors([])
  };
}