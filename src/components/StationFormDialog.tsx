import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Building2, Save, X } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
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

    try {
      // Validate required fields
      if (!formData.station_name.trim()) {
        throw new Error('Station name is required');
      }
      if (!formData.address.trim()) {
        throw new Error('Address is required');
      }
      if (!formData.phone.trim()) {
        throw new Error('Phone number is required');
      }
      if (!formData.operating_hours.trim()) {
        throw new Error('Operating hours are required');
      }
      if (!formData.manager_name.trim()) {
        throw new Error('Manager name is required');
      }

      const dataToSave = {
        ...formData,
        last_updated: new Date().toISOString(),
        created_by: 1 // This would come from the current user context
      };

      if (mode === 'add') {
        const { error } = await window.ezsite.apis.tableCreate(12599, dataToSave);
        if (error) throw error;

        toast({
          title: "Success",
          description: "Station added successfully"
        });
      } else {
        const { error } = await window.ezsite.apis.tableUpdate(12599, dataToSave);
        if (error) throw error;

        toast({
          title: "Success",
          description: "Station updated successfully"
        });
      }

      onSave();
      onOpenChange(false);
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
              required />

          </div>

          <div>
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full station address"
              required
              rows={2} />

          </div>

          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(555) 123-4567"
              required />

          </div>

          <div>
            <Label htmlFor="operating_hours">Operating Hours *</Label>
            <Input
              id="operating_hours"
              value={formData.operating_hours}
              onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
              placeholder="e.g., 24/7 or 6:00 AM - 12:00 AM"
              required />

          </div>

          <div>
            <Label htmlFor="manager_name">Manager Name *</Label>
            <Input
              id="manager_name"
              value={formData.manager_name}
              onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
              placeholder="Station manager name"
              required />

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