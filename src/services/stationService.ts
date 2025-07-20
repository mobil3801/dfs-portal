import { toast } from '@/hooks/use-toast';

export interface Station {
  id: number;
  station_name: string;
  address: string;
  phone: string;
  operating_hours: string;
  manager_name: string;
  status: string;
  last_updated: string;
  created_by: number;
}

export interface StationOption {
  value: string;
  label: string;
  color?: string;
  station?: Station;
}

class StationService {
  private stationsCache: Station[] = [];
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private isLoading = false;

  // Fallback hardcoded stations for when database is unavailable
  private readonly FALLBACK_STATIONS: StationOption[] = [
  {
    value: 'MOBIL',
    label: 'MOBIL',
    color: 'bg-blue-500'
  },
  {
    value: 'AMOCO ROSEDALE',
    label: 'AMOCO ROSEDALE',
    color: 'bg-green-500'
  },
  {
    value: 'AMOCO BROOKLYN',
    label: 'AMOCO BROOKLYN',
    color: 'bg-purple-500'
  }];


  /**
   * Get all stations from database or cache
   */
  async getStations(): Promise<Station[]> {
    // Check cache first
    if (this.isCacheValid()) {
      return this.stationsCache;
    }

    if (this.isLoading) {
      // Wait for ongoing request
      await this.waitForLoading();
      return this.stationsCache;
    }

    this.isLoading = true;

    try {
      const { data, error } = await window.ezsite.apis.tablePage(12599, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'station_name',
        IsAsc: true,
        Filters: [
        { name: 'status', op: 'Equal', value: 'Active' }]

      });

      if (error) {
        console.error('Error loading stations from database:', error);
        // Use fallback stations
        return this.getFallbackStations();
      }

      this.stationsCache = data?.List || [];
      this.cacheTimestamp = Date.now();

      return this.stationsCache;
    } catch (error) {
      console.error('Error fetching stations:', error);
      return this.getFallbackStations();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Get station options for dropdowns
   */
  async getStationOptions(includeAll: boolean = false, userRole?: string, userPermissions?: string[]): Promise<StationOption[]> {
    const stations = await this.getStations();

    const options: StationOption[] = stations.map((station) => ({
      value: station.station_name,
      label: station.station_name,
      color: this.getStationColor(station.station_name),
      station: station
    }));

    // Add "All Stations" option if user has permission
    if (includeAll && this.canUserViewAll(userRole, userPermissions)) {
      options.unshift({
        value: 'ALL_STATIONS',
        label: 'All Stations',
        color: 'bg-indigo-600'
      });
    }

    return options;
  }

  /**
   * Get station names only (for backward compatibility)
   */
  async getStationNames(): Promise<string[]> {
    const stations = await this.getStations();
    return stations.map((station) => station.station_name);
  }

  /**
   * Get station by name
   */
  async getStationByName(name: string): Promise<Station | null> {
    const stations = await this.getStations();
    return stations.find((station) => station.station_name === name) || null;
  }

  /**
   * Get station color based on name
   */
  getStationColor(stationName: string): string {
    const colorMap: {[key: string]: string;} = {
      'MOBIL': 'bg-blue-500',
      'AMOCO ROSEDALE': 'bg-green-500',
      'AMOCO BROOKLYN': 'bg-purple-500'
    };
    return colorMap[stationName] || 'bg-gray-500';
  }

  /**
   * Check if user can view all stations
   */
  private canUserViewAll(userRole?: string, userPermissions?: string[]): boolean {
    if (!userRole) return false;

    return userRole === 'Administrator' ||
    userRole === 'Management' ||
    userRole === 'Manager' ||
    userPermissions?.includes('view_all_stations') || false;
  }

  /**
   * Get fallback stations when database is unavailable
   */
  private getFallbackStations(): Station[] {
    return this.FALLBACK_STATIONS.map((station, index) => ({
      id: index + 1,
      station_name: station.value,
      address: 'Address not available',
      phone: 'Phone not available',
      operating_hours: '24/7',
      manager_name: 'Manager not assigned',
      status: 'Active',
      last_updated: new Date().toISOString(),
      created_by: 0
    }));
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    return this.stationsCache.length > 0 &&
    Date.now() - this.cacheTimestamp < this.CACHE_DURATION;
  }

  /**
   * Wait for ongoing loading to complete
   */
  private async waitForLoading(): Promise<void> {
    while (this.isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Clear cache (useful for forcing refresh)
   */
  clearCache(): void {
    this.stationsCache = [];
    this.cacheTimestamp = 0;
  }

  /**
   * Add new station (invalidates cache)
   */
  async addStation(stationData: Omit<Station, 'id'>): Promise<{success: boolean;error?: string;}> {
    try {
      const { error } = await window.ezsite.apis.tableCreate(12599, stationData);

      if (error) {
        return { success: false, error };
      }

      // Clear cache to force refresh
      this.clearCache();

      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Update station (invalidates cache)
   */
  async updateStation(stationData: Station): Promise<{success: boolean;error?: string;}> {
    try {
      const { error } = await window.ezsite.apis.tableUpdate(12599, stationData);

      if (error) {
        return { success: false, error };
      }

      // Clear cache to force refresh
      this.clearCache();

      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Delete station (invalidates cache)
   */
  async deleteStation(stationId: number): Promise<{success: boolean;error?: string;}> {
    try {
      const { error } = await window.ezsite.apis.tableDelete(12599, { id: stationId });

      if (error) {
        return { success: false, error };
      }

      // Clear cache to force refresh
      this.clearCache();

      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get user accessible stations based on permissions
   */
  async getUserAccessibleStations(userRole?: string, userPermissions?: string[], userStationAccess?: string[]): Promise<string[]> {
    const stations = await this.getStations();
    const allStationNames = stations.map((station) => station.station_name);

    // Admin/Management can access all stations
    if (this.canUserViewAll(userRole, userPermissions)) {
      return allStationNames;
    }

    // Filter based on specific permissions
    const accessibleStations: string[] = [];

    for (const stationName of allStationNames) {
      const permissionKey = `view_${stationName.toLowerCase().replace(/\s+/g, '_')}`;

      if (userPermissions?.includes(permissionKey) ||
      userStationAccess?.includes(stationName)) {
        accessibleStations.push(stationName);
      }
    }

    return accessibleStations;
  }
}

// Export singleton instance
export const stationService = new StationService();
export default stationService;