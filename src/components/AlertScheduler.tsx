import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Plus, Edit, Trash2, Play, Pause, Loader2, AlertTriangle } from 'lucide-react';
import { smsService } from '@/services/smsService';

interface AlertSchedule {
  ID?: number;
  schedule_name: string;
  alert_type: string;
  days_before_expiry: number;
  frequency_days: number;
  template_id: number;
  is_active: boolean;
  last_run?: string;
  next_run?: string;
  station_filter: string;
  created_by?: number;
}

interface SMSTemplate {
  ID: number;
  template_name: string;
  template_type: string;
  is_active: boolean;
}

interface License {
  ID: number;
  license_name: string;
  expiry_date: string;
  station: string;
  status: string;
  license_number?: string;
}

interface Contact {
  ID: number;
  mobile_number: string;
  station: string;
}

const ALERT_TYPES = [
  'License Expiry',
  'Inventory Alert',
  'Payment Reminder',
  'Delivery Notification',
  'Emergency Alert'
];

const STATION_OPTIONS = [
  'ALL',
  'MOBIL',
  'AMOCO ROSEDALE',
  'AMOCO BROOKLYN'
];

const AlertScheduler: React.FC = () => {
  const [schedules, setSchedules] = useState<AlertSchedule[]>([]);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<AlertSchedule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRunning, setIsRunning] = useState<number | null>(null);
  const { toast } = useToast();

  const [newSchedule, setNewSchedule] = useState<AlertSchedule>({
    schedule_name: '',
    alert_type: 'License Expiry',
    days_before_expiry: 30,
    frequency_days: 7,
    template_id: 0,
    is_active: true,
    station_filter: 'ALL'
  });

  useEffect(() => {
    loadSchedules();
    loadTemplates();
  }, []);

  const loadSchedules = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await window.ezsite.apis.tablePage(12642, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'ID',
        IsAsc: false,
        Filters: []
      });

      if (error) throw new Error(error);
      
      if (data?.List) {
        setSchedules(data.List);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load alert schedules',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(12641, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'ID',
        IsAsc: false,
        Filters: [{ name: 'is_active', op: 'Equal', value: true }]
      });

      if (error) throw new Error(error);
      
      if (data?.List) {
        setTemplates(data.List);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const saveSchedule = async () => {
    const schedule = editingSchedule || newSchedule;
    
    if (!schedule.schedule_name || !schedule.template_id) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Calculate next run time
      const nextRun = new Date();
      nextRun.setHours(9, 0, 0, 0); // Run at 9 AM
      if (nextRun <= new Date()) {
        nextRun.setDate(nextRun.getDate() + 1); // If past 9 AM today, schedule for tomorrow
      }

      const scheduleData = {
        schedule_name: schedule.schedule_name,
        alert_type: schedule.alert_type,
        days_before_expiry: schedule.days_before_expiry,
        frequency_days: schedule.frequency_days,
        template_id: schedule.template_id,
        is_active: schedule.is_active,
        next_run: nextRun.toISOString(),
        station_filter: schedule.station_filter,
        created_by: 1 // This should be the current user ID
      };

      if (editingSchedule?.ID) {
        const { error } = await window.ezsite.apis.tableUpdate(12642, {
          ID: editingSchedule.ID,
          ...scheduleData
        });
        if (error) throw new Error(error);
        
        toast({
          title: 'Success',
          description: 'Schedule updated successfully'
        });
      } else {
        const { error } = await window.ezsite.apis.tableCreate(12642, scheduleData);
        if (error) throw new Error(error);
        
        toast({
          title: 'Success',
          description: 'Schedule created successfully'
        });
      }

      setIsDialogOpen(false);
      setEditingSchedule(null);
      setNewSchedule({
        schedule_name: '',
        alert_type: 'License Expiry',
        days_before_expiry: 30,
        frequency_days: 7,
        template_id: 0,
        is_active: true,
        station_filter: 'ALL'
      });
      
      await loadSchedules();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save schedule',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSchedule = async (scheduleId: number) => {
    try {
      const { error } = await window.ezsite.apis.tableDelete(12642, { ID: scheduleId });
      if (error) throw new Error(error);
      
      toast({
        title: 'Success',
        description: 'Schedule deleted successfully'
      });
      
      await loadSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete schedule',
        variant: 'destructive'
      });
    }
  };

  const toggleSchedule = async (schedule: AlertSchedule) => {
    try {
      const { error } = await window.ezsite.apis.tableUpdate(12642, {
        ID: schedule.ID!,
        is_active: !schedule.is_active
      });
      if (error) throw new Error(error);
      
      toast({
        title: 'Success',
        description: `Schedule ${!schedule.is_active ? 'activated' : 'deactivated'}`,
      });
      
      await loadSchedules();
    } catch (error) {
      console.error('Error toggling schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update schedule status',
        variant: 'destructive'
      });
    }
  };

  const runScheduleNow = async (schedule: AlertSchedule) => {
    if (!schedule.ID) return;
    
    setIsRunning(schedule.ID);
    try {
      await processLicenseExpiryAlerts(schedule);
      
      // Update last run time
      await window.ezsite.apis.tableUpdate(12642, {
        ID: schedule.ID,
        last_run: new Date().toISOString()
      });
      
      toast({
        title: 'Success',
        description: 'Schedule executed successfully'
      });
      
      await loadSchedules();
    } catch (error) {
      console.error('Error running schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to execute schedule',
        variant: 'destructive'
      });
    } finally {
      setIsRunning(null);
    }
  };

  const processLicenseExpiryAlerts = async (schedule: AlertSchedule) => {
    try {
      // Get licenses that are expiring within the specified days
      const { data, error } = await window.ezsite.apis.tablePage(11731, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'expiry_date',
        IsAsc: true,
        Filters: [
          { name: 'status', op: 'Equal', value: 'Active' },
          ...(schedule.station_filter !== 'ALL' ? [{ name: 'station', op: 'Equal', value: schedule.station_filter }] : [])
        ]
      });

      if (error) throw new Error(error);
      
      if (data?.List) {
        const licenses = data.List.filter((license: License) => {
          const expiryDate = new Date(license.expiry_date);
          const today = new Date();
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          return daysUntilExpiry <= schedule.days_before_expiry && daysUntilExpiry > 0;
        });

        // Get contacts for the stations
        const { data: contactsData } = await window.ezsite.apis.tablePage(12612, {
          PageNo: 1,
          PageSize: 100,
          OrderByField: 'ID',
          IsAsc: false,
          Filters: [{ name: 'is_active', op: 'Equal', value: true }]
        });

        if (contactsData?.List) {
          for (const license of licenses) {
            const relevantContacts = contactsData.List.filter((contact: Contact) => 
              contact.station === 'ALL' || contact.station === license.station
            );

            for (const contact of relevantContacts) {
              const expiryDate = new Date(license.expiry_date);
              const today = new Date();
              const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              
              await smsService.sendSMS({
                to: contact.mobile_number,
                message: '',
                templateId: schedule.template_id,
                placeholders: {
                  license_name: license.license_name,
                  station: license.station,
                  expiry_date: expiryDate.toLocaleDateString(),
                  days_remaining: daysRemaining.toString(),
                  license_number: license.license_number || 'N/A'
                }
              });

              // Log the alert
              await window.ezsite.apis.tableCreate(12613, {
                license_id: license.ID,
                contact_id: contact.ID,
                mobile_number: contact.mobile_number,
                days_before_expiry: daysRemaining,
                sent_date: new Date().toISOString(),
                delivery_status: 'Sent',
                created_by: 1
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing license expiry alerts:', error);
      throw error;
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getTemplateName = (templateId: number) => {
    const template = templates.find(t => t.ID === templateId);
    return template ? template.template_name : 'Unknown Template';
  };

  const isScheduleOverdue = (schedule: AlertSchedule) => {
    if (!schedule.next_run) return false;
    return new Date(schedule.next_run) < new Date();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Automated Alert Scheduler
              </CardTitle>
              <CardDescription>
                Configure automated SMS alerts for license expiry and other important events
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingSchedule(null);
                  setNewSchedule({
                    schedule_name: '',
                    alert_type: 'License Expiry',
                    days_before_expiry: 30,
                    frequency_days: 7,
                    template_id: 0,
                    is_active: true,
                    station_filter: 'ALL'
                  });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure an automated alert schedule for SMS notifications.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="schedule_name">Schedule Name *</Label>
                    <Input
                      id="schedule_name"
                      placeholder="Enter schedule name"
                      value={editingSchedule?.schedule_name || newSchedule.schedule_name}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (editingSchedule) {
                          setEditingSchedule({ ...editingSchedule, schedule_name: value });
                        } else {
                          setNewSchedule({ ...newSchedule, schedule_name: value });
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alert_type">Alert Type</Label>
                    <Select
                      value={editingSchedule?.alert_type || newSchedule.alert_type}
                      onValueChange={(value) => {
                        if (editingSchedule) {
                          setEditingSchedule({ ...editingSchedule, alert_type: value });
                        } else {
                          setNewSchedule({ ...newSchedule, alert_type: value });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALERT_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="days_before_expiry">Days Before Expiry</Label>
                      <Input
                        id="days_before_expiry"
                        type="number"
                        min="1"
                        max="365"
                        value={editingSchedule?.days_before_expiry || newSchedule.days_before_expiry}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 30;
                          if (editingSchedule) {
                            setEditingSchedule({ ...editingSchedule, days_before_expiry: value });
                          } else {
                            setNewSchedule({ ...newSchedule, days_before_expiry: value });
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="frequency_days">Frequency (Days)</Label>
                      <Input
                        id="frequency_days"
                        type="number"
                        min="1"
                        max="30"
                        value={editingSchedule?.frequency_days || newSchedule.frequency_days}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 7;
                          if (editingSchedule) {
                            setEditingSchedule({ ...editingSchedule, frequency_days: value });
                          } else {
                            setNewSchedule({ ...newSchedule, frequency_days: value });
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template_id">SMS Template *</Label>
                    <Select
                      value={(editingSchedule?.template_id || newSchedule.template_id).toString()}
                      onValueChange={(value) => {
                        const templateId = parseInt(value);
                        if (editingSchedule) {
                          setEditingSchedule({ ...editingSchedule, template_id: templateId });
                        } else {
                          setNewSchedule({ ...newSchedule, template_id: templateId });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map(template => (
                          <SelectItem key={template.ID} value={template.ID.toString()}>
                            {template.template_name} ({template.template_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="station_filter">Station Filter</Label>
                    <Select
                      value={editingSchedule?.station_filter || newSchedule.station_filter}
                      onValueChange={(value) => {
                        if (editingSchedule) {
                          setEditingSchedule({ ...editingSchedule, station_filter: value });
                        } else {
                          setNewSchedule({ ...newSchedule, station_filter: value });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATION_OPTIONS.map(station => (
                          <SelectItem key={station} value={station}>{station}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={editingSchedule?.is_active ?? newSchedule.is_active}
                      onCheckedChange={(checked) => {
                        if (editingSchedule) {
                          setEditingSchedule({ ...editingSchedule, is_active: checked });
                        } else {
                          setNewSchedule({ ...newSchedule, is_active: checked });
                        }
                      }}
                    />
                    <Label htmlFor="is_active">Active Schedule</Label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={saveSchedule} disabled={isLoading}>
                      {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {editingSchedule ? 'Update' : 'Create'} Schedule
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Schedule Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule.ID}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {schedule.schedule_name}
                          {isScheduleOverdue(schedule) && (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {schedule.alert_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {getTemplateName(schedule.template_id)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {schedule.station_filter}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        Every {schedule.frequency_days} day{schedule.frequency_days !== 1 ? 's' : ''}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDateTime(schedule.next_run)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={schedule.is_active ? "secondary" : "outline"}>
                          {schedule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => schedule.ID && runScheduleNow(schedule)}
                            disabled={isRunning === schedule.ID}
                          >
                            {isRunning === schedule.ID ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSchedule(schedule)}
                          >
                            {schedule.is_active ? (
                              <Pause className="h-3 w-3" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingSchedule(schedule);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => schedule.ID && deleteSchedule(schedule.ID)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {schedules.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="text-gray-500">
                          No alert schedules configured yet
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertScheduler;
