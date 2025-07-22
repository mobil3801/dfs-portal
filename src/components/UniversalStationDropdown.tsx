import React, { useEffect, useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useStationStore } from '@/hooks/use-station-store';
import { Building2, Eye, Loader2, Globe, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UniversalStationDropdownProps {
  /** Current selected value */
  value: string;
  /** Callback when selection changes */
  onValueChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Label text */
  label?: string;
  /** Whether field is required */
  required?: boolean;
  /** Whether dropdown is disabled */
  disabled?: boolean;
  /** Whether to include "All Stations" option */
  includeAll?: boolean;
  /** Whether to show colored badges for stations */
  showBadge?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** HTML id attribute */
  id?: string;
  /** Helper text or description */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Universal Station Dropdown Component
 * 
 * Features:
 * - Automatically includes "All Stations" option for authorized users
 * - Real-time updates when new stations are added
 * - Prevents duplicate station names
 * - Consistent styling and UX across the app
 * - Permission-based access control
 * - Visual indicators for station count and access level
 * 
 * UX Improvements:
 * - Station icons and color coding
 * - Access level indicators
 * - Loading states with skeleton
 * - Error handling with retry options
 * - Responsive design
 */
const UniversalStationDropdown: React.FC<UniversalStationDropdownProps> = ({
  value,
  onValueChange,
  placeholder = "Select station",
  label,
  required = false,
  disabled = false,
  includeAll = true,
  showBadge = false,
  className = "",
  id,
  helperText,
  error,
  size = 'md'
}) => {
  const { 
    stationOptions, 
    loading, 
    error: storeError, 
    getFilteredStationOptions, 
    canSelectAll,
    loadStations
  } = useStationStore();
  
  const [accessibleStationsCount, setAccessibleStationsCount] = useState(0);

  // Get filtered options based on permissions and includeAll setting
  const filteredOptions = useMemo(() => {
    return getFilteredStationOptions(includeAll);
  }, [getFilteredStationOptions, includeAll]);

  // Calculate accessible stations count for "All Stations" badge
  useEffect(() => {
    const nonAllOptions = filteredOptions.filter(opt => 
      opt.value !== 'ALL_STATIONS' && opt.value !== 'ALL'
    );
    setAccessibleStationsCount(nonAllOptions.length);
  }, [filteredOptions]);

  /**
   * Get display value with appropriate styling and badges
   */
  const getDisplayValue = (currentValue: string) => {
    if (!currentValue) return null;

    // Handle "All Stations" option
    if (currentValue === 'ALL_STATIONS' || currentValue === 'ALL') {
      return (
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-indigo-600" />
          <span className="font-medium">All Stations</span>
          {showBadge && (
            <Badge className="bg-indigo-600 text-white text-xs">
              All ({accessibleStationsCount})
            </Badge>
          )}
        </div>
      );
    }

    // Handle specific station
    const station = filteredOptions.find(opt => opt.value === currentValue);
    if (station) {
      if (showBadge) {
        return (
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-gray-600" />
            <Badge className={cn(
              "text-white text-xs",
              station.color || "bg-gray-500"
            )}>
              {station.label}
            </Badge>
          </div>
        );
      }
      
      return (
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-gray-600" />
          <span>{station.label}</span>
        </div>
      );
    }

    return currentValue;
  };

  /**
   * Get size-specific classes
   */
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 text-sm';
      case 'lg':
        return 'h-12 text-lg';
      default:
        return 'h-10';
    }
  };

  // Handle loading state
  if (loading && filteredOptions.length === 0) {
    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label htmlFor={id} className="text-sm font-medium">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <div className={cn(
          "flex items-center space-x-2 p-2 border rounded-md bg-gray-50",
          getSizeClasses()
        )}>
          <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
          <span className="text-sm text-gray-500">Loading stations...</span>
        </div>
        {helperText && (
          <p className="text-xs text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }

  // Handle error state with retry option
  if (storeError && filteredOptions.length === 0) {
    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label htmlFor={id} className="text-sm font-medium">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">Failed to load stations</span>
            <button
              onClick={() => loadStations(true)}
              className="text-sm underline hover:no-underline"
            >
              Retry
            </button>
          </AlertDescription>
        </Alert>
        {helperText && (
          <p className="text-xs text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || loading}
      >
        <SelectTrigger 
          id={id} 
          className={cn(
            getSizeClasses(),
            error && "border-red-500 focus:border-red-500",
            "transition-colors"
          )}
        >
          <SelectValue placeholder={placeholder}>
            {value ? getDisplayValue(value) : placeholder}
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent className="max-h-60">
          {filteredOptions.map((station) => (
            <SelectItem 
              key={station.value} 
              value={station.value}
              className="cursor-pointer hover:bg-gray-50"
            >
              <div className="flex items-center space-x-2 w-full">
                {station.value === 'ALL_STATIONS' || station.value === 'ALL' ? (
                  <>
                    <Globe className="w-4 h-4 text-indigo-600" />
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium text-indigo-700">{station.label}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {accessibleStationsCount} stations
                        </Badge>
                        <span className="text-xs text-gray-500">(View All)</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4 text-gray-600" />
                    {showBadge && (
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        station.color || "bg-gray-400"
                      )} />
                    )}
                    <span>{station.label}</span>
                  </>
                )}
              </div>
            </SelectItem>
          ))}
          
          {/* Show accessible stations info when All Station option is available */}
          {canSelectAll() && includeAll && (
            <div className="px-2 py-1 text-xs text-gray-500 border-t border-gray-100">
              <div className="flex items-center space-x-1">
                <Eye className="w-3 h-3" />
                <span>You have access to {accessibleStationsCount} station{accessibleStationsCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}
        </SelectContent>
      </Select>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-500 flex items-center space-x-1">
          <AlertTriangle className="w-3 h-3" />
          <span>{error}</span>
        </p>
      )}

      {/* Helper text */}
      {helperText && !error && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}

      {/* Loading indicator when updating */}
      {loading && filteredOptions.length > 0 && (
        <p className="text-xs text-blue-600 flex items-center space-x-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Updating stations...</span>
        </p>
      )}
    </div>
  );
};

export default UniversalStationDropdown;
