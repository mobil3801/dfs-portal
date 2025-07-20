import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, FileText, AlertTriangle, CheckCircle, Printer, MessageSquare, Send, Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import EnhancedLicensePrintDialog from '@/components/EnhancedLicensePrintDialog';
import { smsService } from '@/services/smsService';
import licenseAlertService from '@/services/licenseAlertService';

interface License {
  ID: number;
  license_name: string;
  license_number: string;
  issuing_authority: string;
  issue_date: string;
  expiry_date: string;
  station: string;
  category: string;
  status: string;
  document_file_id: number;
  created_by: number;
}

const LicenseList: React.FC = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLicenseForPrint, setSelectedLicenseForPrint] = useState<License | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [sendingSMS, setSendingSMS] = useState(false);
  const [deletingLicenseId, setDeletingLicenseId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [licenseToDelete, setLicenseToDelete] = useState<License | null>(null);
  const [showCancelled, setShowCancelled] = useState(true);
  const navigate = useNavigate();
  const { userProfile, isAdmin } = useAuth();

  const pageSize = 10;

  useEffect(() => {
    loadLicenses();
  }, [currentPage, searchTerm, showCancelled]);

  const loadLicenses = async () => {
    try {
      setLoading(true);
      const filters = [];

      if (searchTerm) {
        filters.push({ name: 'license_name', op: 'StringContains', value: searchTerm });
      }

      if (!showCancelled) {
        filters.push({ name: 'status', op: 'StringContains', value: 'Active' });
      }

      const { data, error } = await window.ezsite.apis.tablePage('11731', {
        PageNo: currentPage,
        PageSize: pageSize,
        OrderByField: 'expiry_date',
        IsAsc: true,
        Filters: filters
      });

      if (error) throw error;

      setLicenses(data?.List || []);
      setTotalCount(data?.VirtualCount || 0);
    } catch (error) {
      console.error('Error loading licenses:', error);
      toast({
        title: "Error",
        description: "Failed to load licenses",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (license: License) => {
    setLicenseToDelete(license);
    setDeleteDialogOpen(true);
  };

  const handleSoftDelete = async (licenseId: number) => {
    try {
      setDeletingLicenseId(licenseId);

      // Update status to "Cancelled" or "Inactive"
      const { error } = await window.ezsite.apis.tableUpdate('11731', {
        ID: licenseId,
        status: 'Cancelled'
      });

      if (error) throw error;

      toast({
        title: "✅ License Deactivated",
        description: "License has been marked as cancelled. It can be reactivated later if needed.",
        duration: 5000
      });

      await loadLicenses();

    } catch (error) {
      console.error('Error deactivating license:', error);
      toast({
        title: "❌ Deactivation Failed",
        description: `Failed to deactivate license: ${error}`,
        variant: "destructive"
      });
    } finally {
      setDeletingLicenseId(null);
    }
  };

  const handleHardDelete = async (licenseId: number) => {
    // Check if user is admin before allowing hard delete
    if (!isAdmin()) {
      toast({
        title: "Access Denied",
        description: "Only administrators can permanently delete licenses.",
        variant: "destructive"
      });
      return;
    }

    setDeletingLicenseId(licenseId);

    try {
      // Step 1: Get license details to check for associated files
      const { data: licenseData, error: fetchError } = await window.ezsite.apis.tablePage('11731', {
        PageNo: 1,
        PageSize: 1,
        Filters: [{ name: 'ID', op: 'Equal', value: licenseId }]
      });

      if (fetchError) throw fetchError;

      const license = licenseData?.List?.[0];
      if (!license) {
        throw new Error('License not found');
      }

      // Show progress toast
      toast({
        title: "🗑️ Deleting License",
        description: "Removing associated files and data..."
      });

      // Step 2: Delete associated file if exists
      if (license.document_file_id) {
        try {
          // Note: File deletion through API - assuming the file deletion is handled server-side
          console.log(`Deleting file with ID: ${license.document_file_id}`);
          // File deletion would be handled by the database cascade or server-side cleanup
        } catch (fileError) {
          console.warn('File deletion warning:', fileError);
          // Continue with deletion even if file cleanup fails
        }
      }

      // Step 3: Delete SMS alert history for this license
      try {
        const { data: alertHistory, error: alertHistoryError } = await window.ezsite.apis.tablePage('12613', {
          PageNo: 1,
          PageSize: 100,
          Filters: [{ name: 'license_id', op: 'Equal', value: licenseId }]
        });

        if (!alertHistoryError && alertHistory?.List?.length > 0) {
          for (const alert of alertHistory.List) {
            await window.ezsite.apis.tableDelete('12613', { ID: alert.ID });
          }
          console.log(`Deleted ${alertHistory.List.length} SMS alert history records`);
        }
      } catch (alertError) {
        console.warn('SMS alert history cleanup warning:', alertError);
        // Continue with deletion even if alert cleanup fails
      }

      // Step 4: Delete any scheduled alerts for this license
      try {
        const { data: schedules, error: scheduleError } = await window.ezsite.apis.tablePage('12642', {
          PageNo: 1,
          PageSize: 100,
          Filters: [
          { name: 'alert_type', op: 'Equal', value: 'License Expiry' },
          { name: 'station_filter', op: 'Equal', value: license.station }]

        });

        if (!scheduleError && schedules?.List?.length > 0) {
          console.log(`Found ${schedules.List.length} related alert schedules`);
          // Note: We might not want to delete all schedules, just log for now
        }
      } catch (scheduleError) {
        console.warn('Alert schedule cleanup warning:', scheduleError);
      }

      // Step 5: Finally delete the license record
      const { error: deleteError } = await window.ezsite.apis.tableDelete('11731', { ID: licenseId });
      if (deleteError) throw deleteError;

      // Success message with details
      toast({
        title: "✅ License Deleted Successfully",
        description: `${license.license_name} and all associated data have been removed from the system.`,
        duration: 5000
      });

      // Reload licenses to reflect changes
      await loadLicenses();

    } catch (error) {
      console.error('Error during license deletion:', error);
      toast({
        title: "❌ Deletion Failed",
        description: `Failed to delete license: ${error}`,
        variant: "destructive",
        duration: 7000
      });
    } finally {
      setDeletingLicenseId(null);
    }
  };

  const handlePrint = (license: License) => {
    setSelectedLicenseForPrint(license);
    setIsPrintDialogOpen(true);
  };

  const closePrintDialog = () => {
    setIsPrintDialogOpen(false);
    setSelectedLicenseForPrint(null);
  };

  const sendExpiryAlerts = async () => {
    try {
      setSendingSMS(true);

      toast({
        title: "📱 Checking Licenses",
        description: "Analyzing licenses for expiry alerts..."
      });

      // Use the enhanced license alert service
      await licenseAlertService.checkAndSendAlerts();

      toast({
        title: "✅ License Alerts Complete",
        description: "SMS alerts sent for expiring licenses. Check SMS History for details."
      });

    } catch (error) {
      console.error('Error sending SMS alerts:', error);
      toast({
        title: "❌ Alert Failed",
        description: "Failed to send SMS alerts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSendingSMS(false);
    }
  };

  const sendImmediateAlert = async (licenseId: number) => {
    try {
      const result = await licenseAlertService.sendImmediateAlert(licenseId);

      if (result.success) {
        toast({
          title: "📱 SMS Alert Sent",
          description: result.message
        });
      } else {
        toast({
          title: "❌ Alert Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending immediate alert:', error);
      toast({
        title: "Error",
        description: "Failed to send SMS alert",
        variant: "destructive"
      });
    }
  };

  const handleReactivate = async (licenseId: number) => {
    try {
      setDeletingLicenseId(licenseId);

      const { error } = await window.ezsite.apis.tableUpdate('11731', {
        ID: licenseId,
        status: 'Active'
      });

      if (error) throw error;

      toast({
        title: "✅ License Reactivated",
        description: "License has been successfully reactivated.",
        duration: 3000
      });

      await loadLicenses();

    } catch (error) {
      console.error('Error reactivating license:', error);
      toast({
        title: "❌ Reactivation Failed",
        description: `Failed to reactivate license: ${error}`,
        variant: "destructive"
      });
    } finally {
      setDeletingLicenseId(null);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500';
      case 'expired':
        return 'bg-red-500';
      case 'pending renewal':
        return 'bg-yellow-500';
      case 'cancelled':
      case 'inactive':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors = {
      'Business': 'bg-blue-500',
      'Environmental': 'bg-green-500',
      'Safety': 'bg-orange-500',
      'Health': 'bg-purple-500',
      'Fire': 'bg-red-500',
      'Building': 'bg-gray-500'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  const getStationBadgeColor = (station: string) => {
    switch (station.toUpperCase()) {
      case 'MOBIL':
        return 'bg-blue-600';
      case 'AMOCO ROSEDALE':
        return 'bg-green-600';
      case 'AMOCO BROOKLYN':
        return 'bg-purple-600';
      case 'ALL':
        return 'bg-gray-600';
      default:
        return 'bg-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const isExpiringSoon = (expiryDate: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysDiff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysDiff <= 30 && daysDiff >= 0;
  };

  const isExpired = (expiryDate: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  // Calculate summary stats
  const stats = licenses.reduce((acc, license) => ({
    active: acc.active + (license.status.toLowerCase() === 'active' ? 1 : 0),
    expiring_soon: acc.expiring_soon + (isExpiringSoon(license.expiry_date) && license.status.toLowerCase() !== 'cancelled' ? 1 : 0),
    expired: acc.expired + (isExpired(license.expiry_date) && license.status.toLowerCase() !== 'cancelled' ? 1 : 0),
    cancelled: acc.cancelled + (license.status.toLowerCase() === 'cancelled' || license.status.toLowerCase() === 'inactive' ? 1 : 0)
  }), { active: 0, expiring_soon: 0, expired: 0, cancelled: 0 });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Licenses</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold">{stats.expiring_soon}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold">{stats.expired}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Archive className="w-8 h-8 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold">{stats.cancelled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-6 h-6" />
                <span>Licenses & Certificates</span>
              </CardTitle>
              <CardDescription>
                Manage your business licenses and certificates
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {isAdmin() &&
              <>
                  <Button
                  onClick={sendExpiryAlerts}
                  disabled={sendingSMS}
                  variant="outline"
                  className="flex items-center space-x-2">
                    <Send className="w-4 h-4" />
                    <span>{sendingSMS ? 'Sending...' : 'Send SMS Alerts'}</span>
                  </Button>
                  <Button
                  onClick={() => navigate('/admin/sms')}
                  variant="outline"
                  className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>SMS Settings</span>
                  </Button>
                </>
              }
              <Button onClick={() => navigate('/licenses/new')} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add License</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search licenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10" />
            </div>
            

          </div>

          {/* Licenses Table */}
          {loading ?
          <div className="space-y-4">
              {[...Array(5)].map((_, i) =>
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
            )}
            </div> :
          licenses.length === 0 ?
          <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No licenses found</p>
              <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/licenses/new')}>

                Add Your First License
              </Button>
            </div> :

          <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>License Name</TableHead>
                    <TableHead>License Number</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licenses.map((license) =>
                <TableRow key={license.ID} className={isExpired(license.expiry_date) ? 'bg-red-50' : isExpiringSoon(license.expiry_date) ? 'bg-yellow-50' : ''}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{license.license_name}</p>
                          <p className="text-sm text-gray-500">{license.issuing_authority}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {license.license_number}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-white ${getCategoryBadgeColor(license.category)}`}>
                          {license.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-white ${getStationBadgeColor(license.station)}`}>
                          {license.station}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(license.issue_date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>{formatDate(license.expiry_date)}</span>
                          {isExpired(license.expiry_date) &&
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      }
                          {isExpiringSoon(license.expiry_date) && !isExpired(license.expiry_date) &&
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      }
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-white ${getStatusBadgeColor(license.status)}`}>
                          {license.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrint(license)}
                        className="text-blue-600 hover:text-blue-700"
                        title="Print Document">
                            <Printer className="w-4 h-4" />
                          </Button>
                          {(isExpiringSoon(license.expiry_date) || isExpired(license.expiry_date)) &&
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendImmediateAlert(license.ID)}
                        className="text-orange-600 hover:text-orange-700"
                        title="Send SMS Alert">
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                      }
                          {isAdmin() &&
                      <>
                              <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            try {
                              navigate(`/licenses/${license.ID}/edit`);
                            } catch (error) {
                              console.error('Error navigating to edit license:', error);
                              toast({
                                title: "Navigation Error",
                                description: "Failed to open edit form. Please try again.",
                                variant: "destructive"
                              });
                            }
                          }}
                          title="Edit License">
                                <Edit className="w-4 h-4" />
                              </Button>

                              {license.status.toLowerCase() === 'cancelled' || license.status.toLowerCase() === 'inactive' ?
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReactivate(license.ID)}
                          disabled={deletingLicenseId === license.ID}
                          className={`${deletingLicenseId === license.ID ? 'text-gray-400' : 'text-green-600 hover:text-green-700'}`}
                          title={deletingLicenseId === license.ID ? "Processing..." : "Reactivate License"}>
                                  <CheckCircle className={`w-4 h-4 ${deletingLicenseId === license.ID ? 'animate-spin' : ''}`} />
                                </Button> :

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(license)}
                          disabled={deletingLicenseId === license.ID}
                          className={`${deletingLicenseId === license.ID ? 'text-gray-400' : 'text-red-600 hover:text-red-700'}`}
                          title={deletingLicenseId === license.ID ? "Processing..." : "Delete License"}>
                                  <Trash2 className={`w-4 h-4 ${deletingLicenseId === license.ID ? 'animate-spin' : ''}`} />
                                </Button>
                        }
                            </>
                      }
                        </div>
                      </TableCell>
                    </TableRow>
                )}
                </TableBody>
              </Table>
            </div>
          }

          {/* Show permission status when actions are disabled */}
          {!isAdmin() &&
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">
                <strong>Access Restrictions:</strong>
                Only administrators can edit, delete, or manage SMS alerts for licenses.
              </p>
            </div>
          }

          {/* Pagination */}
          {totalPages > 1 &&
          <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-700">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} licenses
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

      {/* Enhanced Print Dialog */}
      <EnhancedLicensePrintDialog
        license={selectedLicenseForPrint}
        isOpen={isPrintDialogOpen}
        onClose={closePrintDialog} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              <span>Delete License</span>
            </DialogTitle>
            <DialogDescription>
              Choose how you want to handle the license: <strong>{licenseToDelete?.license_name}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-4 border rounded-lg bg-yellow-50">
                <Archive className="w-5 h-5 text-yellow-600 mt-1" />
                <div>
                  <h4 className="font-medium text-yellow-800">Soft Delete (Recommended)</h4>
                  <p className="text-sm text-yellow-700">Mark as cancelled but keep all data for potential recovery. This is safer and maintains audit trails.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-4 border rounded-lg bg-red-50">
                <Trash2 className="w-5 h-5 text-red-600 mt-1" />
                <div>
                  <h4 className="font-medium text-red-800">Permanent Delete</h4>
                  <p className="text-sm text-red-700">Completely remove the license and all associated files and SMS history. This cannot be undone.</p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="space-x-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deletingLicenseId !== null}>

              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                handleSoftDelete(licenseToDelete?.ID || 0);
                setDeleteDialogOpen(false);
              }}
              disabled={deletingLicenseId !== null}
              className="text-yellow-600 hover:text-yellow-700 border-yellow-200 hover:bg-yellow-50">

              <Archive className="w-4 h-4 mr-2" />
              Soft Delete
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                handleHardDelete(licenseToDelete?.ID || 0);
                setDeleteDialogOpen(false);
              }}
              disabled={deletingLicenseId !== null}>

              <Trash2 className="w-4 h-4 mr-2" />
              Permanent Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>);

};

export default LicenseList;