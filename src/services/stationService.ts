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
        value: 'ALL',
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
   * Get station color based on name and type
   * Provides consistent color mapping across all station-related UI elements
   */
  getStationColor(stationName: string, type: 'badge' | 'background' | 'text-badge' | 'border' | 'print' = 'badge'): string {
    // Normalize station name to handle case variations
    const normalizedName = stationName?.toUpperCase().trim();
    
    // Define comprehensive color schemes for each station
    const colorSchemes: {[key: string]: {[key: string]: string}} = {
      'MOBIL': {
        badge: 'bg-blue-500',                                     // Solid badge background
        background: 'bg-blue-50 border-blue-200 hover:bg-blue-100',  // Light background with border and hover
        'text-badge': 'bg-blue-100 text-blue-800',              // Light badge with colored text
        border: 'border-blue-200',                              // Border only
        print: 'bg-blue-500 text-white'                         // Print-specific styling
      },
      'AMOCO ROSEDALE': {
        badge: 'bg-green-500',
        background: 'bg-green-50 border-green-200 hover:bg-green-100',
        'text-badge': 'bg-green-100 text-green-800',
        border: 'border-green-200',
        print: 'bg-green-500 text-white'
      },
      'AMOCO BROOKLYN': {
        badge: 'bg-purple-500',
        background: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
        'text-badge': 'bg-purple-100 text-purple-800',
        border: 'border-purple-200',
        print: 'bg-purple-500 text-white'
      },
      'ALL': {
        badge: 'bg-indigo-600',
        background: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
        'text-badge': 'bg-indigo-100 text-indigo-800',
        border: 'border-indigo-200',
        print: 'bg-indigo-600 text-white'
      }
    };

    // Default fallback colors for unknown stations
    const defaultColors = {
      badge: 'bg-gray-500',
      background: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
      'text-badge': 'bg-gray-100 text-gray-800',
      border: 'border-gray-200',
      print: 'bg-gray-500 text-white'
    };

    const stationColors = colorSchemes[normalizedName] || defaultColors;
    return stationColors[type] || stationColors.badge;
  }

  /**
   * Get station color for badges (backward compatibility)
   */
  getStationBadgeColor(stationName: string): string {
    return this.getStationColor(stationName, 'badge');
  }

  /**
   * Get station color with text for light badges
   */
  getStationTextBadgeColor(stationName: string): string {
    return this.getStationColor(stationName, 'text-badge');
  }

  /**
   * Get station background color for interactive elements
   */
  getStationBackgroundColor(stationName: string): string {
    return this.getStationColor(stationName, 'background');
  }

  /**
   * Get station color for print contexts
   */
  getStationPrintColor(stationName: string): string {
    return this.getStationColor(stationName, 'print');
  }

  /**
   * Get all available stations with their color information
   */
  getStationColorMap(): {[key: string]: {name: string; colors: {[key: string]: string}}} {
    const stations = ['MOBIL', 'AMOCO ROSEDALE', 'AMOCO BROOKLYN', 'ALL'];
    const colorMap: {[key: string]: {name: string; colors: {[key: string]: string}}} = {};
    
    stations.forEach(station => {
      colorMap[station] = {
        name: station,
        colors: {
          badge: this.getStationColor(station, 'badge'),
          background: this.getStationColor(station, 'background'),
          textBadge: this.getStationColor(station, 'text-badge'),
          border: this.getStationColor(station, 'border'),
          print: this.getStationColor(station, 'print')
        }
      };
    });
    
    return colorMap;
  }

  /**
   * Check if user can view all stations
   */
  private canUserViewAll(userRole?: string, userPermissions?: string[]): boolean {
    if (!userRole || typeof userRole !== 'string') return false;

    return userRole === 'Administrator' ||
    userRole === 'Management' ||
    userRole === 'Manager' ||
    (Array.isArray(userPermissions) && userPermissions.includes('view_all_stations')) || false;
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
      console.log('[STATION-SERVICE-DEBUG] Adding station:', {
        stationName: stationData.station_name,
        cacheSize: this.stationsCache.length,
        timestamp: new Date().toISOString()
      });

      const { error } = await window.ezsite.apis.tableCreate(12599, stationData);

      if (error) {
        console.error('[STATION-SERVICE-DEBUG] Add station failed:', error);
        return { success: false, error };
      }

      // Clear cache to force refresh
      this.clearCache();
      console.log('[STATION-SERVICE-DEBUG] Cache cleared after adding station');

      return { success: true };
    } catch (error) {
      console.error('[STATION-SERVICE-DEBUG] Add station error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Update station (invalidates cache)
   */
  async updateStation(stationData: Station): Promise<{success: boolean;error?: string;}> {
    try {
      console.log('[STATION-SERVICE-DEBUG] Updating station:', {
        stationId: stationData.id,
        stationName: stationData.station_name,
        cacheSize: this.stationsCache.length,
        timestamp: new Date().toISOString()
      });

      const { error } = await window.ezsite.apis.tableUpdate(12599, stationData);

      if (error) {
        console.error('[STATION-SERVICE-DEBUG] Update station failed:', error);
        return { success: false, error };
      }

      // Clear cache to force refresh
      this.clearCache();
      console.log('[STATION-SERVICE-DEBUG] Cache cleared after updating station');

      return { success: true };
    } catch (error) {
      console.error('[STATION-SERVICE-DEBUG] Update station error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Delete station (invalidates cache)
   */
  async deleteStation(stationId: number): Promise<{success: boolean;error?: string;}> {
    try {
      console.log('[STATION-SERVICE-DEBUG] Deleting station:', {
        stationId,
        cacheSize: this.stationsCache.length,
        timestamp: new Date().toISOString()
      });

      const { error } = await window.ezsite.apis.tableDelete(12599, { id: stationId });

      if (error) {
        console.error('[STATION-SERVICE-DEBUG] Delete station failed:', error);
        return { success: false, error };
      }

      // Clear cache to force refresh
      this.clearCache();
      console.log('[STATION-SERVICE-DEBUG] Cache cleared after deleting station');

      return { success: true };
    } catch (error) {
      console.error('[STATION-SERVICE-DEBUG] Delete station error:', error);
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

      if ((Array.isArray(userPermissions) && userPermissions.includes(permissionKey)) ||
      (Array.isArray(userStationAccess) && userStationAccess.includes(stationName))) {
        accessibleStations.push(stationName);
      }
    }

    return accessibleStations;
  }
}

// Export singleton instance
export const stationService = new StationService();
export default stationService;