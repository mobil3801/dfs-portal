import * as React from "react"
import { cn } from "@/lib/utils"
import { useSmartZero } from "@/hooks/use-smart-zero"

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: number | string
  onChange?: (value: number) => void
  onValueChange?: (value: string) => void
  allowNegative?: boolean
  precision?: number
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, type = "number", value: propValue, onChange, onValueChange, allowNegative = false, precision = 2, ...props }, ref) => {
    const smartZero = useSmartZero(propValue);

    // Update internal value when prop changes
    React.useEffect(() => {
      if (propValue !== undefined && propValue !== smartZero.getNumericValue()) {
        smartZero.resetValue(propValue);
      }
    }, [propValue]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      
      // Allow empty string for intermediate states
      if (newValue === '') {
        smartZero.handleChange(newValue);
        if (onChange) {
          onChange(0);
        }
        if (onValueChange) {
          onValueChange(newValue);
        }
        return;
      }
      
      // Allow negative sign at the beginning if allowNegative is true
      if (allowNegative && newValue === '-') {
        smartZero.handleChange(newValue);
        if (onValueChange) {
          onValueChange(newValue);
        }
        return;
      }
      
      // Parse and validate the numeric value
      const numericValue = parseFloat(newValue);
      
      // Check if it's a valid number
      if (!isNaN(numericValue)) {
        // Check negative value restrictions
        if (!allowNegative && numericValue < 0) {
          return; // Don't update if negative values are not allowed
        }
        
        // Apply precision limit
        const precisionLimitedValue = precision !== undefined ? 
          Math.round(numericValue * Math.pow(10, precision)) / Math.pow(10, precision) : 
          numericValue;
        
        smartZero.handleChange(newValue);
        
        // Call onChange with numeric value
        if (onChange) {
          onChange(precisionLimitedValue);
        }
        
        // Call onValueChange with string value for more control
        if (onValueChange) {
          onValueChange(newValue);
        }
      } else {
        // For intermediate states like "-0." or "1." allow the string but don't call onChange
        const intermediatePattern = allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/;
        if (intermediatePattern.test(newValue)) {
          smartZero.handleChange(newValue);
          if (onValueChange) {
            onValueChange(newValue);
          }
        }
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow backspace, delete, tab, escape, enter, and arrow keys
      if ([8, 9, 27, 13, 46, 37, 39, 38, 40].includes(e.keyCode)) {
        return;
      }
      
      // Allow negative sign at the beginning if allowNegative is true
      if (allowNegative && e.key === '-' && e.currentTarget.selectionStart === 0) {
        return;
      }
      
      // Allow decimal point
      if (e.key === '.' && !e.currentTarget.value.includes('.')) {
        return;
      }
      
      // Allow digits
      if (e.key >= '0' && e.key <= '9') {
        return;
      }
      
      // Prevent all other keys
      e.preventDefault();
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        value={smartZero.displayValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={smartZero.handleFocus}
        onBlur={smartZero.handleBlur}
        {...props}
      />
    )
  }
)
NumberInput.displayName = "NumberInput"

export { NumberInput }
