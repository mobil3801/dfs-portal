import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, Building2, Mail, Phone, MapPin, Eye, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useModuleAccess } from '@/contexts/ModuleAccessContext';
import { useAuth } from '@/contexts/AuthContext';
import ViewModal from '@/components/ViewModal';
import { useListKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { motion } from 'motion/react';

interface Vendor {
  ID: number;
  vendor_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  payment_terms: string;
  is_active: boolean;
  created_by: number;
}

const VendorList: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const navigate = useNavigate();

  // Auth context for admin checking
  const { isAdmin } = useAuth();

  // Module Access Control
  const {
    canCreate,
    canEdit,
    canDelete,
    isModuleAccessEnabled
  } = useModuleAccess();

  // Permission checks for vendors module
  const canCreateVendor = canCreate('vendors');
  const canEditVendor = canEdit('vendors') && isAdmin(); // Restrict to admin only
  const canDeleteVendor = canDelete('vendors') && isAdmin(); // Restrict to admin only

  const pageSize = 10;

  useEffect(() => {
    loadVendors();
  }, [currentPage, searchTerm]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const filters = [];

      if (searchTerm) {
        filters.push({ name: 'vendor_name', op: 'StringContains', value: searchTerm });
      }

      const { data, error } = await window.ezsite.apis.tablePage('11729', {
        PageNo: currentPage,
        PageSize: pageSize,
        OrderByField: 'vendor_name',
        IsAsc: true,
        Filters: filters
      });

      if (error) throw error;

      setVendors(data?.List || []);
      setTotalCount(data?.VirtualCount || 0);
    } catch (error) {
      console.error('Error loading vendors:', error);
      toast({
        title: "Error",
        description: "Failed to load vendors",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setSelectedVendorId(vendor.ID);
    setViewModalOpen(true);
  };

  const handleEdit = (vendorId: number) => {
    // Check admin permission first
    if (!isAdmin()) {
      toast({
        title: "Access Denied",
        description: "Only administrators can edit vendors.",
        variant: "destructive"
      });
      return;
    }

    // Check edit permission
    if (!canEditVendor) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit vendors.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Validate vendor ID exists
      const vendor = vendors.find((v) => v.ID === vendorId);
      if (!vendor) {
        toast({
          title: "Error",
          description: "Vendor not found. Please refresh the list and try again.",
          variant: "destructive"
        });
        loadVendors(); // Refresh the list
        return;
      }

      // Navigate to edit form
      navigate(`/vendors/${vendorId}/edit`);

      // Log for debugging
      console.log('Navigating to edit vendor:', vendorId, vendor);
    } catch (error) {
      console.error('Error navigating to edit form:', error);
      toast({
        title: "Navigation Error",
        description: "Failed to open edit form. Please try again.",
        variant: "destructive"
      });
    }
  };


  const handleDelete = async (vendorId: number) => {
    // Check admin permission first
    if (!isAdmin()) {
      toast({
        title: "Access Denied",
        description: "Only administrators can delete vendors.",
        variant: "destructive"
      });
      return;
    }

    // Check delete permission
    if (!canDeleteVendor) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete vendors.",
        variant: "destructive"
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this vendor?')) {
      return;
    }

    try {
      const { error } = await window.ezsite.apis.tableDelete('11729', { ID: vendorId });
      if (error) throw error;

      toast({
        title: "Success",
        description: "Vendor deleted successfully"
      });
      loadVendors();
      setViewModalOpen(false);
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast({
        title: "Error",
        description: "Failed to delete vendor",
        variant: "destructive"
      });
    }
  };

  const handleExport = () => {
    if (!selectedVendor) return;

    const csvContent = [
    'Field,Value',
    `Vendor Name,${selectedVendor.vendor_name}`,
    `Contact Person,${selectedVendor.contact_person}`,
    `Email,${selectedVendor.email}`,
    `Phone,${selectedVendor.phone}`,
    `Address,${selectedVendor.address}`,
    `Category,${selectedVendor.category}`,
    `Payment Terms,${selectedVendor.payment_terms}`,
    `Status,${selectedVendor.is_active ? 'Active' : 'Inactive'}`].
    join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendor_${selectedVendor.vendor_name.replace(/\s+/g, '_')}_details.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Vendor details exported successfully"
    });
  };

  const handleCreateVendor = () => {
    // Check create permission
    if (!canCreateVendor) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create vendors.",
        variant: "destructive"
      });
      return;
    }

    navigate('/vendors/new');
  };

  // Keyboard shortcuts
  useListKeyboardShortcuts(
    selectedVendorId,
    (id) => {
      const vendor = vendors.find((v) => v.ID === id);
      if (vendor) handleView(vendor);
    },
    handleEdit,
    handleDelete,
    handleCreateVendor
  );

  const getCategoryBadgeColor = (category: string) => {
    const colors = {
      'Fuel Supplier': 'bg-blue-500',
      'Food & Beverages': 'bg-green-500',
      'Automotive': 'bg-orange-500',
      'Maintenance': 'bg-purple-500',
      'Office Supplies': 'bg-gray-500',
      'Technology': 'bg-indigo-500'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  // Define view modal fields
  const getViewModalFields = (vendor: Vendor) => [
  {
    key: 'vendor_name',
    label: 'Vendor Name',
    value: vendor.vendor_name,
    type: 'text' as const,
    icon: Building2
  },
  {
    key: 'contact_person',
    label: 'Contact Person',
    value: vendor.contact_person,
    type: 'text' as const
  },
  {
    key: 'email',
    label: 'Email',
    value: vendor.email,
    type: 'email' as const
  },
  {
    key: 'phone',
    label: 'Phone',
    value: vendor.phone,
    type: 'phone' as const
  },
  {
    key: 'address',
    label: 'Address',
    value: vendor.address,
    type: 'text' as const,
    icon: MapPin
  },
  {
    key: 'category',
    label: 'Category',
    value: vendor.category,
    type: 'badge' as const,
    badgeColor: getCategoryBadgeColor(vendor.category)
  },
  {
    key: 'payment_terms',
    label: 'Payment Terms',
    value: vendor.payment_terms,
    type: 'text' as const
  },
  {
    key: 'is_active',
    label: 'Status',
    value: vendor.is_active,
    type: 'boolean' as const
  }];


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="w-6 h-6" />
                <span>Vendors</span>
              </CardTitle>
              <CardDescription>
                Manage your vendor contacts and information
              </CardDescription>
            </div>
            
            {/* Only show Add Vendor button if create permission is enabled */}
            {canCreateVendor ?
            <Button onClick={handleCreateVendor} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Vendor</span>
              </Button> :
            isModuleAccessEnabled &&
            <Badge variant="secondary" className="text-xs">
                Create access disabled by admin
              </Badge>
            }
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10" />

            </div>
          </div>

          {/* Keyboard shortcuts hint */}
          

          {/* Vendors Table */}
          {loading ?
          <div className="space-y-4">
              {[...Array(5)].map((_, i) =>
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
            )}
            </div> :
          vendors.length === 0 ?
          <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No vendors found</p>
              {canCreateVendor &&
            <Button
              variant="outline"
              className="mt-4"
              onClick={handleCreateVendor}>
                  Add Your First Vendor
                </Button>
            }
            </div> :

          <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.map((vendor, index) =>
                <motion.tr
                  key={vendor.ID}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`border-b hover:bg-gray-50 transition-colors cursor-pointer ${
                  selectedVendorId === vendor.ID ? 'bg-blue-50 border-blue-200' : ''}`
                  }
                  onClick={() => setSelectedVendorId(vendor.ID)}>

                      <TableCell>
                        <div>
                          <p className="font-medium">{vendor.vendor_name}</p>
                          {vendor.address &&
                      <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-xs">{vendor.address}</span>
                            </div>
                      }
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{vendor.contact_person}</p>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {vendor.email &&
                      <div className="flex items-center space-x-1 text-sm">
                              <Mail className="w-3 h-3" />
                              <span>{vendor.email}</span>
                            </div>
                      }
                          {vendor.phone &&
                      <div className="flex items-center space-x-1 text-sm">
                              <Phone className="w-3 h-3" />
                              <span>{vendor.phone}</span>
                            </div>
                      }
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-white ${getCategoryBadgeColor(vendor.category)}`}>
                          {vendor.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{vendor.payment_terms || 'N/A'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={vendor.is_active ? "default" : "secondary"}>
                          {vendor.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(vendor);
                        }}
                        className="text-blue-600 hover:text-blue-700">

                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {/* Only show Edit button if user is admin */}
                          {isAdmin() && canEditVendor &&
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(vendor.ID);
                        }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                      }
                          
                          {/* Only show Delete button if user is admin */}
                          {isAdmin() && canDeleteVendor &&
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(vendor.ID);
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
          {(!isAdmin() || !canEditVendor || !canDeleteVendor) && isModuleAccessEnabled &&
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">
                <strong>Access Restrictions:</strong>
                {!isAdmin() && " Edit and Delete access restricted to administrators only."}
                {isAdmin() && !canEditVendor && " Edit access disabled by admin."}
                {isAdmin() && !canDeleteVendor && " Delete access disabled by admin."}
              </p>
            </div>
          }

          {/* Pagination */}
          {totalPages > 1 &&
          <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-700">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} vendors
              </p>
              <div className="flex items-center space-x-2">
                <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}>

                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}>

                  Next
                </Button>
              </div>
            </div>
          }
        </CardContent>
      </Card>
      
      {/* View Modal */}
      {selectedVendor &&
      <ViewModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedVendor(null);
          setSelectedVendorId(null);
        }}
        title={selectedVendor.vendor_name}
        subtitle={`Contact: ${selectedVendor.contact_person} • ${selectedVendor.category}`}
        data={selectedVendor}
        fields={getViewModalFields(selectedVendor)}
        onEdit={() => {
          setViewModalOpen(false);
          handleEdit(selectedVendor.ID);
        }}
        onDelete={() => handleDelete(selectedVendor.ID)}
        onExport={handleExport}
        canEdit={isAdmin() && canEditVendor}
        canDelete={isAdmin() && canDeleteVendor}
        canExport={true} />

      }
    </div>);

};

export default VendorList;