import { useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStationOptions as useStationOptionsFromService, useStationFilter as useStationFilterFromService } from '@/hooks/use-station-service';
import { safeArrayIncludes } from '@/utils/safeIncludes';

export interface StationOption {
  value: string;
  label: string;
  color?: string;
}

/**
 * Hook to get station options based on user permissions
 * Now uses the centralized station service for consistency
 * Automatically includes 'ALL' option for users with appropriate permissions
 */
export const useStationOptions = (includeAll: boolean = true) => {
  const { userProfile } = useAuth();
  const { stationOptions, loading, error, getStationColor, canSelectAll, getUserAccessibleStations, refetch } = useStationOptionsFromService(includeAll);

  // Legacy support - convert to previous format
  const legacyStationOptions: StationOption[] = useMemo(() => {
    return stationOptions.map((option) => ({
      value: option.value,
      label: option.label,
      color: option.color
    }));
  }, [stationOptions]);

  const getAllStations = useCallback(async (): Promise<string[]> => {
    try {
      return await getUserAccessibleStations();
    } catch (error) {
      console.error('Error getting accessible stations:', error);
      return [];
    }
  }, [getUserAccessibleStations]);

  const getUserAccessibleStationsSync = useMemo(() => {
    // This is a temporary sync version for backward compatibility
    // Components should gradually migrate to the async version
    if (canSelectAll) {
      // Return all station names from the centralized service
      return stationOptions.filter(opt => opt.value !== 'ALL').map(opt => opt.value);
    }

    // Filter stations based on user's specific station permissions
    const accessibleStations = [];
    const permissions = userProfile?.permissions;
    const stationAccess = userProfile?.stationAccess;
    
    // Check permissions for each available station dynamically
    stationOptions.forEach(option => {
      if (option.value === 'ALL') return; // Skip the ALL option
      
      const stationValue = option.value;
      const permissionKey = `view_${stationValue.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`;
      
      if ((Array.isArray(permissions) && permissions.includes(permissionKey)) ||
          (Array.isArray(stationAccess) && stationAccess.includes(stationValue))) {
        accessibleStations.push(stationValue);
      }
    });

    return accessibleStations;
  }, [userProfile?.role, userProfile?.permissions, userProfile?.stationAccess, canSelectAll, stationOptions]);

  return {
    stationOptions: legacyStationOptions,
    getStationColor,
    canSelectAll,
    allStations: stationOptions.filter(opt => opt.value !== 'ALL').map(opt => opt.value), // Dynamic all stations
    getUserAccessibleStations: getUserAccessibleStationsSync,
    getUserAccessibleStationsAsync: getAllStations,
    loading,
    error,
    refetch
  };
};

/**
 * Hook for filtering logic when 'ALL' is selected
 * Now uses the centralized station service
 */
export const useStationFilter = (selectedStation: string) => {
  return useStationFilterFromService(selectedStation);
};

export default useStationOptions;