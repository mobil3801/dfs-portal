import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2, Globe, Loader2 } from 'lucide-react';
import { useStationStore } from '@/hooks/use-station-store';

interface EnhancedStationSelectorProps {
  onStationSelect: (station: string) => void;
  title?: string;
  description?: string;
  includeAll?: boolean;
}

const EnhancedStationSelector: React.FC<EnhancedStationSelectorProps> = ({
  onStationSelect,
  title = "Select Station",
  description = "Choose the station to create a daily sales report for",
  includeAll = true
}) => {
  const { getFilteredStationOptions, canSelectAll, loading, error, stations, getStationBackgroundColor } = useStationStore();

  // Get filtered station options based on permissions and includeAll setting
  const visibleStations = getFilteredStationOptions(includeAll);

  const getStationIcon = (stationValue: string) => {
    if (stationValue === 'ALL') {
      return <Globe className="w-8 h-8" />;
    }
    return <MapPin className="w-8 h-8" />;
  };

  const getStationDescription = (stationValue: string, stationLabel: string) => {
    if (stationValue === 'ALL') {
      return 'View and manage all stations';
    }

    // Find station in centralized store first
    const stationData = stations.find(s => (s.name || s.station_name) === stationValue);
    if (stationData && stationData.description) {
      return stationData.description;
    }

    // Default fallback
    return 'Gas station location';
  };

  const getStationLocation = (stationValue: string) => {
    if (stationValue === 'ALL') {
      return 'All Locations';
    }

    // Find station in centralized store first
    const stationData = stations.find(s => (s.name || s.station_name) === stationValue);
    if (stationData) {
      // Extract location from address or use fallback
      const address = stationData.address || '';
      if (address.includes('Brooklyn')) return 'Brooklyn';
      if (address.includes('Rosedale')) return 'Rosedale';
      if (address.includes('Far Rockaway')) return 'Far Rockaway';
      if (address.trim()) return address.split(',')[0]; // First part of address
    }

    return 'Location';
  };

  const getButtonColorClass = (station: any) => {
    // Use centralized color mapping for consistency across all station selectors
    try {
      return getStationBackgroundColor(station.value);
    } catch (error) {
      console.warn('Error getting station background color:', error);
      return 'hover:bg-gray-50 hover:border-gray-300';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Building2 className="w-6 h-6" />
            <span>{title}</span>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading stations...</span>
          </div>
        </CardContent>
      </Card>);

  }

  if (error) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Building2 className="w-6 h-6" />
            <span>{title}</span>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <div className="text-red-600 mb-4">Error loading stations</div>
            <div className="text-sm text-gray-500">{error}</div>
          </div>
        </CardContent>
      </Card>);

  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <Building2 className="w-6 h-6" />
          <span>{title}</span>
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`grid grid-cols-1 ${visibleStations.length <= 2 ? 'md:grid-cols-2' : visibleStations.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'} gap-4`}>
          {visibleStations.map((station) =>
          <Button
            key={station.value}
            variant="outline"
            className={`h-auto p-6 flex flex-col items-center space-y-3 ${getButtonColorClass(station)} transition-all duration-200`}
            onClick={() => onStationSelect(station.value)}>

              {getStationIcon(station.value)}
              <div className="text-center">
                <div className="font-semibold text-lg flex items-center space-x-2">
                  <span>{station.label}</span>
                  {(station.value === 'ALL') &&
                <Badge variant="secondary" className="text-xs">
                      All
                    </Badge>
                }
                </div>
                <div className="text-sm text-muted-foreground">
                  {getStationLocation(station.value)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {getStationDescription(station.value, station.label)}
                </div>
              </div>
            </Button>
          )}
        </div>
        
        {includeAll && !canSelectAll() &&
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Note:</strong> The "ALL" option is available for Administrators and Management only.
            </div>
          </div>
        }
      </CardContent>
    </Card>);

};

export default EnhancedStationSelector;