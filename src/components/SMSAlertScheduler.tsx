import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Clock,
  Plus,
  Calendar,
  Bell,
  Settings,
  Play,
  Pause,
  Trash2,
  Edit,
  AlertTriangle,
  CheckCircle2,
  Timer } from
'lucide-react';

interface AlertSchedule {
  id: number;
  schedule_name: string;
  alert_type: string;
  days_before_expiry: number;
  frequency_days: number;
  template_id: number;
  is_active: boolean;
  last_run: string;
  next_run: string;
  station_filter: string;
  created_by: number;
}

interface SMSTemplate {
  id: number;
  template_name: string;
  template_type: string;
  message_content: string;
  is_active: boolean;
}

const SMSAlertScheduler: React.FC = () => {
  const [schedules, setSchedules] = useState<AlertSchedule[]>([]);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<AlertSchedule | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  const [newSchedule, setNewSchedule] = useState({
    schedule_name: '',
    alert_type: 'License Expiry',
    days_before_expiry: 30,
    frequency_days: 7,
    template_id: 0,
    station_filter: 'ALL',
    is_active: true
  });

  useEffect(() => {
    loadSchedules();
    loadTemplates();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const { data, error } = await window.ezsite.apis.tablePage('12642', {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'ID',
        IsAsc: false,
        Filters: []
      });

      if (error) throw error;
      setSchedules(data.List || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast({
        title: "Error",
        description: "Failed to load alert schedules",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage('12641', {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'ID',
        IsAsc: false,
        Filters: [{ name: 'is_active', op: 'Equal', value: true }]
      });

      if (error) throw error;
      setTemplates(data.List || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load SMS templates",
        variant: "destructive"
      });
    }
  };

  const createSchedule = async () => {
    try {
      setCreating(true);

      // Calculate next run time
      const now = new Date();
      const nextRun = new Date(now.getTime() + newSchedule.frequency_days * 24 * 60 * 60 * 1000);

      const { error } = await window.ezsite.apis.tableCreate('12642', {
        ...newSchedule,
        last_run: '',
        next_run: nextRun.toISOString(),
        created_by: 1 // This should be the current user ID
      });

      if (error) throw error;

      toast({
        title: "✅ Schedule Created",
        description: `Alert schedule "${newSchedule.schedule_name}" has been created successfully.`
      });

      setShowCreateDialog(false);
      setNewSchedule({
        schedule_name: '',
        alert_type: 'License Expiry',
        days_before_expiry: 30,
        frequency_days: 7,
        template_id: 0,
        station_filter: 'ALL',
        is_active: true
      });
      loadSchedules();
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast({
        title: "Error",
        description: "Failed to create alert schedule",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const toggleSchedule = async (schedule: AlertSchedule) => {
    try {
      const { error } = await window.ezsite.apis.tableUpdate('12642', {
        ID: schedule.id,
        is_active: !schedule.is_active
      });

      if (error) throw error;

      toast({
        title: schedule.is_active ? "Schedule Paused" : "Schedule Activated",
        description: `Schedule "${schedule.schedule_name}" has been ${schedule.is_active ? 'paused' : 'activated'}.`
      });

      loadSchedules();
    } catch (error) {
      console.error('Error toggling schedule:', error);
      toast({
        title: "Error",
        description: "Failed to update schedule status",
        variant: "destructive"
      });
    }
  };

  const deleteSchedule = async (schedule: AlertSchedule) => {
    if (!confirm(`Are you sure you want to delete the schedule "${schedule.schedule_name}"?`)) {
      return;
    }

    try {
      const { error } = await window.ezsite.apis.tableDelete('12642', {
        ID: schedule.id
      });

      if (error) throw error;

      toast({
        title: "Schedule Deleted",
        description: `Schedule "${schedule.schedule_name}" has been deleted.`
      });

      loadSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: "Error",
        description: "Failed to delete schedule",
        variant: "destructive"
      });
    }
  };

  const runScheduleNow = async (schedule: AlertSchedule) => {
    try {
      // This would trigger the schedule immediately
      // For now, we'll just update the next_run time to trigger it
      const now = new Date();
      const nextRun = new Date(now.getTime() + schedule.frequency_days * 24 * 60 * 60 * 1000);

      const { error } = await window.ezsite.apis.tableUpdate('12642', {
        ID: schedule.id,
        last_run: now.toISOString(),
        next_run: nextRun.toISOString()
      });

      if (error) throw error;

      toast({
        title: "🚀 Schedule Triggered",
        description: `Schedule "${schedule.schedule_name}" has been triggered manually.`
      });

      loadSchedules();
    } catch (error) {
      console.error('Error running schedule:', error);
      toast({
        title: "Error",
        description: "Failed to trigger schedule",
        variant: "destructive"
      });
    }
  };

  const formatNextRun = (dateString: string) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    if (diffHours < 0) {
      return 'Overdue';
    } else if (diffHours < 24) {
      return `In ${diffHours} hours`;
    } else {
      const diffDays = Math.round(diffHours / 24);
      return `In ${diffDays} days`;
    }
  };

  const getStatusBadge = (schedule: AlertSchedule) => {
    if (!schedule.is_active) {
      return <Badge variant="secondary">Paused</Badge>;
    }

    const nextRun = new Date(schedule.next_run);
    const now = new Date();

    if (nextRun <= now) {
      return <Badge className="bg-orange-100 text-orange-800">Due</Badge>;
    }

    return <Badge className="bg-green-100 text-green-800">Active</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Timer className="w-6 h-6 mr-2" />
            SMS Alert Scheduler
          </h2>
          <p className="text-gray-600">Configure automated SMS alerts for license expiries and other events</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Alert Schedule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="schedule-name">Schedule Name</Label>
                <Input
                  id="schedule-name"
                  value={newSchedule.schedule_name}
                  onChange={(e) => setNewSchedule({ ...newSchedule, schedule_name: e.target.value })}
                  placeholder="e.g., License Expiry Alerts" />

              </div>
              
              <div>
                <Label htmlFor="alert-type">Alert Type</Label>
                <Select value={newSchedule.alert_type} onValueChange={(value) => setNewSchedule({ ...newSchedule, alert_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="License Expiry">License Expiry</SelectItem>
                    <SelectItem value="Inventory Alert">Inventory Alert</SelectItem>
                    <SelectItem value="System Notification">System Notification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="days-before">Days Before Expiry</Label>
                <Select value={newSchedule.days_before_expiry.toString()} onValueChange={(value) => setNewSchedule({ ...newSchedule, days_before_expiry: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="14">14 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="60">60 Days</SelectItem>
                    <SelectItem value="90">90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="frequency">Frequency (Days)</Label>
                <Select value={newSchedule.frequency_days.toString()} onValueChange={(value) => setNewSchedule({ ...newSchedule, frequency_days: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Daily</SelectItem>
                    <SelectItem value="3">Every 3 Days</SelectItem>
                    <SelectItem value="7">Weekly</SelectItem>
                    <SelectItem value="14">Bi-weekly</SelectItem>
                    <SelectItem value="30">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="template">SMS Template</Label>
                <Select value={newSchedule.template_id.toString()} onValueChange={(value) => setNewSchedule({ ...newSchedule, template_id: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) =>
                    <SelectItem key={template.id} value={template.id.toString()}>
                        {template.template_name}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="station-filter">Station Filter</Label>
                <Select value={newSchedule.station_filter} onValueChange={(value) => setNewSchedule({ ...newSchedule, station_filter: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Stations</SelectItem>
                    <SelectItem value="MOBIL">MOBIL</SelectItem>
                    <SelectItem value="AMOCO ROSEDALE">AMOCO ROSEDALE</SelectItem>
                    <SelectItem value="AMOCO BROOKLYN">AMOCO BROOKLYN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={newSchedule.is_active}
                  onCheckedChange={(checked) => setNewSchedule({ ...newSchedule, is_active: checked })} />

                <Label htmlFor="active">Active</Label>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={createSchedule}
                  disabled={creating || !newSchedule.schedule_name || !newSchedule.template_id}
                  className="flex-1">

                  {creating ? 'Creating...' : 'Create Schedule'}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Schedules List */}
      <div className="grid gap-4">
        {loading ?
        <Card>
            <CardContent className="pt-6">
              <div className="text-center">Loading schedules...</div>
            </CardContent>
          </Card> :
        schedules.length === 0 ?
        <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Timer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Schedules Configured</h3>
                <p className="text-gray-500">Create your first alert schedule to start automating SMS notifications.</p>
              </div>
            </CardContent>
          </Card> :

        schedules.map((schedule) =>
        <Card key={schedule.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium">{schedule.schedule_name}</h3>
                      {getStatusBadge(schedule)}
                      <Badge variant="outline">{schedule.alert_type}</Badge>
                      <Badge variant="outline">{schedule.station_filter}</Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          {schedule.days_before_expiry} days before expiry
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Every {schedule.frequency_days} days
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Next: {formatNextRun(schedule.next_run)}
                        </span>
                      </div>
                      
                      {schedule.last_run &&
                  <div className="text-xs text-gray-500">
                          Last run: {new Date(schedule.last_run).toLocaleString()}
                        </div>
                  }
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runScheduleNow(schedule)}
                  disabled={!schedule.is_active}>

                      <Play className="w-4 h-4 mr-1" />
                      Run Now
                    </Button>
                    
                    <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleSchedule(schedule)}>

                      {schedule.is_active ?
                  <><Pause className="w-4 h-4 mr-1" />Pause</> :

                  <><Play className="w-4 h-4 mr-1" />Activate</>
                  }
                    </Button>
                    
                    <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteSchedule(schedule)}>

                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
        )
        }
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Timer className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{schedules.length}</div>
              <p className="text-sm text-gray-600">Total Schedules</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{schedules.filter((s) => s.is_active).length}</div>
              <p className="text-sm text-gray-600">Active Schedules</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Bell className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {schedules.filter((s) => s.is_active && new Date(s.next_run) <= new Date()).length}
              </div>
              <p className="text-sm text-gray-600">Due Now</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);

};

export default SMSAlertScheduler;