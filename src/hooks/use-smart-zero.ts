import { useState, useCallback } from 'react';

export const useSmartZero = (initialValue: number | string = 0) => {
  const [value, setValue] = useState<string>(() => {
    // Handle initial value more carefully
    if (typeof initialValue === 'number') {
      return initialValue === 0 ? '0' : String(initialValue);
    }
    return String(initialValue || 0);
  });
  const [isFocused, setIsFocused] = useState(false);
  const [hasUserInput, setHasUserInput] = useState(false);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // If the value is "0" and user hasn't manually entered it, clear it
    if (value === '0' && !hasUserInput) {
      setValue('');
    }
  }, [value, hasUserInput]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // If empty or just whitespace or just a negative sign, default to "0"
    if (!value.trim() || value === '-' || value === '.') {
      setValue('0');
      setHasUserInput(false);
    } else {
      // Ensure the value is a valid number
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        // Keep the decimal formatting that user entered
        setValue(value);
        setHasUserInput(true);
      } else {
        setValue('0');
        setHasUserInput(false);
      }
    }
  }, [value]);

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
    setHasUserInput(true);
  }, []);

  const getNumericValue = useCallback(() => {
    const numValue = parseFloat(value);
    return isNaN(numValue) ? 0 : numValue;
  }, [value]);

  const resetValue = useCallback((newValue: number | string = 0) => {
    let stringValue: string;

    if (typeof newValue === 'number') {
      stringValue = newValue === 0 ? '0' : String(newValue);
    } else {
      stringValue = String(newValue || 0);
    }

    setValue(stringValue);
    setHasUserInput(newValue !== 0 && newValue !== '0');
  }, []);

  return {
    value,
    isFocused,
    handleFocus,
    handleBlur,
    handleChange,
    getNumericValue,
    resetValue,
    displayValue: isFocused && value === '' ? '' : value
  };
};