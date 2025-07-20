import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NumberInput } from '@/components/ui/number-input';
import { Progress } from '@/components/ui/progress';
import { Plus, Upload, CheckCircle, AlertCircle, DollarSign, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Vendor {
  id: number;
  vendor_name: string;
  category: string;
  is_active: boolean;
}

interface ExpenseFormData {
  vendor: string;
  othersName: string;
  amount: number;
  paymentType: 'Cash' | 'Credit Card' | 'Cheque';
  chequeNumber: string;
  invoiceFileId?: number;
  invoiceFileName?: string;
}

interface ExpenseFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseFormData) => void;
  loading?: boolean;
}

const ExpenseFormDialog: React.FC<ExpenseFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false
}) => {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState<ExpenseFormData>({
    vendor: '',
    othersName: '',
    amount: 0,
    paymentType: 'Cash',
    chequeNumber: '',
    invoiceFileId: undefined,
    invoiceFileName: ''
  });

  // Load vendors when dialog opens
  useEffect(() => {
    if (open) {
      loadVendors();
      // Reset form when dialog opens
      setFormData({
        vendor: '',
        othersName: '',
        amount: 0,
        paymentType: 'Cash',
        chequeNumber: '',
        invoiceFileId: undefined,
        invoiceFileName: ''
      });
      setUploadProgress(0);
    }
  }, [open]);

  const loadVendors = async () => {
    try {
      setLoadingVendors(true);
      const { data, error } = await window.ezsite.apis.tablePage(11729, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'vendor_name',
        IsAsc: true,
        Filters: [
        { name: 'is_active', op: 'Equal', value: true }]

      });

      if (error) throw new Error(error);
      setVendors(data?.List || []);
    } catch (error) {
      console.error('Error loading vendors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vendors',
        variant: 'destructive'
      });
    } finally {
      setLoadingVendors(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (accept common document types)
    const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];


    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PDF, image, or document file',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload a file smaller than 10MB',
        variant: 'destructive'
      });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const { data: fileId, error } = await window.ezsite.apis.upload({
        filename: file.name,
        file: file
      });

      clearInterval(progressInterval);

      if (error) throw new Error(error);

      setUploadProgress(100);
      setFormData((prev) => ({
        ...prev,
        invoiceFileId: fileId,
        invoiceFileName: file.name
      }));

      toast({
        title: 'Success',
        description: 'Invoice uploaded successfully'
      });

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload invoice file',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.vendor && !formData.othersName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please select a vendor or enter Other\'s Name',
        variant: 'destructive'
      });
      return;
    }

    if (formData.amount <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid amount',
        variant: 'destructive'
      });
      return;
    }

    if (formData.paymentType === 'Cheque' && !formData.chequeNumber.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Cheque number is required for cheque payments',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.invoiceFileId) {
      toast({
        title: 'Validation Error',
        description: 'Invoice upload is mandatory',
        variant: 'destructive'
      });
      return;
    }

    onSubmit(formData);
    onClose();
  };

  const updateFormData = (field: keyof ExpenseFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      vendor: '',
      othersName: '',
      amount: 0,
      paymentType: 'Cash',
      chequeNumber: '',
      invoiceFileId: undefined,
      invoiceFileName: ''
    });
    setUploadProgress(0);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Add Expense
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vendor Selection */}
          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor Name</Label>
            <Select
              value={formData.vendor}
              onValueChange={(value) => {
                updateFormData('vendor', value);
                // Clear others name when vendor is selected
                if (value && value !== "none") updateFormData('othersName', '');
              }}
              disabled={loadingVendors}>

              <SelectTrigger>
                <SelectValue placeholder={loadingVendors ? "Loading vendors..." : "Select vendor"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select a vendor</SelectItem>
                {vendors.map((vendor) =>
                <SelectItem key={vendor.id} value={vendor.vendor_name}>
                    {vendor.vendor_name} ({vendor.category})
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Others Name */}
          <div className="space-y-2">
            <Label htmlFor="othersName">Other's Name</Label>
            <Input
              id="othersName"
              value={formData.othersName}
              onChange={(e) => {
                updateFormData('othersName', e.target.value);
                // Clear vendor when others name is entered
                if (e.target.value) updateFormData('vendor', '');
              }}
              placeholder="Enter name if not using vendor list"
              disabled={!!(formData.vendor && formData.vendor !== "none")} />

            {formData.vendor && formData.vendor !== "none" &&
            <p className="text-sm text-gray-500">
                Clear vendor selection to enter other's name
              </p>
            }
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <NumberInput
              id="amount"
              value={formData.amount}
              onChange={(value) => updateFormData('amount', value)}
              placeholder="0.00"
              min={0}
              step={0.01}
              required />

          </div>

          {/* Payment Type */}
          <div className="space-y-2">
            <Label htmlFor="paymentType">Payment Type *</Label>
            <Select
              value={formData.paymentType}
              onValueChange={(value: 'Cash' | 'Credit Card' | 'Cheque') => {
                updateFormData('paymentType', value);
                // Clear cheque number if not cheque payment
                if (value !== 'Cheque') updateFormData('chequeNumber', '');
              }}>

              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cheque Number (conditional) */}
          {formData.paymentType === 'Cheque' &&
          <div className="space-y-2">
              <Label htmlFor="chequeNumber">Cheque Number *</Label>
              <Input
              id="chequeNumber"
              value={formData.chequeNumber}
              onChange={(e) => updateFormData('chequeNumber', e.target.value)}
              placeholder="Enter cheque number"
              required />

            </div>
          }

          {/* Invoice Upload */}
          <div className="space-y-2">
            <Label htmlFor="invoice">Invoice Upload *</Label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="invoice"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading} />

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('invoice')?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2">

                  <Upload className="h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Choose File'}
                </Button>
                {formData.invoiceFileName &&
                <span className="text-sm text-gray-600 truncate">
                    {formData.invoiceFileName}
                  </span>
                }
              </div>

              {/* Upload Progress */}
              {uploading &&
              <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-gray-600">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              }

              {/* Upload Status */}
              {formData.invoiceFileId && !uploading &&
              <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Invoice uploaded successfully</span>
                </div>
              }

              {!formData.invoiceFileId && !uploading &&
              <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Invoice upload is required</span>
                </div>
              }
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
              disabled={loading || uploading}>

              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || uploading || !formData.invoiceFileId}
              className="flex items-center gap-2">

              <Plus className="h-4 w-4" />
              {loading ? 'Adding...' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>);

};

export default ExpenseFormDialog;