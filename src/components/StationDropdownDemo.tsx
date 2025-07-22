import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import UniversalStationDropdown from '@/components/UniversalStationDropdown';
import EnhancedStationFormDialog from '@/components/EnhancedStationFormDialog';
import { useStationStore } from '@/hooks/use-station-store';
import { 
  Building2, 
  Plus, 
  Eye, 
  Globe, 
  CheckCircle, 
  Info, 
  Zap,
  Users,
  MapPin 
} from 'lucide-react';

/**
 * Station Dropdown Demo Component
 * 
 * This component demonstrates the complete station dropdown functionality:
 * - Real-time updates when new stations are added
 * - "All Stations" option for authorized users
 * - No duplicate station names
 * - Instant availability across all dropdowns
 * - Permission-based access control
 * 
 * UX Features:
 * - Visual feedback for selections
 * - Loading states
 * - Error handling
 * - Success notifications
 * - Responsive design
 */
const StationDropdownDemo: React.FC = () => {
  const [selectedStation1, setSelectedStation1] = useState<string>('');
  const [selectedStation2, setSelectedStation2] = useState<string>('');
  const [selectedStation3, setSelectedStation3] = useState<string>('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const { 
    stations, 
    stationOptions, 
    loading, 
    error, 
    canSelectAll,
    getFilteredStationOptions 
  } = useStationStore();

  const handleStationAdded = () => {
    // Dialog and store handle the updates automatically
    // All dropdowns will instantly show the new station
  };

  const simulateDataAccess = () => {
    const station = selectedStation1;
    if (!station) return;

    if (station === 'ALL_STATIONS' || station === 'ALL') {
      console.log('Accessing data for all stations:', getFilteredStationOptions(false).map(s => s.value));
    } else {
      console.log('Accessing data for station:', station);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center space-x-2">
          <Building2 className="w-8 h-8 text-blue-600" />
          <span>Station Dropdown System Demo</span>
        </h1>
        <p className="text-gray-600">
          Demonstrating dynamic station selection with real-time updates
        </p>
      </div>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <span>Key Features</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Real-time Updates</p>
                <p className="text-sm text-gray-600">New stations appear instantly in all dropdowns</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Globe className="w-5 h-5 text-indigo-500 mt-0.5" />
              <div>
                <p className="font-medium">"All Stations" Option</p>
                <p className="text-sm text-gray-600">Available for authorized users with proper permissions</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Users className="w-5 h-5 text-purple-500 mt-0.5" />
              <div>
                <p className="font-medium">Permission-based Access</p>
                <p className="text-sm text-gray-600">Role-based station visibility and access control</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Stations Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-blue-500" />
            <span>Current System Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Total Stations:</span>
              <Badge variant="secondary">{stations.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Available Options:</span>
              <Badge variant="secondary">{stationOptions.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>"All Stations" Available:</span>
              <Badge variant={canSelectAll() ? "default" : "outline"}>
                {canSelectAll() ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Loading:</span>
              <Badge variant={loading ? "destructive" : "outline"}>
                {loading ? "Yes" : "No"}
              </Badge>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Add Station Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-green-500" />
            <span>Add New Station</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Click the button below to add a new station. Watch how it instantly appears in all dropdown menus below.
            </p>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Station
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Multiple Dropdown Demos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Dropdown 1 - Sales Report */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sales Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <UniversalStationDropdown
              value={selectedStation1}
              onValueChange={setSelectedStation1}
              label="Select Station for Report"
              placeholder="Choose station..."
              includeAll={true}
              showBadge={true}
              required
              helperText="Generate sales report for selected station(s)"
            />
            
            {selectedStation1 && (
              <Alert>
                <Eye className="w-4 h-4" />
                <AlertDescription>
                  {selectedStation1 === 'ALL_STATIONS' || selectedStation1 === 'ALL' ? (
                    <span>
                      Generating report for <strong>all accessible stations</strong>
                    </span>
                  ) : (
                    <span>
                      Generating report for <strong>{selectedStation1}</strong>
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={simulateDataAccess}
              disabled={!selectedStation1}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Generate Report
            </Button>
          </CardContent>
        </Card>

        {/* Dropdown 2 - Inventory Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inventory Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <UniversalStationDropdown
              value={selectedStation2}
              onValueChange={setSelectedStation2}
              label="Station Location"
              placeholder="Select station..."
              includeAll={true}
              showBadge={false}
              helperText="Manage inventory for selected station"
            />
            
            {selectedStation2 && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {selectedStation2 === 'ALL_STATIONS' || selectedStation2 === 'ALL' 
                    ? "Managing all station inventories" 
                    : `Managing ${selectedStation2} inventory`}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dropdown 3 - User Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <UniversalStationDropdown
              value={selectedStation3}
              onValueChange={setSelectedStation3}
              label="Assign to Station"
              placeholder="Choose assignment..."
              includeAll={false}
              showBadge={true}
              size="lg"
              helperText="Assign user to specific station"
            />
            
            {selectedStation3 && (
              <Badge className="w-full justify-center py-2">
                Assigned to {selectedStation3}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-gray-500" />
            <span>How It Works</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium">Real-time Updates</h4>
              <p className="text-sm text-gray-600">
                When you add a new station, it's immediately available in all dropdown components throughout the application.
              </p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-medium">No Duplicates</h4>
              <p className="text-sm text-gray-600">
                The system prevents duplicate station names and validates input before adding new stations.
              </p>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-medium">Permission-based Access</h4>
              <p className="text-sm text-gray-600">
                The "All Stations" option is only available to users with appropriate permissions (Admin, Manager, etc.).
              </p>
            </div>
            
            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="font-medium">Centralized State Management</h4>
              <p className="text-sm text-gray-600">
                All station data is managed through a centralized store with automatic caching and synchronization.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Station Form Dialog */}
      <EnhancedStationFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        mode="add"
        onSave={handleStationAdded}
      />
    </div>
  );
};

export default StationDropdownDemo;
