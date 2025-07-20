import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Phone, Settings, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface SMSAlertStatusProps {
  className?: string;
}

const SMSAlertStatus: React.FC<SMSAlertStatusProps> = ({ className = '' }) => {
  const [activeContacts, setActiveContacts] = useState(0);
  const [activeSettings, setActiveSettings] = useState(0);
  const [recentAlerts, setRecentAlerts] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadSMSStatus();
  }, []);

  const loadSMSStatus = async () => {
    try {
      setLoading(true);

      // Load active contacts
      const contactsResponse = await window.ezsite.apis.tablePage('12612', {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [{ name: 'is_active', op: 'Equal', value: true }]
      });

      if (!contactsResponse.error) {
        setActiveContacts(contactsResponse.data?.List?.length || 0);
      }

      // Load active settings
      const settingsResponse = await window.ezsite.apis.tablePage('12611', {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [{ name: 'is_active', op: 'Equal', value: true }]
      });

      if (!settingsResponse.error) {
        setActiveSettings(settingsResponse.data?.List?.length || 0);
      }

      // Load recent alerts (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const historyResponse = await window.ezsite.apis.tablePage('12613', {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'sent_date',
        IsAsc: false,
        Filters: [
        { name: 'sent_date', op: 'GreaterThanOrEqual', value: weekAgo.toISOString() }]

      });

      if (!historyResponse.error) {
        setRecentAlerts(historyResponse.data?.List?.length || 0);
      }
    } catch (error) {
      console.error('Error loading SMS status:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendTestAlert = async () => {
    try {
      const testMessage = "Test SMS: This is a test message from DFS Manager License Alert System.";

      // Get active contacts
      const contactsResponse = await window.ezsite.apis.tablePage('12612', {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'id',
        IsAsc: false,
        Filters: [{ name: 'is_active', op: 'Equal', value: true }]
      });

      if (contactsResponse.error) throw contactsResponse.error;

      const contacts = contactsResponse.data?.List || [];

      if (contacts.length === 0) {
        toast({
          title: "No Contacts",
          description: "Please add SMS contacts first",
          variant: "destructive"
        });
        return;
      }

      // Send test SMS to all active contacts
      for (const contact of contacts) {
        await window.ezsite.apis.tableCreate('12613', {
          license_id: 0, // Test SMS
          contact_id: contact.id,
          mobile_number: contact.mobile_number,
          message_content: testMessage,
          sent_date: new Date().toISOString(),
          delivery_status: 'Test Sent',
          days_before_expiry: 0,
          created_by: 1
        });
      }

      toast({
        title: "Test SMS Sent",
        description: `Test SMS sent to ${contacts.length} contacts`
      });

      loadSMSStatus(); // Refresh stats
    } catch (error) {
      console.error('Error sending test SMS:', error);
      toast({
        title: "Error",
        description: "Failed to send test SMS",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>);

  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-lg">
          <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
          SMS Alert System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Phone className="w-4 h-4 text-green-600 mr-1" />
            </div>
            <p className="text-2xl font-bold text-green-600">{activeContacts}</p>
            <p className="text-xs text-gray-600">Active Contacts</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Settings className="w-4 h-4 text-blue-600 mr-1" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{activeSettings}</p>
            <p className="text-xs text-gray-600">Alert Settings</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Send className="w-4 h-4 text-orange-600 mr-1" />
            </div>
            <p className="text-2xl font-bold text-orange-600">{recentAlerts}</p>
            <p className="text-xs text-gray-600">Recent Alerts</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t">
          <Badge
            variant={activeContacts > 0 && activeSettings > 0 ? 'default' : 'secondary'}
            className="text-xs">

            {activeContacts > 0 && activeSettings > 0 ? 'System Active' : 'Setup Required'}
          </Badge>
          
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={sendTestAlert}
              className="text-xs px-2 py-1 h-7"
              disabled={activeContacts === 0}>

              Test SMS
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/admin/sms-alerts')}
              className="text-xs px-2 py-1 h-7">

              Manage
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>);

};

export default SMSAlertStatus;