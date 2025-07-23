import { useState, useEffect, useCallback } from 'react';
import { stationService, Station, StationOption } from '@/services/stationService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface StationStore {
  stations: Station[];
  stationOptions: StationOption[];
  loading: boolean;
  error: string | null;
  lastUpdated: number;
}

// Global station store state
let globalStationStore: StationStore = {
  stations: [],
  stationOptions: [],
  loading: false,
  error: null,
  lastUpdated: 0
};

// Subscribers for real-time updates across components
type StoreSubscriber = (store: StationStore) => void;
const subscribers = new Set<StoreSubscriber>();

/**
 * Subscribe to station store changes
 */
const subscribe = (callback: StoreSubscriber): (() => void) => {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
};

/**
 * Notify all subscribers of store changes
 */
const notifySubscribers = () => {
  subscribers.forEach((callback) => callback(globalStationStore));
};

/**
 * Update the global station store
 */
const updateStore = (updates: Partial<StationStore>) => {
  globalStationStore = { ...globalStationStore, ...updates };
  notifySubscribers();
};

/**
 * Enhanced station management hook with real-time updates
 * Provides centralized station state management across the entire application
 */
export const useStationStore = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [localStore, setLocalStore] = useState<StationStore>(globalStationStore);

  // Subscribe to global store changes
  useEffect(() => {
    const unsubscribe = subscribe(setLocalStore);
    return unsubscribe;
  }, []);

  /**
   * Load stations from service and update global store
   */
  const loadStations = useCallback(async (forceRefresh: boolean = false) => {
    if (localStore.loading) return;

    // Check if data is fresh (within 2 minutes) unless force refresh
    const isDataFresh = Date.now() - localStore.lastUpdated < 120000;
    if (!forceRefresh && isDataFresh && localStore.stations.length > 0) {
      return;
    }

    updateStore({ loading: true, error: null });

    try {
      // Load stations and station options in parallel
      const permissionsArray = (() => {
        if (!userProfile?.detailed_permissions) return [];
        if (typeof userProfile.detailed_permissions === 'string') {
          try {
            const parsed = JSON.parse(userProfile.detailed_permissions);
            if (Array.isArray(parsed)) return parsed;
            return [];
          } catch {
            return [];
          }
        }
        if (Array.isArray(userProfile.detailed_permissions)) return userProfile.detailed_permissions;
        return [];
      })();

      const [stations, stationOptions] = await Promise.all([
        stationService.getStations(),
        stationService.getStationOptions(true, userProfile?.role, permissionsArray)
      ]);

      updateStore({
        stations,
        stationOptions,
        loading: false,
        error: null,
        lastUpdated: Date.now()
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load stations';
      updateStore({
        loading: false,
        error: errorMessage
      });

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  }, [userProfile?.role, userProfile?.detailed_permissions, toast, localStore.loading, localStore.lastUpdated, localStore.stations.length]);

  /**
   * Add a new station and refresh the global store
   * This ensures all dropdowns are instantly updated
   */
  const addStation = useCallback(async (stationData: Omit<Station, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      updateStore({ loading: true, error: null });

      // Check for duplicate station name
      const existingStation = localStore.stations.find(
        s => (s.station_name?.toLowerCase() ?? '') === (stationData.station_name?.toLowerCase() ?? '') ||
             (s.station_name?.toLowerCase() ?? '') === (stationData.station_name?.toLowerCase() ?? '')
      );

      if (existingStation) {
        throw new Error(`Station "${stationData.name}" already exists`);
      }

      const result = await stationService.addStation(stationData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to add station');
      }

      // Force refresh to get the new station with its assigned ID
      await loadStations(true);

      toast({
        title: "Success",
        description: `Station "${stationData.name}" added successfully and is now available in all dropdowns`,
      });

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to add station';
      updateStore({ loading: false, error: errorMessage });

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });

      return { success: false, error: errorMessage };
    }
  }, [localStore.stations, loadStations, toast]);

  /**
   * Update station and refresh global store
   */
  const updateStation = useCallback(async (stationData: Station) => {
    try {
      updateStore({ loading: true, error: null });

      const result = await stationService.updateStation(stationData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update station');
      }

      await loadStations(true);

      toast({
        title: "Success",
        description: `Station "${stationData.name}" updated successfully`,
      });

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update station';
      updateStore({ loading: false, error: errorMessage });

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });

      return { success: false, error: errorMessage };
    }
  }, [loadStations, toast]);

  /**
   * Delete station and refresh global store
   */
  const deleteStation = useCallback(async (stationId: number) => {
    try {
      updateStore({ loading: true, error: null });

      const result = await stationService.deleteStation(stationId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete station');
      }

      await loadStations(true);

      toast({
        title: "Success",
        description: "Station deleted successfully",
      });

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete station';
      updateStore({ loading: false, error: errorMessage });

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });

      return { success: false, error: errorMessage };
    }
  }, [loadStations, toast]);

  /**
   * Get filtered station options based on user permissions
   */
  const getFilteredStationOptions = useCallback((includeAll: boolean = true): StationOption[] => {
    let options = [...localStore.stationOptions];

    // Always include "All Stations" option if user has permission and includeAll is true
    const permissionsArray = (() => {
      if (!userProfile?.detailed_permissions) return [];
      if (typeof userProfile.detailed_permissions === 'string') {
        try {
          const parsed = JSON.parse(userProfile.detailed_permissions);
          if (Array.isArray(parsed)) return parsed;
          return [];
        } catch {
          return [];
        }
      }
      if (Array.isArray(userProfile.detailed_permissions)) return userProfile.detailed_permissions;
      return [];
    })();

    const canSelectAll = userProfile?.role === 'Administrator' ||
                        userProfile?.role === 'Management' ||
                        userProfile?.role === 'Manager' ||
                        permissionsArray.includes('view_all_stations');

    if (includeAll && canSelectAll) {
      // Ensure "All Stations" is at the top
      const allStationsOption: StationOption = {
        value: 'ALL',
        label: 'All Stations',
        color: 'bg-indigo-600'
      };

      // Remove any existing "All Stations" option and add it at the top
      options = options.filter(opt => opt.value !== 'ALL');
      options.unshift(allStationsOption);
    }

    return options;
  }, [localStore.stationOptions, userProfile?.role, userProfile?.detailed_permissions]);

  /**
   * Initialize store if not already loaded
   */
  useEffect(() => {
    if (localStore.stations.length === 0 && !localStore.loading) {
      loadStations();
    }
  }, [localStore.stations.length, localStore.loading, loadStations]);

  return {
    // State
    stations: localStore.stations,
    stationOptions: localStore.stationOptions,
    loading: localStore.loading,
    error: localStore.error,

    // Actions
    loadStations,
    addStation,
    updateStation,
    deleteStation,

    // Helpers
    getFilteredStationOptions,
    isDataFresh: Date.now() - localStore.lastUpdated < 120000,

    // Utility functions
    getStationColor: stationService.getStationColor.bind(stationService),
  canSelectAll: () => {
    const permissionsArray = (() => {
      if (!userProfile?.detailed_permissions) return [];
      if (typeof userProfile.detailed_permissions === 'string') {
        try {
          const parsed = JSON.parse(userProfile.detailed_permissions);
          if (Array.isArray(parsed)) return parsed;
          return [];
        } catch {
          return [];
        }
      }
      if (Array.isArray(userProfile.detailed_permissions)) return userProfile.detailed_permissions;
      return [];
    })();

    return userProfile?.role === 'Administrator' ||
           userProfile?.role === 'Management' ||
           userProfile?.role === 'Manager' ||
           permissionsArray.includes('view_all_stations') || false;
  }
  };
};

export default useStationStore;
