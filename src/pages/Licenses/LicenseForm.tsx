import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { FileText, Save, ArrowLeft, Upload, FileIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import EnhancedFileUpload from '@/components/EnhancedFileUpload';

interface LicenseFormData {
  license_name: string;
  license_number: string;
  issuing_authority: string;
  issue_date: string;
  expiry_date: string;
  station: string;
  category: string;
  status: string;
  document_file_id: number;
}

const LicenseForm: React.FC = () => {
  const [formData, setFormData] = useState<LicenseFormData>({
    license_name: '',
    license_number: '',
    issuing_authority: '',
    issue_date: '',
    expiry_date: '',
    station: '',
    category: '',
    status: 'Active',
    document_file_id: 0
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();

  const stations = ['MOBIL', 'AMOCO ROSEDALE', 'AMOCO BROOKLYN', 'ALL'];
  const categories = ['Business', 'Environmental', 'Safety', 'Health', 'Fire', 'Building', 'Other'];
  const statuses = ['Active', 'Expired', 'Pending Renewal'];

  useEffect(() => {
    if (id) {
      setIsEditing(true);
      loadLicense(parseInt(id));
    }
  }, [id]);

  const loadLicense = async (licenseId: number) => {
    try {
      setLoading(true);
      const { data, error } = await window.ezsite.apis.tablePage('11731', {
        PageNo: 1,
        PageSize: 1,
        Filters: [{ name: 'ID', op: 'Equal', value: licenseId }]
      });

      if (error) throw error;

      if (data && data.List && data.List.length > 0) {
        const license = data.List[0];
        setFormData({
          license_name: license.license_name || '',
          license_number: license.license_number || '',
          issuing_authority: license.issuing_authority || '',
          issue_date: license.issue_date ? license.issue_date.split('T')[0] : '',
          expiry_date: license.expiry_date ? license.expiry_date.split('T')[0] : '',
          station: license.station || '',
          category: license.category || '',
          status: license.status || 'Active',
          document_file_id: license.document_file_id || 0
        });
      }
    } catch (error) {
      console.error('Error loading license:', error);
      toast({
        title: "Error",
        description: "Failed to load license details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploadLoading(true);
      const { data, error } = await window.ezsite.apis.upload({
        filename: file.name,
        file: file
      });

      if (error) throw error;

      setFormData((prev) => ({ ...prev, document_file_id: data }));
      setUploadedFile(file);

      toast({
        title: "Success",
        description: "File uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const dataToSubmit = {
        ...formData,
        issue_date: formData.issue_date ? new Date(formData.issue_date).toISOString() : '',
        expiry_date: formData.expiry_date ? new Date(formData.expiry_date).toISOString() : '',
        created_by: 1
      };

      if (isEditing && id) {
        const { error } = await window.ezsite.apis.tableUpdate('11731', {
          ID: parseInt(id),
          ...dataToSubmit
        });
        if (error) throw error;

        toast({
          title: "Success",
          description: "License updated successfully"
        });
      } else {
        const { error } = await window.ezsite.apis.tableCreate('11731', dataToSubmit);
        if (error) throw error;

        toast({
          title: "Success",
          description: "License created successfully"
        });
      }

      navigate('/licenses');
    } catch (error) {
      console.error('Error saving license:', error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} license`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof LicenseFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-6 h-6" />
                <span>{isEditing ? 'Edit License' : 'Add New License'}</span>
              </CardTitle>
              <CardDescription>
                {isEditing ? 'Update license information' : 'Add a new license or certificate'}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate('/licenses')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Licenses
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="license_name">License Name *</Label>
                <Input
                  id="license_name"
                  value={formData.license_name}
                  onChange={(e) => handleInputChange('license_name', e.target.value)}
                  placeholder="Enter license name"
                  required />

              </div>

              <div className="space-y-2">
                <Label htmlFor="license_number">License Number *</Label>
                <Input
                  id="license_number"
                  value={formData.license_number}
                  onChange={(e) => handleInputChange('license_number', e.target.value)}
                  placeholder="Enter license number"
                  required />

              </div>

              <div className="space-y-2">
                <Label htmlFor="issuing_authority">Issuing Authority *</Label>
                <Input
                  id="issuing_authority"
                  value={formData.issuing_authority}
                  onChange={(e) => handleInputChange('issuing_authority', e.target.value)}
                  placeholder="Enter issuing authority"
                  required />

              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) =>
                    <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="station">Station *</Label>
                <Select value={formData.station} onValueChange={(value) => handleInputChange('station', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select station" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((station) =>
                    <SelectItem key={station} value={station}>
                        {station}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) =>
                    <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="issue_date">Issue Date</Label>
                <Input
                  id="issue_date"
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => handleInputChange('issue_date', e.target.value)} />

              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => handleInputChange('expiry_date', e.target.value)}
                  className={
                  isExpired(formData.expiry_date) ? 'border-red-500' :
                  isExpiringSoon(formData.expiry_date) ? 'border-yellow-500' : ''
                  } />

                {isExpired(formData.expiry_date) &&
                <p className="text-sm text-red-600">⚠️ This license has expired</p>
                }
                {isExpiringSoon(formData.expiry_date) && !isExpired(formData.expiry_date) &&
                <p className="text-sm text-yellow-600">⚠️ This license expires within 30 days</p>
                }
              </div>
            </div>

            {/* File Upload Section */}
            <div className="space-y-4">
              <Label>License Document</Label>
              <EnhancedFileUpload
                onFileSelect={handleFileUpload}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,image/*"
                label="Upload License Document or Take Photo"
                currentFile={uploadedFile?.name || (formData.document_file_id > 0 ? `Document ID: ${formData.document_file_id}` : undefined)}
                maxSize={10}
                allowCamera={true}
                disabled={uploadLoading} />

              
              {uploadedFile &&
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center space-x-2">
                    <FileIcon className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800">Recently uploaded: {uploadedFile.name}</span>
                  </div>
                </div>
              }
              
              {formData.document_file_id > 0 && !uploadedFile &&
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="flex items-center space-x-2">
                    <FileIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800">Document uploaded (ID: {formData.document_file_id})</span>
                  </div>
                </div>
              }
              
              <p className="text-sm text-gray-500">
                PDF, DOC, DOCX, JPG, PNG files up to 10MB
              </p>
            </div>

            <div className="flex items-center justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/licenses')}>

                Cancel
              </Button>
              <Button type="submit" disabled={loading || uploadLoading}>
                {loading ?
                'Saving...' :

                <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditing ? 'Update License' : 'Create License'}
                  </>
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>);

};

export default LicenseForm;