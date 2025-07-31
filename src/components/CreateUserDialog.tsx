import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Mail, Building2, Shield, Eye, EyeOff, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminUserService, type AdminCreateUserData } from '@/services/adminUserService';

interface CreateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

interface UserFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  station: string;
  employee_id: string;
  hire_date: string;
}

const CreateUserDialog: React.FC<CreateUserDialogProps> = ({ isOpen, onClose, onUserCreated }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'Employee',
    station: 'MOBIL',
    employee_id: '',
    hire_date: new Date().toISOString().split('T')[0]
  });

  const roles = ['Administrator', 'Management', 'Employee'];
  const stations = ['ALL', 'MOBIL', 'AMOCO ROSEDALE', 'AMOCO BROOKLYN'];

  const generateEmployeeId = () => {
    // Handle ALL station case
    const prefix = formData.station === 'ALL' ? 'ALL' : formData.station.split(' ')[0].substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
  };

  const generatePassword = () => {
    const length = 12;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.email || !formData.email.includes('@')) {
      return 'Please enter a valid email address';
    }
    if (!formData.password || formData.password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!formData.firstName.trim()) {
      return 'First name is required';
    }
    if (!formData.lastName.trim()) {
      return 'Last name is required';
    }
    if (!formData.phone.trim()) {
      return 'Phone number is required';
    }
    if (!formData.employee_id.trim()) {
      return 'Employee ID is required';
    }
    return null;
  };

  const handleCreateUser = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Starting admin user creation process...');

      // Use the admin service to create user (bypasses signup restrictions)
      const userData: AdminCreateUserData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: formData.role,
        station: formData.station,
        employee_id: formData.employee_id,
        hire_date: formData.hire_date
      };

      const result = await adminUserService.createUser(userData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create user account');
      }

      console.log('User created successfully with ID:', result.userId);

      const stationText = formData.station === 'ALL' ? 'all stations' : formData.station;
      toast({
        title: "Success",
        description: `User account created successfully for ${formData.firstName} ${formData.lastName} with access to ${stationText}. Account is ready for immediate use.`
      });

      // Reset form
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'Employee',
        station: 'MOBIL',
        employee_id: '',
        hire_date: new Date().toISOString().split('T')[0]
      });

      onUserCreated();
      onClose();

    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const getStationIcon = (station: string) => {
    if (station === 'ALL') {
      return <Globe className="w-4 h-4" />;
    }
    return <Building2 className="w-4 h-4" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>Create New User</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Mail className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold">Account Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="user@example.com"
                    required
                    disabled={loading} />

                </div>
                
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Enter password"
                      required
                      disabled={loading} />

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}>

                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange('password', generatePassword())}
                      disabled={loading}>

                      Generate Password
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <User className="w-4 h-4 text-green-600" />
                <h3 className="font-semibold">Personal Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="John"
                    required
                    disabled={loading} />

                </div>
                
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Doe"
                    required
                    disabled={loading} />

                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    required
                    disabled={loading} />

                </div>
                
                <div>
                  <Label htmlFor="hire_date">Hire Date</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => handleInputChange('hire_date', e.target.value)}
                    disabled={loading} />

                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Information */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="w-4 h-4 text-purple-600" />
                <h3 className="font-semibold">Work Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange('role', value)}
                    disabled={loading}>

                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) =>
                      <SelectItem key={role} value={role}>
                          <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4" />
                            <span>{role}</span>
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="station">Station *</Label>
                  <Select
                    value={formData.station}
                    onValueChange={(value) => handleInputChange('station', value)}
                    disabled={loading}>

                    <SelectTrigger>
                      <SelectValue placeholder="Select station" />
                    </SelectTrigger>
                    <SelectContent>
                      {stations.map((station) =>
                      <SelectItem key={station} value={station}>
                          <div className="flex items-center space-x-2">
                            {getStationIcon(station)}
                            <span>{station === 'ALL' ? 'ALL STATIONS' : station}</span>
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {formData.station === 'ALL' &&
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-xs text-blue-700">
                        <Globe className="w-3 h-3 inline mr-1" />
                        This user will have access to data from all stations based on their role permissions.
                      </p>
                    </div>
                  }
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="employee_id">Employee ID *</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="employee_id"
                      value={formData.employee_id}
                      onChange={(e) => handleInputChange('employee_id', e.target.value)}
                      placeholder="EMP-123456"
                      required
                      disabled={loading} />

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleInputChange('employee_id', generateEmployeeId())}
                      disabled={loading}>

                      Generate
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Preview */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="w-4 h-4 text-orange-600" />
                <h3 className="font-semibold">Permissions Preview</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Dashboard Access</span>
                  <Badge variant="default">Granted</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sales Reports</span>
                  <Badge variant={formData.role !== 'Employee' ? 'default' : 'secondary'}>
                    {formData.role !== 'Employee' ? 'Full Access' : 'View Only'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">User Management</span>
                  <Badge variant={formData.role === 'admin' ? 'default' : 'secondary'}>
                    {formData.role === 'admin' ? 'Full Access' : 'No Access'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">System Administration</span>
                  <Badge variant={formData.role === 'admin' ? 'default' : 'secondary'}>
                    {formData.role === 'admin' ? 'Full Access' : 'No Access'}
                  </Badge>
                </div>
                {formData.station === 'ALL' &&
                <div className="flex items-center justify-between">
                    <span className="text-sm">Station Access</span>
                    <Badge variant="default" className="bg-blue-600">
                      <Globe className="w-3 h-3 mr-1" />
                      All Stations
                    </Badge>
                  </div>
                }
              </div>
              
              <Alert className="mt-4">
                <AlertDescription className="text-sm">
                  Permissions can be customized after user creation through the User Management interface.
                  {formData.station === 'ALL' &&
                  <span className="block mt-2 text-blue-700">
                      <strong>Note:</strong> Multi-station access allows this user to work with data from all stations according to their role permissions.
                    </span>
                  }
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}>

              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700">

              {loading ?
              <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating User...
                </> :

              <>
                  <User className="w-4 h-4 mr-2" />
                  Create User Account
                </>
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>);

};

export default CreateUserDialog;