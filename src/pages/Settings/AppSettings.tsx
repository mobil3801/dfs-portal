
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  User,
  Bell,
  Database,
  Shield,
  Save } from
'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const AppSettings = () => {
  const { user, userProfile, isAdmin, isManager } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    notifications: {
      emailAlerts: true,
      smsAlerts: false,
      desktopNotifications: true,
      alertFrequency: 'daily'
    },
    preferences: {
      theme: 'light',
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      currency: 'USD'
    },
    security: {
      sessionTimeout: 30,
      requirePasswordChange: false,
      twoFactorAuth: false
    }
  });

  const [profileData, setProfileData] = useState({
    phone: userProfile?.phone || '',
    station: userProfile?.station || ''
  });

  useEffect(() => {
    // Load user preferences from database if needed
    if (userProfile) {
      setProfileData({
        phone: userProfile.phone || '',
        station: userProfile.station || ''
      });
    }
  }, [userProfile]);

  const handleSaveProfile = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);

      const { error } = await window.ezsite.apis.tableUpdate(11725, {
        id: userProfile.id,
        phone: profileData.phone,
        station: profileData.station
      });

      if (error) {
        throw new Error(error);
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);

      // In a real implementation, you would save settings to a user preferences table

      toast({
        title: "Settings Saved",
        description: "Your preferences have been saved"
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Application Settings</h1>
          <p className="text-gray-600">Manage your account and application preferences</p>
        </div>
        <Badge variant="outline">{userProfile?.role}</Badge>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full lg:w-[400px] grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-6">
              <User className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Profile Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={user?.Name || ''}
                  disabled
                  className="bg-gray-50" />

                <p className="text-xs text-gray-500 mt-1">Contact admin to change name</p>
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.Email || ''}
                  disabled
                  className="bg-gray-50" />

                <p className="text-xs text-gray-500 mt-1">Contact admin to change email</p>
              </div>
              
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="Enter phone number" />

              </div>
              
              <div>
                <Label htmlFor="station">Station</Label>
                <Select
                  value={profileData.station}
                  onValueChange={(value) => setProfileData({ ...profileData, station: value })}>

                  <SelectTrigger>
                    <SelectValue placeholder="Select station" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MOBIL">MOBIL</SelectItem>
                    <SelectItem value="AMOCO ROSEDALE">AMOCO ROSEDALE</SelectItem>
                    <SelectItem value="AMOCO BROOKLYN">AMOCO BROOKLYN</SelectItem>
                    <SelectItem value="ALL">All Stations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={userProfile?.role || ''}
                  disabled
                  className="bg-gray-50" />

                <p className="text-xs text-gray-500 mt-1">Contact admin to change role</p>
              </div>
              
              <div>
                <Label htmlFor="employee-id">Employee ID</Label>
                <Input
                  id="employee-id"
                  value={userProfile?.employee_id || ''}
                  disabled
                  className="bg-gray-50" />

              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button onClick={handleSaveProfile} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Profile
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Bell className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Notification Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Alerts</Label>
                  <p className="text-sm text-gray-600">Receive alerts via email</p>
                </div>
                <Switch
                  checked={settings.notifications.emailAlerts}
                  onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, emailAlerts: checked }
                  })
                  } />

              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>SMS Alerts</Label>
                  <p className="text-sm text-gray-600">Receive alerts via SMS</p>
                </div>
                <Switch
                  checked={settings.notifications.smsAlerts}
                  onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, smsAlerts: checked }
                  })
                  } />

              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Desktop Notifications</Label>
                  <p className="text-sm text-gray-600">Show browser notifications</p>
                </div>
                <Switch
                  checked={settings.notifications.desktopNotifications}
                  onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, desktopNotifications: checked }
                  })
                  } />

              </div>
              
              <div>
                <Label>Alert Frequency</Label>
                <Select
                  value={settings.notifications.alertFrequency}
                  onValueChange={(value) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, alertFrequency: value }
                  })
                  }>

                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="daily">Daily Summary</SelectItem>
                    <SelectItem value="weekly">Weekly Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button onClick={handleSaveSettings} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Notifications
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Settings className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Application Preferences</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Theme</Label>
                <Select
                  value={settings.preferences.theme}
                  onValueChange={(value) =>
                  setSettings({
                    ...settings,
                    preferences: { ...settings.preferences, theme: value }
                  })
                  }>

                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Language</Label>
                <Select
                  value={settings.preferences.language}
                  onValueChange={(value) =>
                  setSettings({
                    ...settings,
                    preferences: { ...settings.preferences, language: value }
                  })
                  }>

                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Date Format</Label>
                <Select
                  value={settings.preferences.dateFormat}
                  onValueChange={(value) =>
                  setSettings({
                    ...settings,
                    preferences: { ...settings.preferences, dateFormat: value }
                  })
                  }>

                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Currency</Label>
                <Select
                  value={settings.preferences.currency}
                  onValueChange={(value) =>
                  setSettings({
                    ...settings,
                    preferences: { ...settings.preferences, currency: value }
                  })
                  }>

                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button onClick={handleSaveSettings} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>);

};

export default AppSettings;