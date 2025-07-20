export { default as UserValidationDisplay } from './UserValidationDisplay';
export { default as RoleConflictChecker } from './RoleConflictChecker';
export { default as EmailUniquenessChecker } from './EmailUniquenessChecker';
export { default as AdminProtectionAlert } from './AdminProtectionAlert';

// Re-export validation service and hooks
export { userValidationService } from '@/services/userValidationService';
export { useUserValidation } from '@/hooks/use-user-validation';
export type { UserValidationError, UserData } from '@/services/userValidationService';