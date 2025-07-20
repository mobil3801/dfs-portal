import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { ArrowLeft, Save, Calculator, Upload, Eye, Plus, Download, FileText, AlertTriangle, DollarSign } from 'lucide-react';
import BarcodeScanner from '@/components/BarcodeScanner';
import { useAuth } from '@/contexts/AuthContext';
import { FormErrorBoundary } from '@/components/ErrorBoundary';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import EnhancedFileUpload from '@/components/EnhancedFileUpload';
import FileDisplay from '@/components/FileDisplay';

interface Vendor {
  id: number;
  vendor_name: string;
  is_active: boolean;
}

interface ProductCategory {
  id: number;
  category_name: string;
  department: string;
  is_active: boolean;
}

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const { handleApiCall, handleError } = useErrorHandler({
    component: 'ProductForm',
    severity: 'high'
  });

  const isEdit = !!id;
  const [isLoading, setIsLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [bulkUploadData, setBulkUploadData] = useState<any[]>([]);
  const [showBulkPreview, setShowBulkPreview] = useState(false);
  const [isUploadingBulk, setIsUploadingBulk] = useState(false);

  const [formData, setFormData] = useState({
    product_name: '',
    weight: 0,
    weight_unit: 'lb',
    department: 'Convenience Store',
    merchant_id: '',
    last_updated_date: new Date().toISOString().split('T')[0],
    last_shopping_date: '',
    case_price: 0,
    unit_per_case: 1,
    unit_price: 0,
    retail_price: 0,
    profit_margin: 0,
    category: '',
    supplier: '',
    quantity_in_stock: 0,
    minimum_stock: 0,
    description: '',
    bar_code_case: '',
    bar_code_unit: '',
    serial_number: 0,
    overdue: false
  });

  const [originalData, setOriginalData] = useState<any>(null);

  // USA Weight Units
  const weightUnits = [
  { value: 'lb', label: 'Pounds (lb)' },
  { value: 'oz', label: 'Ounces (oz)' },
  { value: 'ton', label: 'Tons' },
  { value: 'fl_oz', label: 'Fluid Ounces (fl oz)' },
  { value: 'gal', label: 'Gallons (gal)' },
  { value: 'qt', label: 'Quarts (qt)' },
  { value: 'pt', label: 'Pints (pt)' },
  { value: 'cup', label: 'Cups' },
  { value: 'tbsp', label: 'Tablespoons (tbsp)' },
  { value: 'tsp', label: 'Teaspoons (tsp)' }];


  // Departments based on gas station categories
  const departments = [
  'Convenience Store',
  'Fuel & Oil',
  'Automotive',
  'Food & Beverages',
  'Tobacco Products',
  'Lottery & Gaming',
  'Health & Personal Care',
  'Electronics & Accessories',
  'Cleaning Supplies',
  'Office Supplies',
  'Snacks & Candy',
  'Hot Foods & Coffee',
  'Cold Beverages',
  'Energy Drinks',
  'Beer & Wine',
  'Ice & Frozen',
  'Phone Cards & Prepaid',
  'Car Accessories',
  'Gift Cards',
  'Pharmacy & Medicine'];


  useEffect(() => {
    fetchVendors();
    fetchCategories();
    if (isEdit) {
      fetchProduct();
    } else {
      generateSerialNumber();
    }
  }, [id]);

  // Auto-calculate unit price when case price or unit per case changes
  useEffect(() => {
    if (formData.case_price > 0 && formData.unit_per_case > 0) {
      const calculatedUnitPrice = formData.case_price / formData.unit_per_case;
      setFormData((prev) => ({
        ...prev,
        unit_price: Math.round(calculatedUnitPrice * 100) / 100
      }));
    }
  }, [formData.case_price, formData.unit_per_case]);

  // Auto-calculate retail price when unit price changes
  useEffect(() => {
    if (formData.unit_price > 0) {
      const suggestedPrice = calculateSuggestedRetailPrice(formData.unit_price);
      // Only auto-update if retail price is 0 or very close to the previous suggestion
      if (formData.retail_price === 0) {
        setFormData((prev) => ({
          ...prev,
          retail_price: suggestedPrice
        }));
      }
    } else if (formData.unit_price === 0) {
      setFormData((prev) => ({
        ...prev,
        retail_price: 0
      }));
    }
  }, [formData.unit_price]);

  // Auto-calculate profit margin
  useEffect(() => {
    if (formData.unit_price > 0 && formData.retail_price > 0) {
      const margin = (formData.retail_price - formData.unit_price) / formData.retail_price * 100;
      setFormData((prev) => ({
        ...prev,
        profit_margin: Math.round(margin * 100) / 100
      }));
    } else {
      setFormData((prev) => ({ ...prev, profit_margin: 0 }));
    }
  }, [formData.unit_price, formData.retail_price]);

  const fetchVendors = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage('11729', {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'vendor_name',
        IsAsc: true,
        Filters: [{ name: 'is_active', op: 'Equal', value: true }]
      });

      if (error) throw error;
      setVendors(data?.List || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage('14389', {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'category_name',
        IsAsc: true,
        Filters: [{ name: 'is_active', op: 'Equal', value: true }]
      });

      if (error) throw error;
      setCategories(data?.List || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const generateSerialNumber = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage('11726', {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'serial_number',
        IsAsc: false,
        Filters: []
      });

      if (error) throw error;
      const lastSerial = data?.List?.[0]?.serial_number || 0;
      setFormData((prev) => ({ ...prev, serial_number: lastSerial + 1 }));
    } catch (error) {
      console.error('Error generating serial number:', error);
      setFormData((prev) => ({ ...prev, serial_number: 1 }));
    }
  };

  const fetchProduct = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const { data, error } = await window.ezsite.apis.tablePage('11726', {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'ID',
        IsAsc: true,
        Filters: [{ name: 'ID', op: 'Equal', value: parseInt(id) }]
      });


      if (error) throw error;

      if (data?.List?.[0]) {
        const product = data.List[0];
        const productData = {
          product_name: product.product_name || '',
          weight: product.weight || 0,
          weight_unit: product.weight_unit || 'lb',
          department: product.department || 'Convenience Store',
          merchant_id: product.merchant_id?.toString() || '',
          last_updated_date: product.last_updated_date ? product.last_updated_date.split('T')[0] : '',
          last_shopping_date: product.last_shopping_date ? product.last_shopping_date.split('T')[0] : '',
          case_price: product.case_price || 0,
          unit_per_case: product.unit_per_case || 1,
          unit_price: product.unit_price || 0,
          retail_price: product.retail_price || 0,
          profit_margin: 0, // Will be calculated by useEffect
          category: product.category || '',
          supplier: product.supplier || '',
          quantity_in_stock: product.quantity_in_stock || 0,
          minimum_stock: product.minimum_stock || 0,
          description: product.description || '',
          bar_code_case: product.bar_code_case || '',
          bar_code_unit: product.bar_code_unit || '',
          serial_number: product.serial_number || 0,
          overdue: product.overdue || false
        };
        setFormData(productData);
        setOriginalData(productData);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load product data."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate suggested retail price based on unit price with specific rules
  const calculateSuggestedRetailPrice = (unitPrice: number) => {
    if (unitPrice === 0) return 0;

    let markupPercentage = 0;
    if (unitPrice < 4) {
      markupPercentage = 65;
    } else if (unitPrice >= 4 && unitPrice < 6) {
      markupPercentage = 55;
    } else if (unitPrice >= 6 && unitPrice < 8) {
      markupPercentage = 45;
    } else if (unitPrice >= 8 && unitPrice < 10) {
      markupPercentage = 35;
    } else {
      markupPercentage = 25;
    }

    const suggestedPrice = unitPrice * (1 + markupPercentage / 100);

    // Round to closest .25, .49, .75, or .99
    const roundingTargets = [0.25, 0.49, 0.75, 0.99];
    const wholeNumber = Math.floor(suggestedPrice);
    const decimal = suggestedPrice - wholeNumber;

    let closestRounding = 0.99;
    let minDifference = Math.abs(decimal - 0.99);

    roundingTargets.forEach((target) => {
      const difference = Math.abs(decimal - target);
      if (difference < minDifference) {
        minDifference = difference;
        closestRounding = target;
      }
    });

    return wholeNumber + closestRounding;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBarcodeScanned = (field: string, barcode: string) => {
    setFormData((prev) => ({ ...prev, [field]: barcode }));
    toast({
      title: "Barcode Scanned",
      description: `Barcode ${barcode} added to ${field.replace('_', ' ')}`
    });
  };

  // Bulk upload functionality
  const handleBulkFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter((line) => line.trim());
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

        const data = lines.slice(1).map((line, index) => {
          const values = line.split(',');
          const product: any = {};

          headers.forEach((header, i) => {
            let value = values[i]?.trim() || '';

            // Map CSV headers to database fields
            const fieldMapping: {[key: string]: string;} = {
              'product name': 'product_name',
              'product_name': 'product_name',
              'weight': 'weight',
              'weight unit': 'weight_unit',
              'weight_unit': 'weight_unit',
              'department': 'department',
              'merchant': 'merchant_id',
              'merchant_id': 'merchant_id',
              'last shopping date': 'last_shopping_date',
              'last_shopping_date': 'last_shopping_date',
              'case price': 'case_price',
              'case_price': 'case_price',
              'unit per case': 'unit_per_case',
              'unit_per_case': 'unit_per_case',
              'unit price': 'unit_price',
              'unit_price': 'unit_price',
              'retail price': 'retail_price',
              'retail_price': 'retail_price',
              'category': 'category',
              'supplier': 'supplier',
              'description': 'description'
            };

            const dbField = fieldMapping[header] || header;

            // Convert numeric fields
            if (['weight', 'case_price', 'unit_per_case', 'unit_price', 'retail_price', 'merchant_id'].includes(dbField)) {
              value = value ? parseFloat(value) || 0 : 0;
            }

            product[dbField] = value;
          });

          // Auto-calculate unit price if case price and unit per case are provided
          if (product.case_price > 0 && product.unit_per_case > 0 && !product.unit_price) {
            product.unit_price = Math.round(product.case_price / product.unit_per_case * 100) / 100;
          }

          // Calculate suggested retail price if unit price is available
          if (product.unit_price > 0 && !product.retail_price) {
            product.retail_price = calculateSuggestedRetailPrice(product.unit_price);
          }

          return product;
        });

        setBulkUploadData(data);
        setShowBulkPreview(true);

      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to parse CSV file. Please check the format."
        });
      }
    };

    reader.readAsText(file);
  };

  const handleBulkSubmit = async () => {
    if (!userProfile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User profile not found."
      });
      return;
    }

    setIsUploadingBulk(true);
    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Get the latest serial number
      const serialResponse = await window.ezsite.apis.tablePage('11726', {
        PageNo: 1,
        PageSize: 1,
        OrderByField: 'serial_number',
        IsAsc: false,
        Filters: []
      });

      let lastSerial = serialResponse.data?.List?.[0]?.serial_number || 0;

      for (const productData of bulkUploadData) {
        try {
          if (!productData.product_name?.trim()) {
            errors.push(`Row ${successCount + errorCount + 1}: Product name is required`);
            errorCount++;
            continue;
          }

          const productPayload: any = {
            serial_number: lastSerial + successCount + 1,
            product_name: productData.product_name.trim(),
            last_updated_date: new Date().toISOString(),
            overdue: false,
            weight: productData.weight || 0,
            weight_unit: productData.weight_unit || 'lb',
            department: productData.department || 'Convenience Store',
            case_price: productData.case_price || 0,
            unit_per_case: productData.unit_per_case || 1,
            unit_price: productData.unit_price || 0,
            retail_price: productData.retail_price || 0,
            category: productData.category || '',
            supplier: productData.supplier || '',
            description: productData.description || '',
            quantity_in_stock: 0,
            minimum_stock: 0,
            bar_code_case: '',
            bar_code_unit: '',
            created_by: userProfile.user_id
          };

          if (productData.merchant_id) {
            productPayload.merchant_id = parseInt(productData.merchant_id);
          }

          if (productData.last_shopping_date) {
            productPayload.last_shopping_date = new Date(productData.last_shopping_date).toISOString();
          }

          const { error } = await window.ezsite.apis.tableCreate('11726', productPayload);

          if (error) {
            errors.push(`${productData.product_name}: ${error}`);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${productData.product_name || 'Unknown'}: ${errorMsg}`);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Import Complete",
          description: `Successfully imported ${successCount} products. ${errorCount > 0 ? `${errorCount} errors occurred.` : ''}`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Import Failed",
          description: `No products were imported. ${errorCount} errors occurred.`
        });
      }

      if (errors.length > 0) {
        console.error('Import errors:', errors);
      }

      if (successCount > 0) {
        setShowBulkPreview(false);
        setBulkUploadData([]);
        navigate('/products');
      }
    } catch (error) {
      console.error('Bulk import error:', error);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import product data."
      });
    } finally {
      setIsUploadingBulk(false);
    }
  };

  const logFieldChange = async (productId: number, fieldName: string, oldValue: any, newValue: any, userId: number) => {
    try {
      // Log to product_logs table (legacy)
      const { error: legacyError } = await window.ezsite.apis.tableCreate('11756', {
        product_id: productId,
        field_name: fieldName,
        old_value: oldValue?.toString() || '',
        new_value: newValue?.toString() || '',
        change_date: new Date().toISOString(),
        changed_by: userId
      });
      if (legacyError) {
        console.error('Error logging field change to legacy table:', legacyError);
      }

      // Log to product_changelog table (enhanced)
      const { error: changelogError } = await window.ezsite.apis.tableCreate('24010', {
        product_id: productId,
        field_name: fieldName,
        old_value: oldValue?.toString() || '',
        new_value: newValue?.toString() || '',
        change_timestamp: new Date().toISOString(),
        changed_by: userId,
        change_type: 'update',
        change_summary: `Updated ${fieldName.replace(/_/g, ' ')} from "${oldValue}" to "${newValue}"`
      });
      if (changelogError) {
        console.error('Error logging field change to changelog:', changelogError);
      }
    } catch (error) {
      console.error('Error logging field change:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product_name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Product name is required."
      });
      return;
    }

    if (!userProfile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User profile not found."
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        last_updated_date: new Date().toISOString(),
        last_shopping_date: formData.last_shopping_date ? new Date(formData.last_shopping_date).toISOString() : null,
        merchant_id: formData.merchant_id ? parseInt(formData.merchant_id) : null,
        created_by: userProfile.user_id
      };

      let resultError;
      let createdProductId = null;

      if (isEdit) {
        const { error } = await window.ezsite.apis.tableUpdate('11726', { ID: parseInt(id!), ...payload });
        resultError = error;
      } else {
        const { error } = await window.ezsite.apis.tableCreate('11726', payload);
        resultError = error;

        // For new products, get the newly created product ID
        if (!error) {
          try {
            const { data: newProductData } = await window.ezsite.apis.tablePage('11726', {
              PageNo: 1,
              PageSize: 1,
              OrderByField: 'serial_number',
              IsAsc: false,
              Filters: [{ name: 'serial_number', op: 'Equal', value: payload.serial_number }]
            });
            createdProductId = newProductData?.List?.[0]?.ID;
          } catch (error) {
            console.error('Error getting new product ID:', error);
          }
        }
      }

      if (resultError) throw resultError;

      // Log changes for existing products
      if (isEdit && originalData && userProfile) {
        const fieldsToTrack = [
        'last_shopping_date',
        'case_price',
        'unit_per_case',
        'unit_price',
        'retail_price'];


        for (const field of fieldsToTrack) {
          const oldValue = originalData[field];
          const newValue = formData[field];

          if (oldValue !== newValue) {
            await logFieldChange(parseInt(id!), field, oldValue, newValue, userProfile.user_id);
          }
        }

        // Calculate and log profit margin changes
        const oldProfitMargin = originalData.unit_price > 0 && originalData.retail_price > 0 ?
        (originalData.retail_price - originalData.unit_price) / originalData.retail_price * 100 : 0;
        const newProfitMargin = formData.profit_margin;

        if (Math.abs(oldProfitMargin - newProfitMargin) > 0.01) {
          await logFieldChange(parseInt(id!), 'profit_margin', oldProfitMargin.toFixed(2), newProfitMargin.toFixed(2), userProfile.user_id);
        }
      }

      toast({
        title: "Success",
        description: `Product ${isEdit ? 'updated' : 'created'} successfully.`
      });

      navigate('/products');
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${isEdit ? 'update' : 'create'} product.`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedRetailPrice = calculateSuggestedRetailPrice(formData.unit_price);

  // Download CSV template
  const downloadTemplate = () => {
    const csvContent = [
    'Product Name,Weight,Weight Unit,Department,Merchant,Case Price,Unit Per Case,Unit Price,Retail Price,Category,Supplier,Description',
    'Example Product,12,oz,Food & Beverages,,24.00,24,1.00,1.99,Soft Drinks,Example Supplier,Example description'].
    join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'product_import_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Filter out vendors with empty vendor_name
  const validVendors = vendors.filter((vendor) => vendor.vendor_name && vendor.vendor_name.trim() !== '');
  // Filter out categories with empty category_name
  const validCategories = categories.filter((category) => category.category_name && category.category_name.trim() !== '');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/products')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
            <p className="text-muted-foreground">
              {isEdit ? 'Update product information' : 'Add a new product to your inventory'}
            </p>
          </div>
        </div>
        
        {/* Bulk Upload Dialog */}
        <Dialog open={showBulkPreview} onOpenChange={setShowBulkPreview}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Bulk Upload
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Bulk Product Upload</DialogTitle>
              <DialogDescription>
                Upload a CSV file with product data. Click "Download Template" for the correct format.
              </DialogDescription>
            </DialogHeader>
            
            {bulkUploadData.length === 0 ?
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Upload CSV File</h3>
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Upload CSV File</h3>
                    <p className="text-sm text-gray-500">Select a CSV file containing product data</p>
                    <Input
                    type="file"
                    accept=".csv"
                    onChange={handleBulkFileUpload}
                    className="max-w-xs mx-auto" />

                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Required Columns:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Product Name (required)</li>
                    <li>• Weight, Weight Unit, Department, Merchant</li>
                    <li>• Case Price, Unit Per Case, Unit Price, Retail Price</li>
                    <li>• Category, Supplier, Description</li>
                  </ul>
                </div>
              </div> :

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Preview Import Data ({bulkUploadData.length} products)</h3>
                  <div className="space-x-2">
                    <Button variant="outline" onClick={() => {
                    setBulkUploadData([]);
                    setShowBulkPreview(false);
                  }}>
                      Cancel
                    </Button>
                    <Button onClick={handleBulkSubmit} disabled={isUploadingBulk}>
                      {isUploadingBulk ? 'Importing...' : 'Import Products'}
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-lg max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Weight</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Case Price</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Retail Price</TableHead>
                        <TableHead>Profit %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bulkUploadData.map((product, index) => {
                      const profit = product.unit_price > 0 && product.retail_price > 0 ?
                      ((product.retail_price - product.unit_price) / product.retail_price * 100).toFixed(1) :
                      '0';

                      return (
                        <TableRow key={index}>
                            <TableCell className="font-medium">{product.product_name}</TableCell>
                            <TableCell>{product.weight} {product.weight_unit}</TableCell>
                            <TableCell>{product.department}</TableCell>
                            <TableCell>${product.case_price?.toFixed(2) || '0.00'}</TableCell>
                            <TableCell>${product.unit_price?.toFixed(2) || '0.00'}</TableCell>
                            <TableCell>${product.retail_price?.toFixed(2) || '0.00'}</TableCell>
                            <TableCell>
                              <Badge variant={parseFloat(profit) > 20 ? 'default' : 'secondary'}>
                                {profit}%
                              </Badge>
                            </TableCell>
                          </TableRow>);

                    })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            }
          </DialogContent>
        </Dialog>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit Product' : 'New Product'}</CardTitle>
          <CardDescription>
            {isEdit ? 'Update the product information below' : 'Enter the product details below'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormErrorBoundary
            formName="Product Form"
            showDataRecovery={true}
            onFormReset={() => {
              if (isEdit) {
                fetchProduct();
              } else {
                setFormData({
                  product_name: '',
                  weight: 0,
                  weight_unit: 'lb',
                  department: 'Convenience Store',
                  merchant_id: '',
                  last_updated_date: new Date().toISOString().split('T')[0],
                  last_shopping_date: '',
                  case_price: 0,
                  unit_per_case: 1,
                  unit_price: 0,
                  retail_price: 0,
                  profit_margin: 0,
                  category: '',
                  supplier: '',
                  quantity_in_stock: 0,
                  minimum_stock: 0,
                  description: '',
                  bar_code_case: '',
                  bar_code_unit: '',
                  serial_number: 0,
                  overdue: false
                });
                generateSerialNumber();
              }
            }}>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="product_name">Product Name *</Label>
                  <Input
                    id="product_name"
                    placeholder="Enter product name"
                    value={formData.product_name}
                    onChange={(e) => handleInputChange('product_name', e.target.value)}
                    required />

                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}>


                    <SelectContent>
                      {validCategories.map((cat) =>
                      <SelectItem key={cat.id} value={cat.category_name}>
                          {cat.category_name}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Weight and Measurement */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight</Label>
                  <NumberInput
                    id="weight"
                    step={0.01}
                    min={0}
                    value={formData.weight}
                    onChange={(value) => handleInputChange('weight', value)} />

                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight_unit">Weight Unit (USA Measurements)</Label>
                  <Select
                    value={formData.weight_unit}
                    onValueChange={(value) => handleInputChange('weight_unit', value)}>

                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {weightUnits.map((unit) =>
                      <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Combined: {formData.weight} {formData.weight_unit}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => handleInputChange('department', value)}>

                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) =>
                      <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Merchant and Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="merchant_id">Merchant</Label>
                  <Select
                    value={formData.merchant_id}
                    onValueChange={(value) => handleInputChange('merchant_id', value)}>

                    <SelectTrigger>
                      <SelectValue placeholder="Select merchant" />
                    </SelectTrigger>
                    <SelectContent>
                      {validVendors.map((vendor) =>
                      <SelectItem key={vendor.id} value={vendor.id.toString()}>
                          {vendor.vendor_name}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_updated_date">Last Updated Date</Label>
                  <Input
                    id="last_updated_date"
                    type="date"
                    value={formData.last_updated_date}
                    onChange={(e) => handleInputChange('last_updated_date', e.target.value)} />

                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_shopping_date">Last Shopping Date</Label>
                  <Input
                    id="last_shopping_date"
                    type="date"
                    value={formData.last_shopping_date}
                    onChange={(e) => handleInputChange('last_shopping_date', e.target.value)} />

                </div>
              </div>

              {/* Pricing Information */}
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Pricing Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="case_price">Case Price ($)</Label>
                    <NumberInput
                      id="case_price"
                      step={0.01}
                      min={0}
                      value={formData.case_price}
                      onChange={(value) => handleInputChange('case_price', value)} />

                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit_per_case">Unit Per Case</Label>
                    <NumberInput
                      id="unit_per_case"
                      min={1}
                      value={formData.unit_per_case}
                      onChange={(value) => handleInputChange('unit_per_case', value)} />

                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit_price">Unit Price ($)</Label>
                    <NumberInput
                      id="unit_price"
                      step={0.01}
                      min={0}
                      value={formData.unit_price}
                      onChange={(value) => handleInputChange('unit_price', value)} />

                    {formData.case_price > 0 && formData.unit_per_case > 0 &&
                    <p className="text-xs text-green-600 flex items-center">
                        <Calculator className="w-3 h-3 mr-1" />
                        Auto-calculated from case price
                      </p>
                    }
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="retail_price">Retail Price ($)</Label>
                    <NumberInput
                      id="retail_price"
                      step={0.01}
                      min={0}
                      value={formData.retail_price}
                      onChange={(value) => handleInputChange('retail_price', value)} />

                    {/* Auto-calculation indicator */}
                    {formData.unit_price > 0 && Math.abs(formData.retail_price - suggestedRetailPrice) < 0.01 &&
                    <p className="text-xs text-green-600 flex items-center">
                        <Calculator className="w-3 h-3 mr-1" />
                        Auto-calculated from unit price
                      </p>
                    }
                    
                    {/* Pricing Suggestion */}
                    {formData.unit_price > 0 && Math.abs(formData.retail_price - suggestedRetailPrice) >= 0.01 &&
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-red-800">
                              Suggested: ${suggestedRetailPrice.toFixed(2)}
                            </span>
                          </div>
                          <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleInputChange('retail_price', suggestedRetailPrice)}
                          className="text-xs h-6 px-2">

                            Apply
                          </Button>
                        </div>
                        <p className="text-xs text-red-700 mt-1">
                          {formData.unit_price < 4 ? '+65%' :
                        formData.unit_price < 6 ? '+55%' :
                        formData.unit_price < 8 ? '+45%' :
                        formData.unit_price < 10 ? '+35%' : '+25%'} markup, 
                          rounded to .25/.49/.75/.99
                        </p>
                      </div>
                    }
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profit_margin">Profit Margin (%)</Label>
                    <div className="flex items-center space-x-2">
                      <NumberInput
                        id="profit_margin"
                        step={0.01}
                        value={formData.profit_margin}
                        disabled
                        className="bg-muted" />

                      <Badge variant={formData.profit_margin > 20 ? 'default' : 'secondary'}>
                        {formData.profit_margin > 20 ? 'Good' : 'Low'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Auto-calculated from unit and retail price</p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Additional Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      placeholder="Enter supplier name"
                      value={formData.supplier}
                      onChange={(e) => handleInputChange('supplier', e.target.value)} />

                  </div>

                  <div className="space-y-2">
                    <Label>Stock Information</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <NumberInput
                        placeholder="Current Stock"
                        value={formData.quantity_in_stock}
                        onChange={(value) => handleInputChange('quantity_in_stock', value)}
                        min={0} />

                      <NumberInput
                        placeholder="Min Stock"
                        value={formData.minimum_stock}
                        onChange={(value) => handleInputChange('minimum_stock', value)}
                        min={0} />

                    </div>
                    <p className="text-xs text-muted-foreground">Current stock / Minimum stock level</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter product description"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)} />

                </div>

                {/* Barcode Scanning */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="bar_code_case">Barcode (Case)</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="bar_code_case"
                        placeholder="Scan or enter case barcode"
                        value={formData.bar_code_case}
                        onChange={(e) => handleInputChange('bar_code_case', e.target.value)} />

                      <BarcodeScanner
                        onScanned={(barcode) => handleBarcodeScanned('bar_code_case', barcode)} />

                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bar_code_unit">Barcode (Unit)</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="bar_code_unit"
                        placeholder="Scan or enter unit barcode"
                        value={formData.bar_code_unit}
                        onChange={(e) => handleInputChange('bar_code_unit', e.target.value)} />

                      <BarcodeScanner
                        onScanned={(barcode) => handleBarcodeScanned('bar_code_unit', barcode)} />

                    </div>
                  </div>
                </div>

                {/* Product Image Upload */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium">Product Images & Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Product Image</Label>
                      <EnhancedFileUpload
                        accept="image/*"
                        label="Upload Product Image"
                        maxSize={5}
                        useDatabaseStorage={true}
                        associatedTable="products"
                        associatedRecordId={parseInt(id || '0')}
                        fileCategory="product_image"
                        showPreview={true}
                        onFileUpload={(result) => {
                          toast({
                            title: "Image uploaded",
                            description: `${result.fileName} has been uploaded successfully`
                          });
                        }} />

                    </div>
                    <div className="space-y-2">
                      <Label>Product Documents</Label>
                      <EnhancedFileUpload
                        accept=".pdf,.doc,.docx,.txt"
                        label="Upload Documents"
                        maxSize={10}
                        useDatabaseStorage={true}
                        associatedTable="products"
                        associatedRecordId={parseInt(id || '0')}
                        fileCategory="product_document"
                        showPreview={true}
                        onFileUpload={(result) => {
                          toast({
                            title: "Document uploaded",
                            description: `${result.fileName} has been uploaded successfully`
                          });
                        }} />

                    </div>
                  </div>
                </div>

                {/* Display existing files if editing */}
                {isEdit && parseInt(id || '0') > 0 &&
                <div className="space-y-4">
                    <h4 className="text-md font-medium">Uploaded Files</h4>
                    <FileDisplay
                    associatedTable="products"
                    associatedRecordId={parseInt(id || '0')}
                    allowDelete={true}
                    allowEdit={false}
                    showDescription={true}
                    viewMode="grid" />

                  </div>
                }
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6">
                <Button type="button" variant="outline" onClick={() => navigate('/products')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
                </Button>
              </div>
            </form>
          </FormErrorBoundary>
        </CardContent>
      </Card>
    </div>);

};

export default ProductForm;