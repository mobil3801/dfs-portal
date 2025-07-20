import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Package, X, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Product {
  ID: number;
  product_name: string;
  product_code: string;
  category: string;
  price: number;
  retail_price: number;
  quantity_in_stock: number;
  supplier: string;
  unit_per_case: number;
  weight: number;
  weight_unit: string;
  minimum_stock: number;
  description: string;
  department: string;
  updated_at: string;
  bar_code_case: string;
  bar_code_unit: string;
}

interface ProductSearchBarProps {
  onProductSelect: (product: Product) => void;
  placeholder?: string;
  showAllProducts?: boolean;
}

const ProductSearchBar: React.FC<ProductSearchBarProps> = ({
  onProductSelect,
  placeholder = "Search products by name, code, category, or supplier...",
  showAllProducts = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load all products on component mount
  useEffect(() => {
    if (showAllProducts) {
      loadAllProducts();
    }
  }, [showAllProducts]);

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(showAllProducts ? allProducts : []);
      setShowResults(showAllProducts && allProducts.length > 0);
    } else {
      const filtered = allProducts.filter((product) =>
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.bar_code_case.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.bar_code_unit.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
      setShowResults(filtered.length > 0);
    }
  }, [searchTerm, allProducts, showAllProducts]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadAllProducts = async () => {
    try {
      setIsLoading(true);
      console.log('Loading all products from products table...');

      const { data, error } = await window.ezsite.apis.tablePage('11726', {
        PageNo: 1,
        PageSize: 1000, // Load a large number to get all products
        OrderByField: 'product_name',
        IsAsc: true,
        Filters: []
      });

      if (error) throw error;

      const products = data?.List || [];
      console.log(`Loaded ${products.length} products:`, products);
      setAllProducts(products);
      setFilteredProducts(products);

      if (products.length === 0) {
        toast({
          title: "No Products Found",
          description: "No products are available in the database.",
          variant: "default"
        });
      }

    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error Loading Products",
        description: "Failed to load products from database",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProducts = () => {
    loadAllProducts();
  };

  const handleProductClick = (product: Product) => {
    console.log('Product selected:', product);
    onProductSelect(product);
    setSearchTerm('');
    setShowResults(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilteredProducts(showAllProducts ? allProducts : []);
    setShowResults(showAllProducts && allProducts.length > 0);
  };

  return (
    <Card className="border-2 border-dashed border-blue-300 hover:border-blue-500 transition-colors">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Search className="w-12 h-12 text-blue-600" />
            <Button
              onClick={refreshProducts}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="flex items-center space-x-2">

              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
          <h3 className="text-lg font-semibold">Product Search & Browse</h3>
          <p className="text-muted-foreground">
            Search products by name, code, category, supplier, or browse all available products
          </p>
          {allProducts.length > 0 &&
          <p className="text-sm text-green-600 font-medium">
              {filteredProducts.length} of {allProducts.length} products shown
            </p>
          }
          
          <div ref={searchRef} className="relative w-full max-w-md mx-auto">
            <div className="relative">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={placeholder}
                className="pr-20"
                onFocus={() => setShowResults(filteredProducts.length > 0)} />

              
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                {isLoading &&
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                }
                {searchTerm &&
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="h-6 w-6 p-0">
                    <X className="h-3 w-3" />
                  </Button>
                }
              </div>
            </div>

            {/* Search Results Dropdown */}
            {showResults && filteredProducts.length > 0 &&
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="sticky top-0 bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <p className="text-xs text-gray-600 font-medium">
                    {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                {filteredProducts.map((product) =>
              <div
                key={product.ID}
                className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                onClick={() => handleProductClick(product)}>

                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <Package className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <h4 className="font-medium text-sm truncate">
                            {product.product_name}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Code: {product.product_code} | Category: {product.category} | Supplier: {product.supplier}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-green-600 font-medium">
                              Cost: ${product.price?.toFixed(2) || '0.00'}
                            </span>
                            <span className="text-xs text-blue-600 font-medium">
                              Retail: ${product.retail_price?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs font-medium ${
                        product.quantity_in_stock <= product.minimum_stock ?
                        'text-red-600' :
                        product.quantity_in_stock <= product.minimum_stock * 2 ?
                        'text-yellow-600' :
                        'text-green-600'}`
                        }>
                              Stock: {product.quantity_in_stock}
                            </span>
                            {product.quantity_in_stock <= product.minimum_stock &&
                        <span className="text-xs bg-red-100 text-red-700 px-1 py-0.5 rounded">
                                Low Stock
                              </span>
                        }
                          </div>
                        </div>
                        {product.description &&
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {product.description}
                          </p>
                    }
                      </div>
                    </div>
                  </div>
              )}
              </div>
            }

            {/* No Results Message */}
            {searchTerm && filteredProducts.length === 0 && !isLoading &&
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No products found matching "{searchTerm}"
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Try searching by product name, code, category, or supplier
                </p>
              </div>
            }
            
            {/* Loading Message */}
            {isLoading &&
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-4 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-muted-foreground">
                    Loading products...
                  </p>
                </div>
              </div>
            }
          </div>
        </div>
      </CardContent>
    </Card>);

};

export default ProductSearchBar;