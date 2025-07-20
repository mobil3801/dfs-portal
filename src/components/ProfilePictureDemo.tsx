import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Upload,
  Eye,
  Settings,
  Download,
  RefreshCw,
  Users,
  Shield,
  Edit,
  UserCircle } from
'lucide-react';

import ProfilePicture from '@/components/ProfilePicture';
import UserProfilePicture from '@/components/UserProfilePicture';
import EmployeeProfilePicture from '@/components/EmployeeProfilePicture';
import { useAuth } from '@/contexts/AuthContext';

const ProfilePictureDemo: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [demoImageId, setDemoImageId] = useState<number | null>(null);
  const [firstName, setFirstName] = useState('John');
  const [lastName, setLastName] = useState('Doe');
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, userProfile, isAuthenticated } = useAuth();

  // Load sample employees data
  useEffect(() => {
    loadSampleEmployees();
  }, []);

  const loadSampleEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await window.ezsite.apis.tablePage('11727', {
        PageNo: 1,
        PageSize: 10,
        OrderByField: 'first_name',
        IsAsc: true,
        Filters: []
      });

      if (response.error) {
        console.error('Error loading employees:', response.error);
      } else {
        setEmployees(response.data?.List || []);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    if (file) {
      toast({
        title: "File Selected",
        description: `${file.name} is ready for preview`
      });
    }
  };

  const handleUploadDemo = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file first",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await window.ezsite.apis.upload({
        filename: selectedFile.name,
        file: selectedFile
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setDemoImageId(response.data);
      toast({
        title: "Upload Successful",
        description: "Profile picture uploaded successfully"
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearDemo = () => {
    setSelectedFile(null);
    setDemoImageId(null);
    setFirstName('John');
    setLastName('Doe');
    toast({
      title: "Demo Reset",
      description: "All demo data has been cleared"
    });
  };

  const sampleSizes = [
  { size: 'sm' as const, label: 'Small (32px)' },
  { size: 'md' as const, label: 'Medium (40px)' },
  { size: 'lg' as const, label: 'Large (64px)' },
  { size: 'xl' as const, label: 'Extra Large (96px)' },
  { size: '2xl' as const, label: '2X Large (128px)' }];


  const sampleStates = [
  {
    title: 'With Image',
    props: { imageId: demoImageId, firstName, lastName, allowEdit: true },
    description: 'Shows uploaded profile picture with edit functionality'
  },
  {
    title: 'With Preview',
    props: { previewFile: selectedFile, firstName, lastName, allowEdit: true },
    description: 'Shows file preview before upload'
  },
  {
    title: 'Initials Only',
    props: { firstName, lastName, allowEdit: true },
    description: 'Shows initials when no image'
  },
  {
    title: 'Default Icon',
    props: { firstName: '', lastName: '', allowEdit: true },
    description: 'Shows default user icon'
  },
  {
    title: 'Read Only',
    props: { firstName, lastName, allowEdit: false },
    description: 'Display-only mode without edit functionality'
  },
  {
    title: 'Error State',
    props: { imageId: 99999, firstName, lastName, allowEdit: true },
    description: 'Shows error state for invalid image'
  }];


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enhanced Profile Picture Demo</h1>
          <p className="text-gray-600 mt-1">
            Demonstration of the enhanced ProfilePicture component with editing capabilities
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={clearDemo}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2">

            <RefreshCw className="w-4 h-4" />
            <span>Reset Demo</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="showcase" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="showcase">Showcase</TabsTrigger>
          <TabsTrigger value="user-profile">User Profile</TabsTrigger>
          <TabsTrigger value="upload">Upload Test</TabsTrigger>
          <TabsTrigger value="employees">Employee Gallery</TabsTrigger>
          <TabsTrigger value="variations">Variations</TabsTrigger>
        </TabsList>

        {/* Showcase Tab */}
        <TabsContent value="showcase">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleStates.map((state, index) =>
            <Card key={index} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{state.title}</CardTitle>
                    <Badge variant="secondary">{state.title.toLowerCase().replace(' ', '-')}</Badge>
                  </div>
                  <CardDescription>{state.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                  <ProfilePicture
                  {...state.props}
                  size="xl"
                  enableHover
                  className="ring-2 ring-blue-100" />

                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      {state.props.firstName || state.props.lastName ?
                    `${state.props.firstName} ${state.props.lastName}`.trim() :
                    'No Name'
                    }
                    </p>
                    {state.props.allowEdit &&
                  <Badge variant="outline" className="mt-1">
                        <Edit className="w-3 h-3 mr-1" />
                        Editable
                      </Badge>
                  }
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* User Profile Tab */}
        <TabsContent value="user-profile">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserCircle className="w-5 h-5" />
                  <span>Current User Profile</span>
                </CardTitle>
                <CardDescription>
                  Your profile picture with full editing capabilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isAuthenticated ?
                <div className="flex flex-col items-center space-y-4">
                    <UserProfilePicture
                    size="2xl"
                    allowEdit={true}
                    enableHover={true}
                    className="ring-4 ring-blue-100" />

                    <div className="text-center">
                      <p className="font-medium">{user?.Name || 'Current User'}</p>
                      <p className="text-sm text-gray-500">{user?.Email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Role: {userProfile?.role || 'Employee'}
                      </p>
                    </div>
                    <Badge variant="default">
                      <Edit className="w-3 h-3 mr-1" />
                      Click to edit your profile picture
                    </Badge>
                  </div> :

                <div className="text-center py-8">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Please log in to view your profile</p>
                  </div>
                }
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Profile Settings</span>
                </CardTitle>
                <CardDescription>
                  Different display options for your profile picture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-4">Size Variations</h3>
                    <div className="flex items-center justify-center space-x-4">
                      {['sm', 'md', 'lg', 'xl'].map((size) =>
                      <div key={size} className="text-center space-y-2">
                          <UserProfilePicture
                          size={size as any}
                          allowEdit={false}
                          enableHover={true}
                          className="ring-2 ring-gray-100" />

                          <p className="text-xs text-gray-500">{size}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-4">Shape Variations</h3>
                    <div className="flex items-center justify-center space-x-4">
                      {['full', 'xl', 'lg', 'md'].map((rounded) =>
                      <div key={rounded} className="text-center space-y-2">
                          <UserProfilePicture
                          size="lg"
                          rounded={rounded as any}
                          allowEdit={false}
                          enableHover={true}
                          className="ring-2 ring-gray-100" />

                          <p className="text-xs text-gray-500">
                            {rounded === 'full' ? 'circular' : `rounded-${rounded}`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Upload Test Tab */}
        <TabsContent value="upload">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Manual Upload Test</span>
                </CardTitle>
                <CardDescription>
                  Test the profile picture upload functionality manually
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name" />

                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter last name" />

                  </div>
                </div>

                <Separator />

                <div className="flex justify-center">
                  <ProfilePicture
                    imageId={demoImageId}
                    firstName={firstName}
                    lastName={lastName}
                    previewFile={selectedFile}
                    size="2xl"
                    allowEdit={true}
                    enableHover={true}
                    className="ring-4 ring-blue-100"
                    onImageUpdate={(newImageId) => {
                      setDemoImageId(newImageId);
                      toast({
                        title: "Demo Updated",
                        description: "Demo profile picture updated"
                      });
                    }} />

                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    {firstName || lastName ? `${firstName} ${lastName}`.trim() : 'No Name'}
                  </p>
                  <Badge variant="outline">
                    <Edit className="w-3 h-3 mr-1" />
                    Click avatar to edit
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span>Live Preview</span>
                </CardTitle>
                <CardDescription>
                  See how the component looks with different states
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Current State</h3>
                    <ProfilePicture
                      imageId={demoImageId}
                      firstName={firstName}
                      lastName={lastName}
                      previewFile={selectedFile}
                      size="2xl"
                      allowEdit={false}
                      enableHover={true}
                      className="ring-4 ring-blue-100" />

                    <p className="text-sm text-gray-600 mt-2">
                      {firstName || lastName ? `${firstName} ${lastName}`.trim() : 'No Name'}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium">Current Status:</h4>
                    <div className="flex flex-wrap gap-2">
                      {demoImageId &&
                      <Badge variant="default">
                          <Download className="w-3 h-3 mr-1" />
                          Uploaded Image
                        </Badge>
                      }
                      {selectedFile &&
                      <Badge variant="secondary">
                          <Eye className="w-3 h-3 mr-1" />
                          Preview File
                        </Badge>
                      }
                      {!demoImageId && !selectedFile &&
                      <Badge variant="outline">
                          <User className="w-3 h-3 mr-1" />
                          No Image
                        </Badge>
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Employee Gallery Tab */}
        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Employee Gallery</span>
              </CardTitle>
              <CardDescription>
                View existing employee profile pictures from the database
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ?
              <div className="flex items-center justify-center p-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  <span>Loading employees...</span>
                </div> :
              employees.length > 0 ?
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {employees.map((employee) =>
                <div key={employee.id} className="text-center space-y-2">
                      <EmployeeProfilePicture
                    employeeId={employee.id}
                    size="lg"
                    allowEdit={true}
                    enableHover={true}
                    className="ring-2 ring-gray-100 hover:ring-blue-200" />

                      <div>
                        <p className="text-sm font-medium">
                          {employee.first_name} {employee.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {employee.position || 'Employee'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {employee.station}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          <Edit className="w-3 h-3 mr-1" />
                          Editable
                        </Badge>
                      </div>
                    </div>
                )}
                </div> :

              <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No employees found</p>
                  <p className="text-sm text-gray-500">
                    Add employees to see their profile pictures here
                  </p>
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        {/* Variations Tab */}
        <TabsContent value="variations">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Size Variations</span>
                </CardTitle>
                <CardDescription>
                  Different sizes available for the ProfilePicture component
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {sampleSizes.map((sizeOption) =>
                  <div key={sizeOption.size} className="text-center space-y-3">
                      <ProfilePicture
                      imageId={demoImageId}
                      firstName={firstName}
                      lastName={lastName}
                      previewFile={selectedFile}
                      size={sizeOption.size}
                      allowEdit={true}
                      enableHover={true}
                      className="ring-2 ring-blue-100" />

                      <div>
                        <p className="text-sm font-medium">{sizeOption.label}</p>
                        <p className="text-xs text-gray-500">Size: {sizeOption.size}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Shape Variations</span>
                </CardTitle>
                <CardDescription>
                  Different border radius options for the ProfilePicture component
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {['full', 'xl', 'lg', 'md'].map((roundedOption) =>
                  <div key={roundedOption} className="text-center space-y-3">
                      <ProfilePicture
                      imageId={demoImageId}
                      firstName={firstName}
                      lastName={lastName}
                      previewFile={selectedFile}
                      size="xl"
                      rounded={roundedOption as any}
                      allowEdit={true}
                      enableHover={true}
                      className="ring-2 ring-blue-100" />

                      <div>
                        <p className="text-sm font-medium">
                          {roundedOption === 'full' ? 'Circular' : `Rounded ${roundedOption}`}
                        </p>
                        <p className="text-xs text-gray-500">rounded-{roundedOption}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>);

};

export default ProfilePictureDemo;