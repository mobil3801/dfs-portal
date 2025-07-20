import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2, Globe, Loader2 } from 'lucide-react';
import { useStationOptions } from '@/hooks/use-station-service';

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
  const { stationOptions, canSelectAll, loading, error } = useStationOptions(includeAll);

  // Filter out ALL option if user doesn't have permission and includeAll is true
  const visibleStations = stationOptions.filter((station) =>
  station.value !== 'ALL' || canSelectAll
  );

  const getStationIcon = (stationValue: string) => {
    if (stationValue === 'ALL' || stationValue === 'ALL_STATIONS') {
      return <Globe className="w-8 h-8" />;
    }
    return <MapPin className="w-8 h-8" />;
  };

  const getStationDescription = (stationValue: string, stationLabel: string) => {
    if (stationValue === 'ALL' || stationValue === 'ALL_STATIONS') {
      return 'View and manage all stations';
    }

    switch (stationValue) {
      case 'MOBIL':
        return 'Gas station with convenience store';
      case 'AMOCO ROSEDALE':
        return 'Full service gas station';
      case 'AMOCO BROOKLYN':
        return 'Full service gas station';
      default:
        return 'Gas station location';
    }
  };

  const getStationLocation = (stationValue: string) => {
    if (stationValue === 'ALL' || stationValue === 'ALL_STATIONS') {
      return 'All Locations';
    }

    switch (stationValue) {
      case 'MOBIL':
        return 'Far Rockaway';
      case 'AMOCO ROSEDALE':
        return 'Rosedale';
      case 'AMOCO BROOKLYN':
        return 'Brooklyn';
      default:
        return 'Location';
    }
  };

  const getButtonColorClass = (station: any) => {
    if (station.value === 'ALL' || station.value === 'ALL_STATIONS') {
      return 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100';
    }

    // Use the station's color from the central service
    const colorMap: {[key: string]: string;} = {
      'MOBIL': 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      'AMOCO ROSEDALE': 'bg-green-50 border-green-200 hover:bg-green-100',
      'AMOCO BROOKLYN': 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    };

    return colorMap[station.value] || 'bg-gray-50 border-gray-200 hover:bg-gray-100';
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
                  {(station.value === 'ALL' || station.value === 'ALL_STATIONS') &&
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
        
        {includeAll && !canSelectAll &&
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