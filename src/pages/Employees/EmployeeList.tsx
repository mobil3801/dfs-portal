import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Search, Edit, Trash2, Users, Mail, Phone, Plus, Eye, Download, User, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useModuleAccess } from '@/contexts/ModuleAccessContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStationStore } from '@/hooks/use-station-store';
import ViewModal from '@/components/ViewModal';
import { useListKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { motion } from 'motion/react';
import ResponsiveTable from '@/components/ResponsiveTable';
import { useIsMobile } from '@/hooks/use-mobile';
import ProfilePicture from '@/components/ProfilePicture';
import DocumentPreview from '@/components/DocumentPreview';
import InstantDocumentPreview from '@/components/InstantDocumentPreview';
import { displayPhoneNumber } from '@/utils/phoneFormatter';

interface Employee {
  ID: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  station: string;
  shift: string;
  hire_date: string;
  salary: number;
  is_active: boolean;
  employment_status: string;
  created_by: number;
  profile_image_id?: number | null;
  date_of_birth?: string;
  current_address?: string;
  mailing_address?: string;
  reference_name?: string;
  id_document_type?: string;
  id_document_file_id?: number | null;
  id_document_2_file_id?: number | null;
  id_document_3_file_id?: number | null;
  id_document_4_file_id?: number | null;
}

const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStation, setSelectedStation] = useState<string>('ALL');
  const [totalCount, setTotalCount] = useState(0);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Authentication and Admin Check
  const { isAdmin } = useAuth();
  const isAdminUser = isAdmin();

  // Central station store for real-time updates
  const { getFilteredStationOptions } = useStationStore();

  // Module Access Control
  const {
    canCreate,
    canEdit,
    canDelete,
    isModuleAccessEnabled
  } = useModuleAccess();

  // Permission checks for employees module - only admin users can edit/delete
  const canCreateEmployee = canCreate('employees');
  const canEditEmployee = canEdit('employees') && isAdminUser;
  const canDeleteEmployee = canDelete('employees') && isAdminUser;

  // Custom sorting function for Status and Station priority
  const sortEmployeesByStatusAndStation = (employees: Employee[]) => {
    return employees.sort((a, b) => {
      // Define status priority: Ongoing = 1, Left = 2, Terminated = 3
      const getStatusPriority = (status: string) => {
        switch (status) {
          case 'Ongoing':
            return 1;
          case 'Left':
            return 2;
          case 'Terminated':
            return 3;
          default:
            return 1; // Default to Ongoing priority for any unspecified status
        }
      };

      const statusA = a.employment_status || 'Ongoing';
      const statusB = b.employment_status || 'Ongoing';

      const priorityA = getStatusPriority(statusA);
      const priorityB = getStatusPriority(statusB);

      // First sort by status priority
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Within the same status, sort by station alphabetically
      const stationA = a.station || '';
      const stationB = b.station || '';
      if (stationA !== stationB) {
        return stationA.localeCompare(stationB);
      }

      // Within the same status and station, sort by name for consistency
      const nameA = `${a.first_name} ${a.last_name}`;
      const nameB = `${b.first_name} ${b.last_name}`;
      return nameA.localeCompare(nameB);
    });
  };

  useEffect(() => {
    loadEmployees();
  }, [searchTerm, selectedStation]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const filters = [];

      if (searchTerm) {
        filters.push({ name: 'first_name', op: 'StringContains', value: searchTerm });
      }

      if (selectedStation && selectedStation !== 'ALL') {
        filters.push({ name: 'station', op: 'Equal', value: selectedStation });
      }

      // Fetch all employees by setting a very high PageSize
      const { data, error } = await window.ezsite.apis.tablePage('11727', {
        PageNo: 1,
        PageSize: 10000, // Set a very high page size to get all employees
        OrderByField: 'ID',
        IsAsc: true,
        Filters: filters
      });

      if (error) throw error;

      // Apply custom sorting by Status and Station
      const sortedEmployees = sortEmployeesByStatusAndStation(data?.List || []);

      setEmployees(sortedEmployees);
      setTotalCount(data?.VirtualCount || 0);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (employee: Employee) => {
    setSelectedEmployee(employee);
    setSelectedEmployeeId(employee.ID);
    setViewModalOpen(true);
  };

  const handleEdit = (employeeId: number) => {
    // Check admin permission for edit
    if (!isAdminUser) {
      toast({
        title: "Admin Access Required",
        description: "Only administrators can edit employee records.",
        variant: "destructive"
      });
      return;
    }

    // Check module edit permission
    if (!canEditEmployee) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit employees.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Validate employee ID exists
      const employee = employees.find((emp) => emp.ID === employeeId);
      if (!employee) {
        toast({
          title: "Error",
          description: "Employee not found. Please refresh the list and try again.",
          variant: "destructive"
        });
        loadEmployees(); // Refresh the list
        return;
      }

      // Navigate to edit form
      navigate(`/employees/${employeeId}/edit`);

      
    } catch (error) {
      console.error('Error navigating to edit form:', error);
      toast({
        title: "Navigation Error",
        description: "Failed to open edit form. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (employeeId: number) => {
    // Check admin permission for delete
    if (!isAdminUser) {
      toast({
        title: "Admin Access Required",
        description: "Only administrators can delete employee records.",
        variant: "destructive"
      });
      return;
    }

    // Check module delete permission
    if (!canDeleteEmployee) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete employees.",
        variant: "destructive"
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      const { error } = await window.ezsite.apis.tableDelete('11727', { ID: employeeId });
      if (error) throw error;

      toast({
        title: "Success",
        description: "Employee deleted successfully"
      });
      loadEmployees();
      setViewModalOpen(false);
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive"
      });
    }
  };

  const handleExport = () => {
    if (!selectedEmployee) return;

    const csvContent = [
    'Field,Value',
    `Employee ID,${selectedEmployee.employee_id}`,
    `Name,${selectedEmployee.first_name} ${selectedEmployee.last_name}`,
    `Email,${selectedEmployee.email}`,
    `Phone,${selectedEmployee.phone}`,
    `Position,${selectedEmployee.position}`,
    `Station,${selectedEmployee.station}`,
    `Shift,${selectedEmployee.shift}`,
    `Hire Date,${selectedEmployee.hire_date}`,
    `Salary,${selectedEmployee.salary}`,
    `Employment Status,${selectedEmployee.employment_status}`,
    `Status,${selectedEmployee.is_active ? 'Active' : 'Inactive'}`].
    join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee_${selectedEmployee.employee_id}_details.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Employee details exported successfully"
    });
  };

  const handleCreateEmployee = () => {
    // Check create permission
    if (!canCreateEmployee) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create employees.",
        variant: "destructive"
      });
      return;
    }

    navigate('/employees/new');
  };

  // Keyboard shortcuts
  useListKeyboardShortcuts(
    selectedEmployeeId,
    (id) => {
      const employee = employees.find((emp) => emp.ID === id);
      if (employee) handleView(employee);
    },
    handleEdit,
    handleDelete,
    handleCreateEmployee
  );

  const getStationBadgeColor = (station: string) => {
    switch (station.toUpperCase()) {
      case 'MOBIL':
        return 'bg-blue-500';
      case 'AMOCO ROSEDALE':
        return 'bg-green-500';
      case 'AMOCO BROOKLYN':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEmploymentStatusColor = (status: string) => {
    switch (status) {
      case 'Ongoing':
        return 'bg-green-500';
      case 'Terminated':
        return 'bg-red-500';
      case 'Left':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const ShiftBadge = ({ shift }: {shift: string;}) => {
    switch (shift) {
      case 'Day':
        return (
          <Badge className="bg-white text-black border border-gray-300 hover:bg-gray-50">
            {shift}
          </Badge>);

      case 'Night':
        return (
          <Badge className="bg-black text-white hover:bg-gray-800">
            {shift}
          </Badge>);

      case 'Day & Night':
        return (
          <div className="relative inline-flex rounded-md overflow-hidden border border-gray-300">
            <div className="bg-white text-black px-2 py-1 text-xs font-medium border-r border-gray-300">
              Day
            </div>
            <div className="bg-black text-white px-2 py-1 text-xs font-medium">
              Night
            </div>
          </div>);

      default:
        return (
          <Badge className="bg-gray-100 text-gray-700">
            {shift || 'N/A'}
          </Badge>);

    }
  };

  // Enhanced ID Documents Display Component with Instant Image Previews
  const IDDocumentsDisplay = ({ employee }: {employee: Employee;}) => {
    const documents = [
    { fileId: employee.id_document_file_id, label: 'ID Document 1' },
    { fileId: employee.id_document_2_file_id, label: 'ID Document 2' },
    { fileId: employee.id_document_3_file_id, label: 'ID Document 3' },
    { fileId: employee.id_document_4_file_id, label: 'ID Document 4' }].
    filter((doc) => doc.fileId);

    if (documents.length === 0) {
      return (
        <div className="text-center py-6 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm font-medium">No ID documents uploaded</p>
          <p className="text-xs text-gray-400 mt-1">ID documents will appear here once uploaded</p>
        </div>);

    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-800">ID Documents ({documents.length})</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              Always visible
            </Badge>
            {isAdminUser &&
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                Admin: Download enabled
              </Badge>
            }
          </div>
        </div>
        
        {/* Document Type Information */}
        {employee.id_document_type &&
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Document Type:</strong> {employee.id_document_type}
            </p>
          </div>
        }
        
        {/* Enhanced Document Display Grid - Always Visible Like Profile Pictures */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {documents.map((doc, index) =>
          <div key={index} className="relative">
              <InstantDocumentPreview
              fileId={doc.fileId}
              fileName={doc.label}
              documentName={doc.label}
              size="lg"
              aspectRatio="landscape"
              showRemoveButton={false}
              showDownload={isAdminUser}
              showFullscreen={true}
              showInstantPreview={true}
              className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-lg overflow-hidden" />

              
              {/* Document Label */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                {doc.label}
              </div>
              
              {/* View Full Size Button */}
              <div className="absolute top-2 right-2">
                <Button
                variant="secondary"
                size="sm"
                className="h-6 px-2 bg-white bg-opacity-90 hover:bg-opacity-100"
                onClick={() => {








                  // This will be handled by the InstantDocumentPreview component
                }}>
                  <Eye className="w-3 h-3" />
                </Button>
              </div>
            </div>)}
        </div>

        {/* Information Panel */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p>• All ID documents are always visible like profile pictures</p>
          <p>• Click on any document to view in full screen</p>
          {isAdminUser ? <p>• <strong>Admin:</strong> Download buttons are visible for document management</p> : <p>• Download access is restricted to administrators only</p>}
        </div>
      </div>);};

  // Define view modal fields with profile picture, employment status, and ID documents
  const getViewModalFields = (employee: Employee) => [
  {
    key: 'profile_picture',
    label: 'Profile Picture',
    value: employee.profile_image_id,
    type: 'custom' as const,
    customComponent:
    <div className="flex justify-center">
          <ProfilePicture
        imageId={employee.profile_image_id}
        firstName={employee.first_name}
        lastName={employee.last_name}
        size="xl"
        className="border-2 border-gray-200" />

        </div>

  },
  {
    key: 'employee_id',
    label: 'Employee ID',
    value: employee.employee_id,
    type: 'text' as const,
    icon: User
  },
  {
    key: 'name',
    label: 'Full Name',
    value: `${employee.first_name} ${employee.last_name}`,
    type: 'text' as const,
    icon: User
  },
  {
    key: 'email',
    label: 'Email',
    value: employee.email,
    type: 'email' as const
  },
  {
    key: 'phone',
    label: 'Phone',
    value: displayPhoneNumber(employee.phone),
    type: 'phone' as const
  },
  {
    key: 'position',
    label: 'Position',
    value: employee.position,
    type: 'text' as const
  },
  {
    key: 'station',
    label: 'Station',
    value: employee.station,
    type: 'badge' as const,
    badgeColor: getStationBadgeColor(employee.station)
  },
  {
    key: 'shift',
    label: 'Shift',
    value: employee.shift,
    type: 'custom' as const,
    customComponent: <ShiftBadge shift={employee.shift} />
  },
  {
    key: 'employment_status',
    label: 'Employment Status',
    value: employee.employment_status,
    type: 'badge' as const,
    badgeColor: getEmploymentStatusColor(employee.employment_status)
  },
  {
    key: 'hire_date',
    label: 'Hire Date',
    value: employee.hire_date,
    type: 'date' as const
  },
  {
    key: 'date_of_birth',
    label: 'Date of Birth',
    value: employee.date_of_birth,
    type: 'date' as const
  },
  {
    key: 'current_address',
    label: 'Current Address',
    value: employee.current_address,
    type: 'text' as const
  },
  {
    key: 'mailing_address',
    label: 'Mailing Address',
    value: employee.mailing_address,
    type: 'text' as const
  },
  {
    key: 'reference_name',
    label: 'Reference Name',
    value: employee.reference_name,
    type: 'text' as const
  },
  {
    key: 'id_documents',
    label: 'ID Documents',
    value: 'id_documents',
    type: 'custom' as const,
    customComponent: <IDDocumentsDisplay employee={employee} />
  },
  {
    key: 'salary',
    label: 'Salary',
    value: employee.salary,
    type: 'currency' as const
  },
  {
    key: 'is_active',
    label: 'Active Status',
    value: employee.is_active,
    type: 'custom' as const,
    customComponent:
    <Badge
      className={`text-white ${employee.is_active ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>

          {employee.is_active ? "Active" : "Inactive"}
        </Badge>

  }];


  // Mobile view for smaller screens
  if (isMobile) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Users className="w-5 h-5" />
                  <span>All Employees</span>
                </CardTitle>
                <CardDescription className="text-sm">
                  Displaying all {totalCount} employees
                </CardDescription>
              </div>
              
              {canCreateEmployee &&
              <Button size="sm" onClick={handleCreateEmployee}>
                  <Plus className="w-4 h-4" />
                </Button>
              }
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filter */}
            <div className="space-y-3">
              <Select value={selectedStation} onValueChange={setSelectedStation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Station" />
                </SelectTrigger>
                <SelectContent>
                  {getFilteredStationOptions(true).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10" />

              </div>
            </div>

            {/* Employee Cards */}
            {loading ?
            <div className="space-y-3">
                {[...Array(5)].map((_, i) =>
              <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
              )}
              </div> :
            employees.length === 0 ?
            <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No employees found</p>
                {canCreateEmployee &&
              <Button variant="outline" className="mt-4" onClick={handleCreateEmployee}>
                    Add Your First Employee
                  </Button>
              }
              </div> :

            <div className="space-y-3">
                {employees.map((employee, index) =>
              <motion.div
                key={employee.ID}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}>

                    <Card
                  className={`cursor-pointer transition-colors ${
                  selectedEmployeeId === employee.ID ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`
                  }
                  onClick={() => setSelectedEmployeeId(employee.ID)}>

                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <ProfilePicture
                        imageId={employee.profile_image_id}
                        firstName={employee.first_name}
                        lastName={employee.last_name}
                        size="md" />

                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-gray-900 truncate">
                                {employee.first_name} {employee.last_name}
                              </h3>
                              <Badge
                            className={`text-white text-xs ${getEmploymentStatusColor(employee.employment_status || 'Ongoing')}`}>

                                {employee.employment_status || 'Ongoing'}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-500">{employee.position}</p>
                            <p className="text-xs text-gray-400">{employee.employee_id}</p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center space-x-2">
                                <Badge
                              className={`text-white text-xs ${getStationBadgeColor(employee.station)}`}>

                                  {employee.station}
                                </Badge>
                                <ShiftBadge shift={employee.shift} />
                              </div>
                              
                              <div className="flex space-x-1">
                                <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleView(employee);
                              }}
                              className="p-1 h-6 w-6">

                                  <Eye className="w-3 h-3" />
                                </Button>
                                {canEditEmployee &&
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(employee.ID);
                              }}
                              className="p-1 h-6 w-6">

                                    <Edit className="w-3 h-3" />
                                  </Button>
                            }
                                {canDeleteEmployee &&
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(employee.ID);
                              }}
                              className="p-1 h-6 w-6 text-red-600 hover:text-red-700">

                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                            }
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
              )}
              </div>
            }
          </CardContent>
        </Card>

        {/* View Modal */}
        {selectedEmployee &&
        <ViewModal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedEmployee(null);
            setSelectedEmployeeId(null);
          }}
          title={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
          subtitle={`Employee ID: ${selectedEmployee.employee_id} • ${selectedEmployee.position}`}
          data={selectedEmployee}
          fields={getViewModalFields(selectedEmployee)}
          onEdit={() => {
            setViewModalOpen(false);
            handleEdit(selectedEmployee.ID);
          }}
          onDelete={() => handleDelete(selectedEmployee.ID)}
          onExport={handleExport}
          canEdit={canEditEmployee}
          canDelete={canDeleteEmployee}
          canExport={true} />

        }
      </div>);

  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-6 h-6" />
                <span>All Employees</span>
              </CardTitle>
              <CardDescription>
                Displaying all {totalCount} employees across all stations (sorted by status: Ongoing → Left → Terminated, then by station)
              </CardDescription>
            </div>
            
            {/* Only show Add Employee button if create permission is enabled */}
            {canCreateEmployee ?
            <Button
              onClick={handleCreateEmployee}
              className="flex items-center space-x-2">

                <Plus className="w-4 h-4" />
                <span>Add Employee</span>
              </Button> :

            isModuleAccessEnabled &&
            <Badge variant="secondary" className="text-xs">
                  Create access disabled by admin
                </Badge>

            }
          </div>
        </CardHeader>
        <CardContent>
          {/* Station Filter */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-64">
              <Select value={selectedStation} onValueChange={setSelectedStation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Station" />
                </SelectTrigger>
                <SelectContent>
                  {getFilteredStationOptions(true).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10" />

            </div>
          </div>

          {/* Employees Table */}
          {loading ?
          <div className="space-y-4">
              {[...Array(5)].map((_, i) =>
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
            )}
            </div> :
          employees.length === 0 ?
          <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No employees found</p>
              {canCreateEmployee &&
            <Button
              variant="outline"
              className="mt-4"
              onClick={handleCreateEmployee}>

                  Add Your First Employee
                </Button>
            }
            </div> :

          <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profile</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Employment Status</TableHead>
                    <TableHead>Hire Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee, index) =>
                <motion.tr
                  key={employee.ID}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`border-b hover:bg-gray-50 transition-colors cursor-pointer ${
                  selectedEmployeeId === employee.ID ? 'bg-blue-50 border-blue-200' : ''}`
                  }
                  onClick={() => setSelectedEmployeeId(employee.ID)}>

                      <TableCell>
                        <ProfilePicture
                      imageId={employee.profile_image_id}
                      firstName={employee.first_name}
                      lastName={employee.last_name}
                      size="sm" />

                      </TableCell>
                      <TableCell className="font-medium">{employee.employee_id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{employee.first_name} {employee.last_name}</p>
                          <p className="text-sm text-gray-500">{employee.position}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {employee.email &&
                      <div className="flex items-center space-x-1 text-sm">
                              <Mail className="w-3 h-3" />
                              <span>{employee.email}</span>
                            </div>
                      }
                          {employee.phone &&
                      <div className="flex items-center space-x-1 text-sm">
                              <Phone className="w-3 h-3" />
                              <span>{displayPhoneNumber(employee.phone)}</span>
                            </div>
                      }
                        </div>
                      </TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>
                        <Badge className={`text-white ${getStationBadgeColor(employee.station)}`}>
                          {employee.station}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ShiftBadge shift={employee.shift} />
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-white ${getEmploymentStatusColor(employee.employment_status || 'Ongoing')}`}>
                          {employee.employment_status || 'Ongoing'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(employee.hire_date)}</TableCell>
                      <TableCell>
                        <Badge
                      className={`text-white ${employee.is_active ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>

                          {employee.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(employee);
                        }}
                        className="text-blue-600 hover:text-blue-700">

                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {/* Only show Edit button if edit permission is enabled */}
                          {canEditEmployee &&
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(employee.ID);
                        }}>

                              <Edit className="w-4 h-4" />
                            </Button>
                      }
                          
                          {/* Only show Delete button if delete permission is enabled */}
                          {canDeleteEmployee &&
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(employee.ID);
                        }}
                        className="text-red-600 hover:text-red-700">

                              <Trash2 className="w-4 h-4" />
                            </Button>
                      }
                        </div>
                      </TableCell>
                    </motion.tr>
                )}
                </TableBody>
              </Table>
            </div>
          }

          {/* Show permission status when actions are disabled */}
          {(!isAdminUser || !canEditEmployee || !canDeleteEmployee) &&
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">
                <strong>Access Restrictions:</strong>
                {!isAdminUser && " Edit & Delete access restricted to administrators only."}
                {isAdminUser && !canEditEmployee && " Edit access disabled by module settings."}
                {isAdminUser && !canDeleteEmployee && " Delete access disabled by module settings."}
              </p>
            </div>
          }
        </CardContent>
      </Card>
      
      {/* View Modal */}
      {selectedEmployee &&
      <ViewModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedEmployee(null);
          setSelectedEmployeeId(null);
        }}
        title={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
        subtitle={`Employee ID: ${selectedEmployee.employee_id} • ${selectedEmployee.position}`}
        data={selectedEmployee}
        fields={getViewModalFields(selectedEmployee)}
        onEdit={() => {
          setViewModalOpen(false);
          handleEdit(selectedEmployee.ID);
        }}
        onDelete={() => handleDelete(selectedEmployee.ID)}
        onExport={handleExport}
        canEdit={canEditEmployee}
        canDelete={canDeleteEmployee}
        canExport={true} />

      }
    </div>);

};

export default EmployeeList;