import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Building, MapPin, Phone, Clock, User, CheckCircle,
  Plus, Edit, Trash2, AlertTriangle, Save, Loader2 } from
'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Station {
  id?: number;
  station_name: string;
  address: string;
  phone: string;
  operating_hours: string;
  manager_name: string;
  status: string;
  last_updated?: string;
  created_by?: number;
}

const InitialStationSetup: React.FC = () => {
  const { toast } = useToast();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const defaultStations = [
  {
    station_name: 'MOBIL',
    address: '',
    phone: '',
    operating_hours: '24/7',
    manager_name: '',
    status: 'Active'
  },
  {
    station_name: 'AMOCO ROSEDALE',
    address: '',
    phone: '',
    operating_hours: '24/7',
    manager_name: '',
    status: 'Active'
  },
  {
    station_name: 'AMOCO BROOKLYN',
    address: '',
    phone: '',
    operating_hours: '24/7',
    manager_name: '',
    status: 'Active'
  }];


  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    try {
      setLoading(true);
      const { data, error } = await window.ezsite.apis.tablePage(12599, {
        "PageNo": 1,
        "PageSize": 10,
        "OrderByField": "station_name",
        "IsAsc": true
      });

      if (error) {
        console.error('Error loading stations:', error);
        setStations([]);
        return;
      }

      setStations(data?.List || []);
    } catch (error) {
      console.error('Error loading stations:', error);
      toast({
        title: "Error",
        description: "Failed to load stations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupDefaultStations = async () => {
    try {
      setLoading(true);

      for (const station of defaultStations) {
        const { error } = await window.ezsite.apis.tableCreate(12599, {
          ...station,
          last_updated: new Date().toISOString(),
          created_by: 1 // Default to system user
        });

        if (error) {
          throw new Error(`Failed to create ${station.station_name}: ${error}`);
        }
      }

      toast({
        title: "Success!",
        description: "Default stations created successfully. Please update their details."
      });

      await loadStations();
    } catch (error) {
      console.error('Error setting up stations:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to setup stations.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveStation = async (station: Station) => {
    try {
      setLoading(true);

      const stationData = {
        ...station,
        last_updated: new Date().toISOString(),
        created_by: station.created_by || 1
      };

      let error;
      if (station.id) {
        // Update existing station
        ({ error } = await window.ezsite.apis.tableUpdate(12599, stationData));
      } else {
        // Create new station
        ({ error } = await window.ezsite.apis.tableCreate(12599, stationData));
      }

      if (error) {
        throw new Error(error);
      }

      toast({
        title: "Success!",
        description: `Station ${station.station_name} ${station.id ? 'updated' : 'created'} successfully.`
      });

      setEditingStation(null);
      setIsCreating(false);
      await loadStations();
    } catch (error) {
      console.error('Error saving station:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save station.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteStation = async (stationId: number) => {
    try {
      setLoading(true);
      const { error } = await window.ezsite.apis.tableDelete(12599, { "ID": stationId });

      if (error) {
        throw new Error(error);
      }

      toast({
        title: "Success!",
        description: "Station deleted successfully."
      });

      await loadStations();
    } catch (error) {
      console.error('Error deleting station:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete station.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const StationForm: React.FC<{station: Station;onSave: (station: Station) => void;onCancel: () => void;}> = ({
    station,
    onSave,
    onCancel
  }) => {
    const [formData, setFormData] = useState<Station>(station);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {station.id ? 'Edit Station' : 'Add New Station'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="station_name">Station Name</Label>
                <Input
                  id="station_name"
                  value={formData.station_name}
                  onChange={(e) => setFormData({ ...formData, station_name: e.target.value })}
                  placeholder="e.g., MOBIL, AMOCO ROSEDALE"
                  required />

              </div>
              
              <div className="space-y-2">
                <Label htmlFor="manager_name">Manager Name</Label>
                <Input
                  id="manager_name"
                  value={formData.manager_name}
                  onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                  placeholder="Station manager name" />

              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Complete station address"
                rows={2} />

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567" />

              </div>
              
              <div className="space-y-2">
                <Label htmlFor="operating_hours">Operating Hours</Label>
                <Select
                  value={formData.operating_hours}
                  onValueChange={(value) => setFormData({ ...formData, operating_hours: value })}>

                  <SelectTrigger>
                    <SelectValue placeholder="Select operating hours" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24/7">24/7</SelectItem>
                    <SelectItem value="6:00 AM - 12:00 AM">6:00 AM - 12:00 AM</SelectItem>
                    <SelectItem value="5:00 AM - 11:00 PM">5:00 AM - 11:00 PM</SelectItem>
                    <SelectItem value="6:00 AM - 10:00 PM">6:00 AM - 10:00 PM</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}>

                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Maintenance">Under Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2">

                {loading ?
                <Loader2 className="h-4 w-4 animate-spin" /> :

                <Save className="h-4 w-4" />
                }
                {station.id ? 'Update Station' : 'Create Station'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}>

                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>);

  };

  if (loading && stations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading stations...</span>
          </div>
        </CardContent>
      </Card>);

  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Station Configuration</h2>
          <p className="text-gray-600">
            Set up your gas stations: MOBIL, AMOCO ROSEDALE, and AMOCO BROOKLYN
          </p>
        </div>
        <div className="flex gap-2">
          {stations.length === 0 &&
          <Button onClick={setupDefaultStations} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Setup Default Stations
            </Button>
          }
          <Button onClick={() => setIsCreating(true)} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            Add Station
          </Button>
        </div>
      </div>

      {/* Setup Instructions */}
      {stations.length === 0 &&
      <Alert>
          <Building className="h-4 w-4" />
          <AlertDescription>
            <strong>Get Started:</strong> Click "Setup Default Stations" to create the three main stations 
            (MOBIL, AMOCO ROSEDALE, AMOCO BROOKLYN), then update their details with your specific information.
          </AlertDescription>
        </Alert>
      }

      {/* Station Form */}
      {(editingStation || isCreating) &&
      <StationForm
        station={editingStation || {
          station_name: '',
          address: '',
          phone: '',
          operating_hours: '24/7',
          manager_name: '',
          status: 'Active'
        }}
        onSave={saveStation}
        onCancel={() => {
          setEditingStation(null);
          setIsCreating(false);
        }} />

      }

      {/* Stations List */}
      {stations.length > 0 &&
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stations.map((station) =>
        <Card key={station.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {station.station_name}
                  </CardTitle>
                  <Badge
                className={
                station.status === 'Active' ? 'bg-green-100 text-green-800' :
                station.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
                }>

                    {station.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {station.address &&
              <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{station.address}</span>
                    </div>
              }
                  
                  {station.phone &&
              <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{station.phone}</span>
                    </div>
              }
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{station.operating_hours}</span>
                  </div>
                  
                  {station.manager_name &&
              <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{station.manager_name}</span>
                    </div>
              }

                  {!station.address || !station.phone || !station.manager_name ?
              <Alert className="mt-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Some information is missing. Please complete the station details.
                      </AlertDescription>
                    </Alert> :

              <div className="flex items-center gap-2 text-sm text-green-600 mt-3">
                      <CheckCircle className="h-4 w-4" />
                      <span>Setup complete</span>
                    </div>
              }
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingStation(station)}
                disabled={loading}>

                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  
                  <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${station.station_name}?`)) {
                    deleteStation(station.id!);
                  }
                }}
                disabled={loading}
                className="text-red-600 hover:text-red-700">

                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
        )}
        </div>
      }

      {/* Setup Progress Summary */}
      {stations.length > 0 &&
      <Card>
          <CardHeader>
            <CardTitle>Setup Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stations.length}</div>
                <p className="text-sm text-gray-600">Stations Created</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stations.filter((s) => s.address && s.phone && s.manager_name).length}
                </div>
                <p className="text-sm text-gray-600">Fully Configured</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {stations.filter((s) => s.status === 'Active').length}
                </div>
                <p className="text-sm text-gray-600">Active Stations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      }
    </div>);

};

export default InitialStationSetup;