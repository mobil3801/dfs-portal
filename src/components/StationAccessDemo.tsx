import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import StationDropdown from '@/components/StationDropdown';
import { useStationFilter } from '@/hooks/use-station-options';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, Building2, Users, Database } from 'lucide-react';

const StationAccessDemo: React.FC = () => {
  const [selectedStation, setSelectedStation] = useState<string>('');
  const { userProfile } = useAuth();
  const {
    stationFilters,
    shouldFilterByStation,
    isAllSelected,
    accessibleStations,
    accessibleStationsFilter
  } = useStationFilter(selectedStation);

  const handleStationChange = (value: string) => {
    setSelectedStation(value);
  };

  const simulateDataFetch = () => {
    if (isAllSelected) {
      // When All Station is selected, you would typically:
      // 1. Make multiple API calls for each accessible station
      // 2. Or use a backend endpoint that supports multiple station filtering
      // 3. Or aggregate data client-side
      console.log('Fetching data for all accessible stations:', accessibleStations);
      console.log('Station filters for multi-query:', accessibleStationsFilter);
    } else if (shouldFilterByStation) {
      console.log('Fetching data with station filter:', stationFilters);
    } else {
      console.log('No station filtering applied');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <span>Station Access Control Demo</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Station Dropdown */}
          <div>
            <StationDropdown
              value={selectedStation}
              onValueChange={handleStationChange}
              label="Select Station"
              placeholder="Choose a station to view"
              includeAll={true}
              showBadge={true}
              className="max-w-md" />

          </div>

          {/* Current Selection Info */}
          {selectedStation &&
          <Alert>
              <Eye className="w-4 h-4" />
              <AlertDescription>
                {isAllSelected ?
              <div className="space-y-2">
                    <p className="font-medium">All Station Access Mode</p>
                    <p>You can view data from all stations you have permission to access:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {accessibleStations.map((station) =>
                  <Badge key={station} variant="secondary">
                          {station}
                        </Badge>
                  )}
                    </div>
                  </div> :

              <p>Viewing data for: <strong>{selectedStation}</strong></p>
              }
              </AlertDescription>
            </Alert>
          }

          {/* User Access Info */}
          <Card className="bg-gray-50">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">Current User Access</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Role: <Badge variant="outline">{userProfile?.role || 'Not set'}</Badge></p>
                  <p className="mt-1">Accessible Stations: {accessibleStations.length}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {accessibleStations.map((station) =>
                    <Badge key={station} variant="secondary" className="text-xs">
                        {station}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Filter Preview */}
          {selectedStation &&
          <Card className="bg-blue-50">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4" />
                    <span className="font-medium">API Filter Preview</span>
                  </div>
                  <div className="text-sm">
                    {isAllSelected ?
                  <div className="space-y-2">
                        <p className="text-blue-800">When "All Station" is selected:</p>
                        <ul className="list-disc list-inside text-blue-700 space-y-1">
                          <li>Make multiple API calls for each accessible station</li>
                          <li>Or use a backend endpoint supporting multiple stations</li>
                          <li>Or aggregate data client-side</li>
                        </ul>
                        <div className="mt-2 p-2 bg-white rounded border">
                          <p className="text-xs text-gray-600">Accessible stations filter:</p>
                          <pre className="text-xs text-blue-600 mt-1">
                            {JSON.stringify(accessibleStationsFilter, null, 2)}
                          </pre>
                        </div>
                      </div> :

                  <div className="p-2 bg-white rounded border">
                        <p className="text-xs text-gray-600">Station filter:</p>
                        <pre className="text-xs text-blue-600 mt-1">
                          {JSON.stringify(stationFilters, null, 2)}
                        </pre>
                      </div>
                  }
                  </div>
                </div>
              </CardContent>
            </Card>
          }

          {/* Demo Button */}
          <Button
            onClick={simulateDataFetch}
            disabled={!selectedStation}
            className="w-full">

            Simulate Data Fetch for Selected Station(s)
          </Button>
        </CardContent>
      </Card>
    </div>);

};

export default StationAccessDemo;