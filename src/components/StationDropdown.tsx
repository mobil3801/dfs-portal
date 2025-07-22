import React from 'react';
import { useStationStore } from '@/hooks/use-station-store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface StationDropdownProps {
  id?: string;
  label?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  includeAll?: boolean; // Whether to include "All Station" option
  disabled?: boolean;
}

/**
 * StationDropdown component
 * - Uses global station store for options
 * - Includes "All Station" option at the top if includeAll is true
 * - Prevents duplicate station names
 * - Selecting "All Station" means access to all stations
 */
const StationDropdown: React.FC<StationDropdownProps> = ({
  id,
  label,
  value,
  onValueChange,
  placeholder,
  required = false,
  includeAll = true,
  disabled = false,
}) => {
  const { getFilteredStationOptions } = useStationStore();

  // Get station options with "All Station" included if applicable
  const options = getFilteredStationOptions(includeAll);

  return (
    <div className="w-full">
      {label && (
        <Label htmlFor={id} className="block mb-1 font-medium text-sm">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Select
        id={id}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        aria-required={required}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder || 'Select a station'} />
        </SelectTrigger>
        <SelectContent>
          {options.map((station) => (
            <SelectItem key={station.value} value={station.value}>
              {station.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default StationDropdown;
