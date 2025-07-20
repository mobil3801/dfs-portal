import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter } from
'@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Station {
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

interface StationEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  station: Station | null;
  onSave: () => void;
}

export default function StationEditDialog({
  open,
  onOpenChange,
  station,
  onSave
}: StationEditDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    station_name: '',
    address: '',
    phone: '',
    operating_hours: '',
    manager_name: '',
    status: 'Active'
  });

  useEffect(() => {
    if (station) {
      setFormData({
        station_name: station.station_name,
        address: station.address,
        phone: station.phone,
        operating_hours: station.operating_hours,
        manager_name: station.manager_name,
        status: station.status
      });
    }
  }, [station]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!station) return;

    setLoading(true);
    try {
      console.log('Updating station:', station.id, formData);

      const updateData = {
        id: station.id,
        ...formData,
        last_updated: new Date().toISOString(),
        created_by: station.created_by
      };

      const { error } = await window.ezsite.apis.tableUpdate(12599, updateData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Station information updated successfully"
      });

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating station:', error);
      toast({
        title: "Error",
        description: error?.toString() || "Failed to update station information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.station_name && formData.address && formData.phone &&
  formData.operating_hours && formData.manager_name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Station Information</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="station_name">Station Name</Label>
              <Input
                id="station_name"
                value={formData.station_name}
                onChange={(e) => handleInputChange('station_name', e.target.value)}
                placeholder="Enter station name"
                required />

            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter station address"
                required />

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(718) 555-0100"
                  required />

              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="operating_hours">Operating Hours</Label>
              <Input
                id="operating_hours"
                value={formData.operating_hours}
                onChange={(e) => handleInputChange('operating_hours', e.target.value)}
                placeholder="24/7 or 6:00 AM - 12:00 AM"
                required />

            </div>

            <div className="space-y-2">
              <Label htmlFor="manager_name">Manager Name</Label>
              <Input
                id="manager_name"
                value={formData.manager_name}
                onChange={(e) => handleInputChange('manager_name', e.target.value)}
                placeholder="Enter manager name"
                required />

            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !isFormValid}
              className="min-w-[100px]">

              {loading ?
              <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </> :

              'Save Changes'
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>);

}