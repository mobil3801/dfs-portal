import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, Package, FileText, Loader2, X, Save, History, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useModuleAccess } from '@/contexts/ModuleAccessContext';
import ProductLogs from '@/components/ProductLogs';
import ProductChangelogDialog from '@/components/ProductChangelogDialog';
import HighlightText from '@/components/HighlightText';
import { ResponsiveTable, ResponsiveStack } from '@/components/ResponsiveWrapper';
import { useResponsiveLayout } from '@/hooks/use-mobile';
import ProductCards from '@/components/ProductCards';
import { generateSafeKey, safeMap } from '@/utils/invariantSafeHelper';

interface Product {
  ID: number;
  product_name: string;
  category: string;
  quantity_in_stock: number;
  minimum_stock: number;
  supplier: string;
  description: string;
  created_by: number;
  serial_number: number;
  weight: number;
  weight_unit: string;
  department: string;
  merchant_id: number;
  bar_code_case: string;
  bar_code_unit: string;
  last_updated_date: string;
  last_shopping_date: string;
  case_price: number;
  unit_per_case: number;
  unit_price: number;
  retail_price: number;
  overdue: boolean;
}

const ProductList: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const responsive = useResponsiveLayout();

  // Module Access Control
  const {
    canCreate,
    canEdit,
    canDelete,
    isModuleAccessEnabled
  } = useModuleAccess();

  // Simplified permission checks
  const canCreateProduct = canCreate('products');
  const canEditProduct = canEdit('products');
  const canDeleteProduct = canDelete('products');

  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [changelogModalOpen, setChangelogModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{id: number;name: string;} | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [savingProductId, setSavingProductId] = useState<number | null>(null);
  const [isAdjustingSerials, setIsAdjustingSerials] = useState(false);

  const pageSize = 50; // Load more products per batch
  const [loadedProductsCount, setLoadedProductsCount] = useState(pageSize);

  // Ref for the loading trigger element
  const loadingTriggerRef = useRef<HTMLDivElement>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setLoadedProductsCount(pageSize); // Reset loaded count when searching
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, pageSize]);

  // Load all products initially
  useEffect(() => {
    loadAllProducts();
  }, []);

  // Filter and slice products when search term or loaded count changes
  useEffect(() => {
    filterAndSliceProducts();
  }, [debouncedSearchTerm, loadedProductsCount, allProducts]);

  const loadAllProducts = async () => {
    try {
      setLoading(true);

      const { data, error } = await window.ezsite.apis.tablePage('11726', {
        PageNo: 1,
        PageSize: 1000, // Load a large number to get all products
        OrderByField: 'ID',
        IsAsc: false,
        Filters: []
      });

      if (error) throw error;

      setAllProducts(data?.List || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSliceProducts = () => {
    setIsSearching(!!debouncedSearchTerm);

    let filteredProducts = allProducts;

    // Client-side filtering for keyword matching
    if (debouncedSearchTerm) {
      const searchKeywords = debouncedSearchTerm.toLowerCase().trim().split(/\s+/).filter((keyword) => keyword.length > 0);

      filteredProducts = allProducts.filter((product) => {
        const searchableText = [
        product.product_name,
        product.description,
        product.category,
        product.supplier,
        product.department,
        product.bar_code_case,
        product.bar_code_unit,
        product.serial_number?.toString()].
        join(' ').toLowerCase();

        // Check if all keywords are present in the searchable text
        return searchKeywords.every((keyword) => searchableText.includes(keyword));
      });
    }

    // Sort by serial number when not searching (show from serial 01)
    if (!debouncedSearchTerm) {
      filteredProducts = filteredProducts.sort((a, b) => {
        const serialA = a.serial_number || 0;
        const serialB = b.serial_number || 0;
        return serialA - serialB;
      });
    }

    // Slice products based on loaded count for infinite scroll
    const slicedProducts = filteredProducts.slice(0, loadedProductsCount);

    setProducts(slicedProducts);
    setTotalCount(filteredProducts.length);
    setHasMoreProducts(loadedProductsCount < filteredProducts.length);
  };

  // Auto-adjust serial numbers after edit/delete operations
  const autoAdjustSerialNumbers = async () => {
    try {
      setIsAdjustingSerials(true);
      console.log('Starting auto-adjustment of serial numbers...');

      // Get all products ordered by ID (creation order)
      const { data, error } = await window.ezsite.apis.tablePage('11726', {
        PageNo: 1,
        PageSize: 1000,
        OrderByField: 'ID',
        IsAsc: true,
        Filters: []
      });

      if (error) throw error;

      const products = data?.List || [];
      console.log(`Found ${products.length} products for serial number adjustment`);

      // Check if serial numbers need adjustment
      let needsAdjustment = false;
      for (let i = 0; i < products.length; i++) {
        const expectedSerial = i + 1;
        const currentSerial = products[i].serial_number;

        if (currentSerial !== expectedSerial) {
          needsAdjustment = true;
          console.log(`Product ID ${products[i].ID} has serial ${currentSerial}, should be ${expectedSerial}`);
          break;
        }
      }

      if (!needsAdjustment) {
        console.log('Serial numbers are already continuous, no adjustment needed');
        return;
      }

      // Update serial numbers to be continuous
      const updatePromises = products.map(async (product, index) => {
        const newSerial = index + 1;
        const currentSerial = product.serial_number;

        // Only update if serial number is different
        if (currentSerial !== newSerial) {
          console.log(`Updating product ID ${product.ID} serial from ${currentSerial} to ${newSerial}`);

          const updateData = {
            ID: product.ID,
            serial_number: newSerial,
            // Include all other fields to maintain data integrity
            product_name: product.product_name,
            category: product.category || '',
            quantity_in_stock: product.quantity_in_stock || 0,
            minimum_stock: product.minimum_stock || 0,
            supplier: product.supplier || '',
            description: product.description || '',
            weight: product.weight || 0,
            weight_unit: product.weight_unit || 'lb',
            department: product.department || 'Convenience Store',
            merchant_id: product.merchant_id || null,
            bar_code_case: product.bar_code_case || '',
            bar_code_unit: product.bar_code_unit || '',
            last_updated_date: new Date().toISOString(),
            last_shopping_date: product.last_shopping_date || null,
            case_price: product.case_price || 0,
            unit_per_case: product.unit_per_case || 1,
            unit_price: product.unit_price || 0,
            retail_price: product.retail_price || 0,
            overdue: product.overdue || false,
            created_by: product.created_by || userProfile?.user_id || null
          };

          const { error: updateError } = await window.ezsite.apis.tableUpdate('11726', updateData);
          if (updateError) {
            console.error(`Failed to update serial for product ID ${product.ID}:`, updateError);
            throw updateError;
          }
        }
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);

      console.log('Serial number auto-adjustment completed successfully');
      toast({
        title: "Serial Numbers Updated",
        description: "Product serial numbers have been automatically adjusted to maintain continuity.",
        duration: 3000
      });

    } catch (error) {
      console.error('Error during serial number auto-adjustment:', error);
      toast({
        title: "Warning",
        description: "Failed to auto-adjust serial numbers. Please check the system logs.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsAdjustingSerials(false);
    }
  };

  const handleDelete = async (productId: number) => {
    console.log('handleDelete called for product ID:', productId);

    // Check if user is admin
    if (userProfile?.role !== 'Administrator' && userProfile?.role !== 'Admin') {
      toast({
        title: "Access Denied",
        description: "Only administrators can delete products.",
        variant: "destructive"
      });
      return;
    }

    // Show confirmation dialog
    const confirmed = confirm('Are you sure you want to delete this product? This action cannot be undone. Serial numbers will be automatically adjusted to maintain continuity.');
    console.log('User confirmed deletion:', confirmed);

    if (!confirmed) {
      console.log('Deletion cancelled by user');
      return;
    }

    try {
      console.log('Attempting to delete product with ID:', productId);
      const { error } = await window.ezsite.apis.tableDelete('11726', { ID: productId });

      if (error) {
        console.error('API returned error:', error);
        throw error;
      }

      console.log('Product deleted successfully');
      toast({
        title: "Success",
        description: "Product deleted successfully. Adjusting serial numbers...",
        duration: 2000
      });

      // Auto-adjust serial numbers after deletion
      await autoAdjustSerialNumbers();

      // Reload all products
      loadAllProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: `Failed to delete product: ${error}`,
        variant: "destructive"
      });
    }
  };

  const handleSaveProduct = async (productId: number | null = null) => {
    console.log('handleSaveProduct called for product ID:', productId);

    const isCreating = productId === null;

    // Check permissions based on action
    if (isCreating && !canCreateProduct) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create products.",
        variant: "destructive"
      });
      return;
    }

    if (!isCreating && !canEditProduct) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit products.",
        variant: "destructive"
      });
      return;
    }

    setSavingProductId(productId || -1); // Use -1 for new product creation

    try {
      if (isCreating) {
        // Show confirmation dialog for creating new product
        const confirmed = confirm('Create a new product entry? This will add a new product with default values that you can edit.');
        if (!confirmed) {
          console.log('Product creation cancelled by user');
          setSavingProductId(null);
          return;
        }

        // Create a new product with minimal required data
        // Generate new serial number
        const { data: serialData } = await window.ezsite.apis.tablePage('11726', {
          PageNo: 1,
          PageSize: 1,
          OrderByField: 'serial_number',
          IsAsc: false,
          Filters: []
        });

        const lastSerial = serialData?.List?.[0]?.serial_number || 0;
        const newSerial = lastSerial + 1;

        const newProductData = {
          serial_number: newSerial,
          product_name: `New Product ${newSerial}`,
          category: 'General',
          quantity_in_stock: 0,
          minimum_stock: 0,
          supplier: '',
          description: 'Please update this product information',
          weight: 0,
          weight_unit: 'lb',
          department: 'Convenience Store',
          merchant_id: null,
          bar_code_case: '',
          bar_code_unit: '',
          last_updated_date: new Date().toISOString(),
          last_shopping_date: null,
          case_price: 0,
          unit_per_case: 1,
          unit_price: 0,
          retail_price: 0,
          overdue: false,
          created_by: userProfile?.user_id || null
        };

        console.log('Creating new product with data:', newProductData);
        const { error } = await window.ezsite.apis.tableCreate('11726', newProductData);

        if (error) {
          console.error('API returned error:', error);
          throw error;
        }

        console.log('New product created successfully with serial:', newSerial);
        toast({
          title: "Success",
          description: `New product created with serial #${newSerial}. Please edit it to add complete information.`,
          duration: 5000
        });

        // Auto-adjust serial numbers after creation to ensure continuity
        await autoAdjustSerialNumbers();

      } else {
        // Update existing product
        const product = products.find((p) => p.ID === productId);
        if (!product) {
          throw new Error('Product not found');
        }

        // Show confirmation dialog for updating existing product
        const confirmed = confirm(`Save updates to "${product.product_name}"? This will update the product information with current values. Serial numbers will be automatically adjusted if needed.`);
        if (!confirmed) {
          console.log('Product update cancelled by user');
          setSavingProductId(null);
          return;
        }

        console.log('Updating product:', product);

        // Prepare the data for saving (update existing product)
        const updateData = {
          ID: product.ID,
          product_name: product.product_name,
          category: product.category || '',
          quantity_in_stock: product.quantity_in_stock || 0,
          minimum_stock: product.minimum_stock || 0,
          supplier: product.supplier || '',
          description: product.description || '',
          serial_number: product.serial_number || 0,
          weight: product.weight || 0,
          weight_unit: product.weight_unit || 'lb',
          department: product.department || 'Convenience Store',
          merchant_id: product.merchant_id || null,
          bar_code_case: product.bar_code_case || '',
          bar_code_unit: product.bar_code_unit || '',
          last_updated_date: new Date().toISOString(),
          last_shopping_date: product.last_shopping_date || null,
          case_price: product.case_price || 0,
          unit_per_case: product.unit_per_case || 1,
          unit_price: product.unit_price || 0,
          retail_price: product.retail_price || 0,
          overdue: product.overdue || false,
          created_by: product.created_by || userProfile?.user_id || null
        };

        console.log('Updating product with data:', updateData);
        const { error } = await window.ezsite.apis.tableUpdate('11726', updateData);

        if (error) {
          console.error('API returned error:', error);
          throw error;
        }

        console.log('Product updated successfully with ID:', product.ID);
        toast({
          title: "Success",
          description: `"${product.product_name}" updated successfully`,
          duration: 3000
        });

        // Auto-adjust serial numbers after update to ensure continuity
        await autoAdjustSerialNumbers();
      }

      // Reload all products to reflect changes
      loadAllProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: `Failed to ${isCreating ? 'create' : 'update'} product: ${error}`,
        variant: "destructive"
      });
    } finally {
      setSavingProductId(null);
    }
  };

  // Manual serial number adjustment function
  const handleManualSerialAdjustment = async () => {
    const confirmed = confirm('Manually adjust all serial numbers to be continuous (1, 2, 3, etc.)? This will update all products based on their creation order.');
    if (!confirmed) return;

    await autoAdjustSerialNumbers();
    loadAllProducts();
  };

  // Load more products function
  const loadMoreProducts = useCallback(() => {
    if (isLoadingMore || !hasMoreProducts) return;

    setIsLoadingMore(true);

    // Simulate loading delay for smooth UX
    setTimeout(() => {
      setLoadedProductsCount((prev) => prev + pageSize);
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, hasMoreProducts, pageSize]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMoreProducts && !isLoadingMore) {
          loadMoreProducts();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    const currentTrigger = loadingTriggerRef.current;
    if (currentTrigger) {
      observer.observe(currentTrigger);
    }

    return () => {
      if (currentTrigger) {
        observer.unobserve(currentTrigger);
      }
    };
  }, [loadMoreProducts, hasMoreProducts, isLoadingMore]);

  const handleViewLogs = (productId: number, productName: string) => {
    console.log('handleViewLogs called for:', { productId, productName });
    setSelectedProduct({ id: productId, name: productName });
    setLogsModalOpen(true);
    console.log('Logs modal should now be open');
  };

  const handleEdit = (productId: number) => {
    console.log('handleEdit called for product ID:', productId);

    // Check if user is admin
    if (userProfile?.role !== 'Administrator' && userProfile?.role !== 'Admin') {
      toast({
        title: "Access Denied",
        description: "Only administrators can edit products.",
        variant: "destructive"
      });
      return;
    }

    // Navigate to edit form - fix the route to match App.tsx
    navigate(`/products/${productId}/edit`);
  };

  const handleViewChangelog = (productId: number, productName: string) => {
    console.log('handleViewChangelog called for:', { productId, productName });
    setSelectedProduct({ id: productId, name: productName });
    setChangelogModalOpen(true);
    console.log('Changelog modal should now be open');
  };

  // Calculate display text for showing results
  const getDisplayText = () => {
    if (totalCount === 0) return '';

    const currentlyShowing = Math.min(products.length, totalCount);

    if (debouncedSearchTerm) {
      return `Showing ${currentlyShowing} of ${totalCount} products matching "${debouncedSearchTerm}"`;
    }

    if (hasMoreProducts) {
      return `Showing ${currentlyShowing} of ${totalCount} products - Scroll down to load more`;
    }

    return `Showing all ${totalCount} products`;
  };

  // Get search keywords and check if all match
  const getSearchData = (text: string) => {
    if (!debouncedSearchTerm || !text) {
      return {
        keywords: [],
        allMatch: false,
        highlightComponent: text
      };
    }

    const searchKeywords = debouncedSearchTerm.toLowerCase().trim().split(/\s+/).filter((keyword) => keyword.length > 0);
    const textLower = text.toLowerCase();

    // Check if all keywords are present in this specific text
    const allMatch = searchKeywords.every((keyword) => textLower.includes(keyword));

    return {
      keywords: searchKeywords,
      allMatch,
      highlightComponent:
      <HighlightText
        text={text}
        searchTerms={searchKeywords}
        allMatch={allMatch} />


    };
  };

  // Clear search and reset to show all products from serial 01
  const handleClearSearch = () => {
    setSearchTerm('');
    setLoadedProductsCount(pageSize);
  };

  return (
    <ResponsiveStack spacing="lg">
      <Card>
        <CardHeader>
          <div className={`flex items-center ${
          responsive.isMobile ? 'flex-col space-y-4' : 'justify-between'}`
          }>
            <div className={responsive.isMobile ? 'text-center' : ''}>
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-6 h-6" />
                <span>Products</span>
              </CardTitle>
              <CardDescription className={responsive.isMobile ? 'text-center mt-2' : ''}>
                Manage your product inventory - Search across all product fields for similar items
              </CardDescription>
            </div>
            
            <div className={`flex items-center space-x-2 ${responsive.isMobile ? 'flex-col space-y-2 space-x-0 w-full' : ''}`}>
              {/* Serial Number Adjustment Button */}
              <Button
                onClick={handleManualSerialAdjustment}
                variant="outline"
                className={`bg-purple-50 hover:bg-purple-100 text-purple-600 border-purple-200 ${
                responsive.isMobile ? 'w-full' : ''}`
                }
                disabled={isAdjustingSerials}>

                {isAdjustingSerials ?
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adjusting...
                  </> :

                <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Fix Serial Numbers
                  </>
                }
              </Button>

              {/* Only show Add Product button if create permission is enabled */}
              {canCreateProduct &&
              <Button
                onClick={() => navigate('/products/new')}
                className={`bg-brand-600 hover:bg-brand-700 text-white ${
                responsive.isMobile ? 'w-full' : ''}`
                }>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              }
              
              {/* Show permission message if create is disabled */}
              {!canCreateProduct && isModuleAccessEnabled &&
              <Badge variant="secondary" className="text-xs">
                  Create access disabled by admin
                </Badge>
              }
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className={`flex items-center mb-6 ${
          responsive.isMobile ? 'flex-col space-y-3' : 'space-x-2'}`
          }>
            <div className={`relative ${
            responsive.isMobile ? 'w-full' : 'flex-1 max-w-sm'}`
            }>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              {searchTerm &&
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 w-4 h-4 flex items-center justify-center"
                title="Clear search">

                  <X className="w-4 h-4" />
                </button>
              }
              <Input
                placeholder={responsive.isMobile ?
                "Search products..." :
                "Search products by name, description, category, supplier, barcode..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 ${searchTerm ? 'pr-10' : 'pr-3'}`} />
            </div>
            {debouncedSearchTerm &&
            <div className={`flex items-center space-x-2 ${
            responsive.isMobile ? 'w-full justify-center' : ''}`
            }>
                <Badge variant="secondary">
                  {totalCount} result{totalCount !== 1 ? 's' : ''} found
                </Badge>
                <Button
                variant="outline"
                size="sm"
                onClick={handleClearSearch}>
                  Clear
                </Button>
              </div>
            }
          </div>

          {/* Products Display */}
          {loading ?
          <div className="space-y-4">
              {[...Array(5)].map((_, i) =>
            <div key={i} className={`bg-gray-100 rounded animate-pulse ${
            responsive.isMobile ? 'h-32' : 'h-16'}`
            }></div>
            )}
            </div> :
          products.length === 0 ?
          <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {debouncedSearchTerm ? `No products found matching "${debouncedSearchTerm}"` : 'No products found'}
              </p>
              <Button
              variant="outline"
              className="mt-4"
              onClick={() => debouncedSearchTerm ? handleClearSearch() : canCreateProduct ? navigate('/products/new') : null}
              disabled={!debouncedSearchTerm && !canCreateProduct}>
                {debouncedSearchTerm ? 'Clear Search' : canCreateProduct ? 'Add Your First Product' : 'No Create Permission'}
              </Button>
            </div> :

          responsive.isMobile ?
          <ProductCards
            products={products}
            searchTerm={debouncedSearchTerm}
            onViewLogs={handleViewLogs}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDelete}
            savingProductId={savingProductId}
            userRole={userProfile?.role} /> :


          <ResponsiveTable className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serial</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Last Updated Date</TableHead>
                    <TableHead>Last Shopping Date</TableHead>
                    <TableHead>Case Price</TableHead>
                    <TableHead>Unit Per Case</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Retail Price</TableHead>
                    <TableHead>Profit Margin</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {safeMap(products, (product, index) => {
                  const formatDate = (dateString: string) => {
                    if (!dateString) return '-';
                    try {
                      return new Date(dateString).toLocaleDateString();
                    } catch {
                      return '-';
                    }
                  };

                  return (
                    <TableRow key={generateSafeKey(product, index, 'product')}>
                        <TableCell className="font-medium">{product.serial_number || '-'}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {debouncedSearchTerm ?
                            getSearchData(product.product_name).highlightComponent :
                            product.product_name
                            }
                            </p>
                            {product.description &&
                          <p className="text-sm text-gray-500 truncate max-w-xs">
                                {debouncedSearchTerm ?
                            getSearchData(product.description).highlightComponent :
                            product.description
                            }
                              </p>
                          }
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.weight && product.weight > 0 ?
                        `${product.weight} ${product.weight_unit || 'lb'}` : '-'
                        }
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {debouncedSearchTerm ?
                          getSearchData(product.department || 'Convenience Store').highlightComponent :
                          product.department || 'Convenience Store'
                          }
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {debouncedSearchTerm ?
                        getSearchData(product.supplier || '-').highlightComponent :
                        product.supplier || '-'
                        }
                        </TableCell>
                        <TableCell>{formatDate(product.last_updated_date)}</TableCell>
                        <TableCell>{formatDate(product.last_shopping_date)}</TableCell>
                        <TableCell>
                          {product.case_price ? `$${product.case_price.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell>{product.unit_per_case || '-'}</TableCell>
                        <TableCell>
                          {product.unit_price ? `$${product.unit_price.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell>
                          {product.retail_price ? `$${product.retail_price.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell>
                          {(() => {
                          if (product.unit_price && product.retail_price && product.retail_price > 0) {
                            const margin = (product.retail_price - product.unit_price) / product.retail_price * 100;
                            return (
                              <Badge
                                variant={margin > 20 ? 'default' : margin > 10 ? 'secondary' : 'destructive'}
                                className="text-xs">
                                  {margin.toFixed(1)}%
                                </Badge>);
                          }
                          return '-';
                        })()} 
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {/* Only show Edit button if user is admin */}
                            {userProfile?.role === 'Administrator' || userProfile?.role === 'Admin' ?
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              console.log('Editing product:', product.ID);
                              handleEdit(product.ID);
                            }}
                            title="Edit product"
                            className="text-blue-600 hover:text-blue-700">
                                <Edit className="w-4 h-4" />
                              </Button> :
                          null}
                            
                            <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              console.log('Viewing changelog for product:', product.ID, product.product_name);
                              handleViewChangelog(product.ID, product.product_name);
                            }}
                            title="View changelog"
                            className="text-green-600 hover:text-green-700">
                              <History className="w-4 h-4" />
                            </Button>
                            <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              console.log('Viewing logs for product:', product.ID, product.product_name);
                              handleViewLogs(product.ID, product.product_name);
                            }}
                            title="View change logs">
                              <FileText className="w-4 h-4" />
                            </Button>
                            
                            {/* Only show Delete button if user is admin */}
                            {userProfile?.role === 'Administrator' || userProfile?.role === 'Admin' ?
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              console.log('Deleting product:', product.ID);
                              handleDelete(product.ID);
                            }}
                            className="text-red-600 hover:text-red-700"
                            title="Delete product">
                                <Trash2 className="w-4 h-4" />
                              </Button> :
                          null}
                          </div>
                        </TableCell>
                      </TableRow>);

                })}</TableBody>
              </Table>
            </ResponsiveTable>
          }

          {/* Loading Status and Infinite Scroll */}
          {products.length > 0 &&
          <div className="mt-6">
              <p className="text-sm text-gray-700 text-center mb-4">
                {getDisplayText()}
              </p>
              
              {/* Loading trigger for infinite scroll */}
              {hasMoreProducts &&
            <div
              ref={loadingTriggerRef}
              className="flex items-center justify-center py-8">

                  {isLoadingMore ?
              <div className="flex items-center space-x-2 text-gray-500">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Loading more products...</span>
                    </div> :

              <div className="text-gray-400 text-sm">
                      Scroll down to load more products
                    </div>
              }
                </div>
            }
              
              {!hasMoreProducts && totalCount > pageSize &&
            <div className="text-center py-4 text-sm text-gray-500">
                  You've reached the end - all {totalCount} products loaded
                </div>
            }
            </div>
          }
        </CardContent>
      </Card>

      {/* Product Logs Modal */}
      {selectedProduct &&
      <ProductLogs
        isOpen={logsModalOpen}
        onClose={() => {
          setLogsModalOpen(false);
          setSelectedProduct(null);
        }}
        productId={selectedProduct.id}
        productName={selectedProduct.name} />
      }

      {/* Product Changelog Modal */}
      {selectedProduct &&
      <ProductChangelogDialog
        isOpen={changelogModalOpen}
        onClose={() => {
          setChangelogModalOpen(false);
          setSelectedProduct(null);
        }}
        productId={selectedProduct.id}
        productName={selectedProduct.name} />
      }
    </ResponsiveStack>);
};

export default ProductList;