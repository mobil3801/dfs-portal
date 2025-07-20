import { useState, useCallback } from 'react';
import { sanitizeUserInput, sanitizeTextContent, sanitizeElementId } from '@/utils/sanitizeHelper';

interface UseSafeFormOptions {
  onSubmit?: (data: any) => void;
  validateOnChange?: boolean;
  sanitizeOnChange?: boolean;
}

export const useSafeForm = <T extends Record<string, any>,>(
initialData: T,
options: UseSafeFormOptions = {}) =>
{
  const { onSubmit, validateOnChange = true, sanitizeOnChange = true } = options;

  const [formData, setFormData] = useState<T>(sanitizeUserInput(initialData) as T);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback((field: string, value: any): string | null => {
    // Basic validation for invalid characters
    if (typeof value === 'string') {
      // Check for problematic characters that could cause InvalidCharacterError
      const problemChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/;
      if (problemChars.test(value)) {
        return 'Invalid characters detected. Please remove special characters.';
      }

      // Check for excessive length that might cause issues
      if (value.length > 10000) {
        return 'Input is too long. Please shorten your text.';
      }
    }

    return null;
  }, []);

  const updateField = useCallback((field: keyof T, value: any) => {
    let processedValue = value;

    // Sanitize the value if enabled
    if (sanitizeOnChange && typeof value === 'string') {
      processedValue = sanitizeTextContent(value);
    }

    // Validate the field if enabled
    if (validateOnChange) {
      const error = validateField(field as string, processedValue);
      setErrors((prev) => ({
        ...prev,
        [field]: error || ''
      }));
    }

    setFormData((prev) => ({
      ...prev,
      [field]: processedValue
    }));
  }, [sanitizeOnChange, validateOnChange, validateField]);

  const updateFields = useCallback((updates: Partial<T>) => {
    const sanitizedUpdates = sanitizeOnChange ? sanitizeUserInput(updates) : updates;

    if (validateOnChange) {
      const newErrors: Record<string, string> = {};
      Object.entries(sanitizedUpdates).forEach(([field, value]) => {
        const error = validateField(field, value);
        if (error) {
          newErrors[field] = error;
        }
      });
      setErrors((prev) => ({ ...prev, ...newErrors }));
    }

    setFormData((prev) => ({ ...prev, ...sanitizedUpdates }));
  }, [sanitizeOnChange, validateOnChange, validateField]);

  const resetForm = useCallback(() => {
    setFormData(sanitizeUserInput(initialData) as T);
    setErrors({});
    setIsSubmitting(false);
  }, [initialData]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.entries(formData).forEach(([field, value]) => {
      const error = validateField(field, value);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, validateField]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!validateForm()) {
      return false;
    }

    setIsSubmitting(true);

    try {
      // Final sanitization before submission
      const sanitizedData = sanitizeUserInput(formData);

      if (onSubmit) {
        await onSubmit(sanitizedData);
      }

      return true;
    } catch (error) {
      console.error('Form submission error:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSubmit]);

  const getFieldProps = useCallback((field: keyof T) => {
    return {
      value: formData[field] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        updateField(field, e.target.value);
      },
      onBlur: () => {
        if (validateOnChange) {
          const error = validateField(field as string, formData[field]);
          setErrors((prev) => ({
            ...prev,
            [field]: error || ''
          }));
        }
      },
      id: sanitizeElementId(`field-${String(field)}`),
      'aria-invalid': !!errors[field as string],
      'aria-describedby': errors[field as string] ? `${sanitizeElementId(`field-${String(field)}`)}-error` : undefined
    };
  }, [formData, errors, updateField, validateField, validateOnChange]);

  const getSelectProps = useCallback((field: keyof T) => {
    return {
      value: formData[field] || '',
      onValueChange: (value: string) => {
        updateField(field, value);
      },
      'aria-invalid': !!errors[field as string],
      'aria-describedby': errors[field as string] ? `${sanitizeElementId(`field-${String(field)}`)}-error` : undefined
    };
  }, [formData, errors, updateField]);

  const hasErrors = Object.values(errors).some((error) => !!error);

  return {
    formData,
    errors,
    isSubmitting,
    hasErrors,
    updateField,
    updateFields,
    resetForm,
    validateForm,
    handleSubmit,
    getFieldProps,
    getSelectProps
  };
};

export default useSafeForm;