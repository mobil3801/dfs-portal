import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useStationStore } from '@/hooks/use-station-store';
import { Building2, Save, X, CheckCircle, AlertTriangle } from 'lucide-react';

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
  created_at?: string;
  updated_at?: string;
}

interface StationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  station?: Station | null;
  onSave: () => void;
  mode: 'add' | 'edit';
}

const StationFormDialog: React.FC<StationFormDialogProps> = ({
  open,
  onOpenChange,
  station,
  onSave,
  mode
}) => {
  const { toast } = useToast();
  const { addStation, updateStation, stations } = useStationStore();
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Station>({
    station_name: '',
    address: '',
    phone: '',
    operating_hours: '',
    manager_name: '',
    status: 'Active'
  });

  useEffect(() => {
    if (station && mode === 'edit') {
      setFormData({
        id: station.id,
        station_name: station.station_name || '',
        address: station.address || '',
        phone: station.phone || '',
        operating_hours: station.operating_hours || '',
        manager_name: station.manager_name || '',
        status: station.status || 'Active'
      });
    } else if (mode === 'add') {
      setFormData({
        station_name: '',
        address: '',
        phone: '',
        operating_hours: '',
        manager_name: '',
        status: 'Active'
      });
    }
  }, [station, mode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setValidationErrors({});

    try {
      // Enhanced validation with better error messages
      const errors: Record<string, string> = {};
      
      if (!formData.station_name.trim()) {
        errors.station_name = 'Station name is required';
      } else if (formData.station_name.trim().length < 2) {
        errors.station_name = 'Station name must be at least 2 characters';
      }
      
      if (!formData.address.trim()) {
        errors.address = 'Address is required';
      }
      
      if (!formData.phone.trim()) {
        errors.phone = 'Phone number is required';
      } else if (!/^[\+]?[\d\s\-\(\)]{10,}$/.test(formData.phone.trim())) {
        errors.phone = 'Please enter a valid phone number';
      }
      
      if (!formData.operating_hours.trim()) {
        errors.operating_hours = 'Operating hours are required';
      }
      
      if (!formData.manager_name.trim()) {
        errors.manager_name = 'Manager name is required';
      }

      // Check for duplicate station name (exclude current station if editing)
      if (mode === 'add') {
        const existingStation = stations.find(s => 
          s.station_name?.toLowerCase() === formData.station_name.trim().toLowerCase()
        );
        
        if (existingStation) {
          errors.station_name = `Station "${formData.station_name}" already exists`;
        }
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        toast({
          title: "Validation Error",
          description: "Please fix the errors below",
          variant: "destructive"
        });
        return;
      }

      // Prepare data for the station store
      const stationData = {
        station_name: formData.station_name.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        operating_hours: formData.operating_hours.trim(),
        manager_name: formData.manager_name.trim(),
        status: formData.status,
        last_updated: new Date().toISOString(),
        created_by: 1
      };

      let result;
      if (mode === 'add') {
        // Use the enhanced station store to add station
        result = await addStation(stationData);
      } else {
        // Update existing station
        result = await updateStation({
          ...stationData,
          id: station?.id,
          created_by: station?.created_by,
          last_updated: new Date().toISOString()
        });
      }

      if (result.success) {
        // Success message is handled by the store
        onSave(); // Notify parent component
        onOpenChange(false);
        
        // Additional success feedback
        toast({
          title: "Success!",
          description: (
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>
                Station "{formData.station_name}" {mode === 'add' ? 'created' : 'updated'} 
                and is now available in all station dropdowns
              </span>
            </div>
          ),
        });
      }
    } catch (error) {
      console.error('Error saving station:', error);
      toast({
        title: "Error",
        description: typeof error === 'string' ? error : "Failed to save station",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <span>{mode === 'add' ? 'Add New Station' : 'Edit Station'}</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="station_name">Station Name *</Label>
            <Input
              id="station_name"
              value={formData.station_name}
              onChange={(e) => setFormData({ ...formData, station_name: e.target.value })}
              placeholder="e.g., MOBIL, AMOCO ROSEDALE"
              required
              className={validationErrors.station_name ? 'border-red-500' : ''}
            />
            {validationErrors.station_name && (
              <p className="text-xs text-red-500 mt-1 flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{validationErrors.station_name}</span>
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Complete station address"
              required
              rows={2}
              className={validationErrors.address ? 'border-red-500' : ''}
            />
            {validationErrors.address && (
              <p className="text-xs text-red-500 mt-1 flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{validationErrors.address}</span>
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(555) 123-4567"
              required
              className={validationErrors.phone ? 'border-red-500' : ''}
            />
            {validationErrors.phone && (
              <p className="text-xs text-red-500 mt-1 flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{validationErrors.phone}</span>
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="operating_hours">Operating Hours *</Label>
            <Input
              id="operating_hours"
              value={formData.operating_hours}
              onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
              placeholder="e.g., 24/7 or 6:00 AM - 12:00 AM"
              required
              className={validationErrors.operating_hours ? 'border-red-500' : ''}
            />
            {validationErrors.operating_hours && (
              <p className="text-xs text-red-500 mt-1 flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{validationErrors.operating_hours}</span>
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="manager_name">Manager Name *</Label>
            <Input
              id="manager_name"
              value={formData.manager_name}
              onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
              placeholder="Station manager name"
              required
              className={validationErrors.manager_name ? 'border-red-500' : ''}
            />
            {validationErrors.manager_name && (
              <p className="text-xs text-red-500 mt-1 flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{validationErrors.manager_name}</span>
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}>

              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700">

              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : mode === 'add' ? 'Add Station' : 'Update Station'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>);

};

export default StationFormDialog;
