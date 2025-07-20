import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useStationOptions } from '@/hooks/use-station-service';
import { Building2, Eye, Loader2 } from 'lucide-react';

interface StationDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  includeAll?: boolean;
  showBadge?: boolean;
  className?: string;
  id?: string;
}

const StationDropdown: React.FC<StationDropdownProps> = ({
  value,
  onValueChange,
  placeholder = "Select station",
  label,
  required = false,
  disabled = false,
  includeAll = true,
  showBadge = false,
  className = "",
  id
}) => {
  const { stationOptions, getStationColor, canSelectAll, getUserAccessibleStations, loading } = useStationOptions(includeAll);
  const [accessibleStationsCount, setAccessibleStationsCount] = useState(0);

  useEffect(() => {
    const loadAccessibleStations = async () => {
      try {
        const stations = await getUserAccessibleStations();
        setAccessibleStationsCount(stations.length);
      } catch (error) {
        console.error('Error loading accessible stations count:', error);
        setAccessibleStationsCount(0);
      }
    };

    loadAccessibleStations();
  }, [getUserAccessibleStations]);

  const getDisplayValue = (currentValue: string) => {
    if (!currentValue) return null;

    // Handle legacy 'ALL' value
    if (currentValue === 'ALL') {
      return (
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-indigo-600" />
          <span>All Stations</span>
          {showBadge &&
          <Badge className="text-white bg-indigo-600">
              All ({accessibleStationsCount})
            </Badge>
          }
        </div>);

    }

    if (currentValue === 'ALL_STATIONS') {
      return (
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-indigo-600" />
          <span>All Stations</span>
          {showBadge &&
          <Badge className="text-white bg-indigo-600">
              All ({accessibleStationsCount})
            </Badge>
          }
        </div>);

    }

    const station = stationOptions.find((opt) => opt.value === currentValue);
    if (station && showBadge) {
      return (
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4" />
          <Badge className={`text-white ${getStationColor(currentValue)}`}>
            {station.label}
          </Badge>
        </div>);

    }

    return station?.label || currentValue;
  };

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {label &&
        <Label htmlFor={id}>
            {label}
            {required && ' *'}
          </Label>
        }
        <div className="flex items-center space-x-2 p-2 border rounded-md">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm text-gray-500">Loading stations...</span>
        </div>
      </div>);

  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label &&
      <Label htmlFor={id}>
          {label}
          {required && ' *'}
        </Label>
      }
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}>

        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder}>
            {value ? getDisplayValue(value) : placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {stationOptions.map((station) =>
          <SelectItem key={station.value} value={station.value}>
              <div className="flex items-center space-x-2 w-full">
                {station.value === 'ALL_STATIONS' ?
              <>
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium text-indigo-700">{station.label}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {accessibleStationsCount} stations
                        </Badge>
                        <span className="text-xs text-gray-500">(View All)</span>
                      </div>
                    </div>
                  </> :

              <>
                    <Building2 className="w-4 h-4" />
                    {showBadge &&
                <div className={`w-3 h-3 rounded-full ${station.color}`} />
                }
                    <span>{station.label}</span>
                  </>
              }
              </div>
            </SelectItem>
          )}
          
          {/* Show accessible stations info when All Station option is available */}
          {canSelectAll && includeAll &&
          <div className="px-2 py-1 text-xs text-gray-500 border-t border-gray-100">
              <div className="flex items-center space-x-1">
                <Eye className="w-3 h-3" />
                <span>You have access to {accessibleStationsCount} station{accessibleStationsCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
          }
        </SelectContent>
      </Select>
    </div>);

};

export default StationDropdown;