import { toast } from '@/hooks/use-toast';
import { supabaseAdapter } from './supabase/supabaseAdapter';
import { supabaseOptimizedDataService } from './supabaseOptimizedDataService';

// Updated Station interface to match Supabase schema
export interface Station {
  id: string; // UUID in Supabase
  station_id: string; // Unique identifier
  name: string; // Station name (was station_name)
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive' | 'maintenance';
  manager_id?: string; // UUID reference to manager
  latitude?: number;
  longitude?: number;
  fuel_types?: string[]; // JSON array
  pump_count?: number;
  active: boolean;
  notes?: string; // Can include operating hours
  created_at?: string;
  updated_at?: string;
  
  // Legacy fields for backward compatibility
  station_name?: string; // Alias for 'name'
  operating_hours?: string; // Moved to notes or separate handling
  manager_name?: string; // Derived from manager_id lookup
  last_updated?: string; // Alias for 'updated_at'
  created_by?: string; // Audit field
}

export interface StationOption {
  value: string;
  label: string;
  color?: string;
  station?: Station;
}

class SupabaseStationService {
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
    }
  ];

  /**
   * Get all stations from Supabase or cache
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
      // Use Supabase adapter with optimized data service
      const result = await supabaseOptimizedDataService.fetchData(
        12599, // Table ID (mapped to 'stations' in adapter)
        {
          PageNo: 1,
          PageSize: 100,
          OrderByField: 'name',
          IsAsc: true,
          Filters: [
            { name: 'active', op: 'Equal', value: true },
            { name: 'status', op: 'NotEqual', value: 'inactive' }
          ]
        },
        {
          priority: 'high',
          cache: true
        }
      );

      if (result.data?.error) {
        console.error('Error loading stations from Supabase:', result.data.error);
        return this.getFallbackStations();
      }

      const stations = result.data?.List || [];
      
      // Transform Supabase data to include legacy fields for backward compatibility
      this.stationsCache = stations.map(this.transformStationData);
      this.cacheTimestamp = Date.now();

      return this.stationsCache;
    } catch (error) {
      console.error('Error fetching stations from Supabase:', error);
      return this.getFallbackStations();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Transform Supabase station data to include legacy fields
   */
  private transformStationData(station: any): Station {
    return {
      ...station,
      // Legacy compatibility
      station_name: station.name,
      last_updated: station.updated_at,
      operating_hours: this.extractOperatingHours(station.notes),
      manager_name: station.manager_name || 'Manager not assigned', // TODO: Look up from manager_id
      created_by: station.created_by || 'system'
    };
  }

  /**
   * Extract operating hours from notes (simple implementation)
   */
  private extractOperatingHours(notes?: string): string {
    if (!notes) return '24/7';
    
    // Look for time patterns in notes
    const hoursMatch = notes.match(/(\d{1,2}:\d{2}\s*(AM|PM)\s*-\s*\d{1,2}:\d{2}\s*(AM|PM))/i);
    return hoursMatch ? hoursMatch[0] : '24/7';
  }

  /**
   * Get station options for dropdowns
   */
  async getStationOptions(
    includeAll: boolean = false, 
    userRole?: string, 
    userPermissions?: string[]
  ): Promise<StationOption[]> {
    const stations = await this.getStations();

    const options: StationOption[] = stations.map((station) => ({
      value: station.name,
      label: station.name,
      color: this.getStationColor(station.name),
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
    return stations.map((station) => station.name);
  }

  /**
   * Get station by name
   */
  async getStationByName(name: string): Promise<Station | null> {
    const stations = await this.getStations();
    return stations.find((station) => 
      station.name === name || station.station_name === name
    ) || null;
  }

  /**
   * Get station by ID
   */
  async getStationById(id: string): Promise<Station | null> {
    try {
      const result = await supabaseAdapter.tablePage(12599, {
        Filters: [{ name: 'id', op: 'Equal', value: id }],
        PageSize: 1
      });

      if (result.error || !result.data?.List?.length) {
        return null;
      }

      return this.transformStationData(result.data.List[0]);
    } catch (error) {
      console.error('Error fetching station by ID:', error);
      return null;
    }
  }

  /**
   * Get station color based on name
   */
  getStationColor(stationName: string): string {
    const colorMap: { [key: string]: string } = {
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
           userRole === 'admin' ||
           userRole === 'manager' ||
           userPermissions?.includes('view_all_stations') || false;
  }

  /**
   * Get fallback stations when database is unavailable
   */
  private getFallbackStations(): Station[] {
    return this.FALLBACK_STATIONS.map((station, index) => ({
      id: `fallback-${index + 1}`,
      station_id: `fallback-${station.value.toLowerCase().replace(/\s+/g, '-')}`,
      name: station.value,
      address: 'Address not available',
      phone: 'Phone not available',
      status: 'active' as const,
      active: true,
      notes: 'Operating Hours: 24/7',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Legacy fields
      station_name: station.value,
      operating_hours: '24/7',
      manager_name: 'Manager not assigned',
      last_updated: new Date().toISOString(),
      created_by: 'system'
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
    // Also clear optimized data service cache for stations
    supabaseOptimizedDataService.clearCache('stations');
  }

  /**
   * Add new station (invalidates cache)
   */
  async addStation(stationData: Omit<Station, 'id' | 'created_at' | 'updated_at'>): Promise<{
    success: boolean;
    error?: string;
    stationId?: string;
  }> {
    try {
      // Prepare data for Supabase schema
      const supabaseData = {
        station_id: stationData.station_id,
        name: stationData.name,
        address: stationData.address,
        city: stationData.city,
        state: stationData.state,
        zip_code: stationData.zip_code,
        phone: stationData.phone,
        email: stationData.email,
        status: stationData.status || 'active',
        manager_id: stationData.manager_id,
        latitude: stationData.latitude,
        longitude: stationData.longitude,
        fuel_types: stationData.fuel_types ? JSON.stringify(stationData.fuel_types) : '[]',
        pump_count: stationData.pump_count || 0,
        active: stationData.active !== false,
        notes: stationData.notes || stationData.operating_hours
      };

      const { error } = await supabaseAdapter.tableCreate(12599, supabaseData);

      if (error) {
        console.error('Failed to create station:', error);
        return { success: false, error };
      }

      // Clear cache to force refresh
      this.clearCache();

      toast({
        title: "Success",
        description: "Station created successfully",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error creating station:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  /**
   * Update station (invalidates cache)
   */
  async updateStation(stationData: Station): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!stationData.id) {
        return { success: false, error: 'Station ID is required for update' };
      }

      // Prepare data for Supabase schema
      const supabaseData = {
        id: stationData.id,
        station_id: stationData.station_id,
        name: stationData.name,
        address: stationData.address,
        city: stationData.city,
        state: stationData.state,
        zip_code: stationData.zip_code,
        phone: stationData.phone,
        email: stationData.email,
        status: stationData.status,
        manager_id: stationData.manager_id,
        latitude: stationData.latitude,
        longitude: stationData.longitude,
        fuel_types: stationData.fuel_types ? JSON.stringify(stationData.fuel_types) : undefined,
        pump_count: stationData.pump_count,
        active: stationData.active,
        notes: stationData.notes || stationData.operating_hours
      };

      const { error } = await supabaseAdapter.tableUpdate(12599, supabaseData);

      if (error) {
        console.error('Failed to update station:', error);
        return { success: false, error };
      }

      // Clear cache to force refresh
      this.clearCache();

      toast({
        title: "Success",
        description: "Station updated successfully",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error updating station:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  /**
   * Delete station (invalidates cache)
   */
  async deleteStation(stationId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabaseAdapter.tableDelete(12599, { id: stationId });

      if (error) {
        console.error('Failed to delete station:', error);
        return { success: false, error };
      }

      // Clear cache to force refresh
      this.clearCache();

      toast({
        title: "Success",
        description: "Station deleted successfully",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting station:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  /**
   * Soft delete station (set active = false)
   */
  async deactivateStation(stationId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabaseAdapter.tableUpdate(12599, {
        id: stationId,
        active: false,
        status: 'inactive'
      });

      if (error) {
        console.error('Failed to deactivate station:', error);
        return { success: false, error };
      }

      // Clear cache to force refresh
      this.clearCache();

      toast({
        title: "Success",
        description: "Station deactivated successfully",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error deactivating station:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  /**
   * Get user accessible stations based on permissions
   */
  async getUserAccessibleStations(
    userRole?: string, 
    userPermissions?: string[], 
    userStationAccess?: string[]
  ): Promise<string[]> {
    const stations = await this.getStations();
    const allStationNames = stations.map((station) => station.name);

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

  /**
   * Search stations by various criteria
   */
  async searchStations(searchTerm: string, filters?: {
    status?: string;
    city?: string;
    state?: string;
    active?: boolean;
  }): Promise<Station[]> {
    try {
      const searchFilters: any[] = [];

      // Add search term filter (searches name, address, city)
      if (searchTerm.trim()) {
        searchFilters.push(
          { name: 'name', op: 'Like', value: searchTerm },
          { name: 'address', op: 'Like', value: searchTerm },
          { name: 'city', op: 'Like', value: searchTerm }
        );
      }

      // Add additional filters
      if (filters?.status) {
        searchFilters.push({ name: 'status', op: 'Equal', value: filters.status });
      }
      if (filters?.city) {
        searchFilters.push({ name: 'city', op: 'Equal', value: filters.city });
      }
      if (filters?.state) {
        searchFilters.push({ name: 'state', op: 'Equal', value: filters.state });
      }
      if (filters?.active !== undefined) {
        searchFilters.push({ name: 'active', op: 'Equal', value: filters.active });
      }

      const result = await supabaseAdapter.tablePage(12599, {
        PageNo: 1,
        PageSize: 50,
        OrderByField: 'name',
        IsAsc: true,
        Filters: searchFilters
      });

      if (result.error) {
        console.error('Error searching stations:', result.error);
        return [];
      }

      const stations = result.data?.List || [];
      return stations.map(this.transformStationData);
    } catch (error) {
      console.error('Error searching stations:', error);
      return [];
    }
  }

  /**
   * Get performance metrics for stations
   */
  getServiceMetrics() {
    return {
      cacheSize: this.stationsCache.length,
      cacheTimestamp: this.cacheTimestamp,
      cacheAge: Date.now() - this.cacheTimestamp,
      isLoading: this.isLoading,
      optimizedDataServiceMetrics: supabaseOptimizedDataService.getMetrics()
    };
  }
}

// Export singleton instance
export const supabaseStationService = new SupabaseStationService();
export default supabaseStationService;