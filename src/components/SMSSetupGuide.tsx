import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Phone, Settings, CheckCircle } from 'lucide-react';

const SMSSetupGuide: React.FC = () => {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-700">
          <MessageSquare className="w-6 h-6 mr-2" />
          SMS Alert Setup Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Phone className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">1. Add SMS Contacts</h4>
              <p className="text-sm text-gray-600">
                Go to SMS Alert Management → SMS Contacts tab and add mobile numbers
              </p>
              <Badge variant="outline" className="mt-1 text-xs">
                Format: +1234567890
              </Badge>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Settings className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">2. Configure Settings</h4>
              <p className="text-sm text-gray-600">
                Set up alert timing and message templates in Alert Settings tab
              </p>
              <Badge variant="outline" className="mt-1 text-xs">
                Default: 30 days before expiry
              </Badge>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">3. Test SMS</h4>
              <p className="text-sm text-gray-600">
                Click "Send Test SMS" to verify your phone number receives messages
              </p>
              <Badge variant="outline" className="mt-1 text-xs">
                Check your mobile device
              </Badge>
            </div>
          </div>
        </div>

        <div className="border-t border-blue-200 pt-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h5 className="font-medium text-yellow-800 mb-1">📱 Important Notes:</h5>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Phone numbers must be in international format (+1 for US/Canada)</li>
              <li>• SMS service uses TextBelt for testing (free tier has limitations)</li>
              <li>• For production, configure a premium SMS provider (Twilio, AWS SNS)</li>
              <li>• Test SMS will be sent to ALL active contacts</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>);

};

export default SMSSetupGuide;