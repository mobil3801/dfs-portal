import { useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStationOptions as useStationOptionsFromService, useStationFilter as useStationFilterFromService } from '@/hooks/use-station-service';

export interface StationOption {
  value: string;
  label: string;
  color?: string;
}

/**
 * Hook to get station options based on user permissions
 * Now uses the centralized station service for consistency
 * Automatically includes 'ALL_STATIONS' option for users with appropriate permissions
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
      return ['MOBIL', 'AMOCO ROSEDALE', 'AMOCO BROOKLYN'];
    }

    // Filter stations based on user's specific station permissions
    const accessibleStations = [];
    if (userProfile?.permissions?.includes('view_mobil') || userProfile?.stationAccess?.includes('MOBIL')) {
      accessibleStations.push('MOBIL');
    }
    if (userProfile?.permissions?.includes('view_amoco_rosedale') || userProfile?.stationAccess?.includes('AMOCO ROSEDALE')) {
      accessibleStations.push('AMOCO ROSEDALE');
    }
    if (userProfile?.permissions?.includes('view_amoco_brooklyn') || userProfile?.stationAccess?.includes('AMOCO BROOKLYN')) {
      accessibleStations.push('AMOCO BROOKLYN');
    }

    return accessibleStations;
  }, [userProfile?.role, userProfile?.permissions, userProfile?.stationAccess, canSelectAll]);

  return {
    stationOptions: legacyStationOptions,
    getStationColor,
    canSelectAll,
    allStations: ['MOBIL', 'AMOCO ROSEDALE', 'AMOCO BROOKLYN'],
    getUserAccessibleStations: getUserAccessibleStationsSync,
    getUserAccessibleStationsAsync: getAllStations,
    loading,
    error,
    refetch
  };
};

/**
 * Hook for filtering logic when 'ALL_STATIONS' is selected
 * Now uses the centralized station service
 */
export const useStationFilter = (selectedStation: string) => {
  return useStationFilterFromService(selectedStation);
};

export default useStationOptions;