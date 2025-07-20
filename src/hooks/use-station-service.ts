import { useState, useEffect, useCallback } from 'react';
import { stationService, Station, StationOption } from '@/services/stationService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to get stations from the centralized station service
 */
export const useStations = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadStations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const stationsData = await stationService.getStations();
      setStations(stationsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load stations';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadStations();
  }, [loadStations]);

  return {
    stations,
    loading,
    error,
    refetch: loadStations
  };
};

/**
 * Hook to get station options for dropdowns
 */
export const useStationOptions = (includeAll: boolean = true) => {
  const { userProfile } = useAuth();
  const [stationOptions, setStationOptions] = useState<StationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStationOptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const options = await stationService.getStationOptions(
        includeAll,
        userProfile?.role,
        userProfile?.permissions
      );

      setStationOptions(options);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load station options';
      setError(errorMessage);
      setStationOptions([]);
    } finally {
      setLoading(false);
    }
  }, [includeAll, userProfile?.role, userProfile?.permissions]);

  useEffect(() => {
    loadStationOptions();
  }, [loadStationOptions]);

  // Helper functions
  const getStationColor = useCallback((stationName: string): string => {
    return stationService.getStationColor(stationName);
  }, []);

  const canSelectAll = useCallback((): boolean => {
    const userRole = userProfile?.role;
    const userPermissions = userProfile?.permissions;

    return userRole === 'Administrator' ||
    userRole === 'Management' ||
    userRole === 'Manager' ||
    userPermissions?.includes('view_all_stations') || false;
  }, [userProfile?.role, userProfile?.permissions]);

  const getUserAccessibleStations = useCallback(async (): Promise<string[]> => {
    try {
      return await stationService.getUserAccessibleStations(
        userProfile?.role,
        userProfile?.permissions,
        userProfile?.stationAccess
      );
    } catch (err) {
      console.error('Error getting accessible stations:', err);
      return [];
    }
  }, [userProfile?.role, userProfile?.permissions, userProfile?.stationAccess]);

  return {
    stationOptions,
    loading,
    error,
    getStationColor,
    canSelectAll: canSelectAll(),
    getUserAccessibleStations,
    refetch: loadStationOptions
  };
};

/**
 * Hook for filtering logic when 'ALL_STATIONS' is selected
 */
export const useStationFilter = (selectedStation: string) => {
  const { userProfile } = useAuth();
  const [accessibleStations, setAccessibleStations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAccessibleStations = async () => {
      try {
        setLoading(true);
        const stations = await stationService.getUserAccessibleStations(
          userProfile?.role,
          userProfile?.permissions,
          userProfile?.stationAccess
        );
        setAccessibleStations(stations);
      } catch (err) {
        console.error('Error loading accessible stations:', err);
        setAccessibleStations([]);
      } finally {
        setLoading(false);
      }
    };

    loadAccessibleStations();
  }, [userProfile?.role, userProfile?.permissions, userProfile?.stationAccess]);

  const getStationFilters = useCallback(() => {
    if (selectedStation === 'ALL_STATIONS' || selectedStation === 'ALL') {
      if (accessibleStations.length === 0) {
        return [{ name: 'station', op: 'Equal', value: '__NO_ACCESS__' }];
      }

      if (accessibleStations.length === 1) {
        return [{ name: 'station', op: 'Equal', value: accessibleStations[0] }];
      }

      // For multiple stations, return null to indicate no filtering
      return null;
    }

    return [{ name: 'station', op: 'Equal', value: selectedStation }];
  }, [selectedStation, accessibleStations]);

  const shouldFilterByStation = selectedStation && selectedStation !== 'ALL_STATIONS' && selectedStation !== 'ALL';

  const getAccessibleStationsFilter = useCallback(() => {
    return accessibleStations.map((station) => ({
      name: 'station',
      op: 'Equal',
      value: station
    }));
  }, [accessibleStations]);

  return {
    stationFilters: getStationFilters(),
    shouldFilterByStation,
    isAllSelected: selectedStation === 'ALL_STATIONS' || selectedStation === 'ALL',
    accessibleStations,
    accessibleStationsFilter: getAccessibleStationsFilter(),
    loading
  };
};

/**
 * Hook for managing station data (CRUD operations)
 */
export const useStationManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const addStation = useCallback(async (stationData: Omit<Station, 'id'>) => {
    try {
      setLoading(true);
      const result = await stationService.addStation(stationData);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Station added successfully'
        });
        return { success: true };
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to add station',
          variant: 'destructive'
        });
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add station';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateStation = useCallback(async (stationData: Station) => {
    try {
      setLoading(true);
      const result = await stationService.updateStation(stationData);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Station updated successfully'
        });
        return { success: true };
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update station',
          variant: 'destructive'
        });
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update station';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteStation = useCallback(async (stationId: number) => {
    try {
      setLoading(true);
      const result = await stationService.deleteStation(stationId);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Station deleted successfully'
        });
        return { success: true };
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete station',
          variant: 'destructive'
        });
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete station';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const clearCache = useCallback(() => {
    stationService.clearCache();
    toast({
      title: 'Cache Cleared',
      description: 'Station cache has been cleared'
    });
  }, [toast]);

  return {
    addStation,
    updateStation,
    deleteStation,
    clearCache,
    loading
  };
};

export default useStationOptions;