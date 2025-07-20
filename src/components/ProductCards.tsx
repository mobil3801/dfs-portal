import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Save, Trash2, Loader2 } from 'lucide-react';
import HighlightText from '@/components/HighlightText';

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

interface ProductCardsProps {
  products: Product[];
  searchTerm: string;
  onViewLogs: (id: number, name: string) => void;
  onSaveProduct: (id: number) => void;
  onDeleteProduct: (id: number) => void;
  savingProductId: number | null;
  userRole?: string;
}

const ProductCards: React.FC<ProductCardsProps> = ({
  products,
  searchTerm,
  onViewLogs,
  onSaveProduct,
  onDeleteProduct,
  savingProductId,
  userRole
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return '-';
    }
  };

  const getSearchData = (text: string) => {
    if (!searchTerm || !text) {
      return {
        keywords: [],
        allMatch: false,
        highlightComponent: text
      };
    }

    const searchKeywords = searchTerm.toLowerCase().trim().split(/\s+/).filter((keyword) => keyword.length > 0);
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

  const calculateMargin = (product: Product) => {
    if (product.unit_price && product.retail_price && product.retail_price > 0) {
      const margin = (product.retail_price - product.unit_price) / product.retail_price * 100;
      return {
        value: margin,
        variant: margin > 20 ? 'default' : margin > 10 ? 'secondary' : 'destructive'
      };
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {products.map((product) => {
        const margin = calculateMargin(product);

        return (
          <Card key={product.ID} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg leading-tight">
                    {searchTerm ?
                    getSearchData(product.product_name).highlightComponent :
                    product.product_name
                    }
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      #{product.serial_number || '-'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {searchTerm ?
                      getSearchData(product.department || 'Convenience Store').highlightComponent :
                      product.department || 'Convenience Store'
                      }
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewLogs(product.ID, product.product_name)}
                    className="p-2"
                    title="View logs">

                    <FileText className="w-4 h-4" />
                  </Button>
                  {/* Only show Save button if user is admin */}
                  {(userRole === 'Administrator' || userRole === 'Admin') &&
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSaveProduct(product.ID)}
                    disabled={savingProductId === product.ID}
                    className="p-2"
                    title="Save product">

                      {savingProductId === product.ID ?
                    <Loader2 className="w-4 h-4 animate-spin" /> :
                    <Save className="w-4 h-4" />
                    }
                    </Button>
                  }
                  {/* Only show Delete button if user is admin */}
                  {(userRole === 'Administrator' || userRole === 'Admin') &&
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteProduct(product.ID)}
                    className="p-2 text-red-600 hover:text-red-700"
                    title="Delete product">

                      <Trash2 className="w-4 h-4" />
                    </Button>
                  }
                </div>
              </div>
              {product.description &&
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {searchTerm ?
                getSearchData(product.description).highlightComponent :
                product.description
                }
                </p>
              }
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Pricing Information */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Unit Price:</span>
                  <div className="font-medium">
                    {product.unit_price ? `$${product.unit_price.toFixed(2)}` : '-'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Retail Price:</span>
                  <div className="font-medium">
                    {product.retail_price ? `$${product.retail_price.toFixed(2)}` : '-'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Case Price:</span>
                  <div className="font-medium">
                    {product.case_price ? `$${product.case_price.toFixed(2)}` : '-'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Profit Margin:</span>
                  <div className="font-medium">
                    {margin ?
                    <Badge variant={margin.variant as any} className="text-xs">
                        {margin.value.toFixed(1)}%
                      </Badge> :
                    '-'}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-1 gap-2 text-sm border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Weight:</span>
                  <span className="font-medium">
                    {product.weight && product.weight > 0 ?
                    `${product.weight} ${product.weight_unit || 'lb'}` :
                    '-'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Supplier:</span>
                  <span className="font-medium truncate ml-2">
                    {searchTerm ?
                    getSearchData(product.supplier || '-').highlightComponent :
                    product.supplier || '-'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Unit per Case:</span>
                  <span className="font-medium">{product.unit_per_case || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Updated:</span>
                  <span className="font-medium">{formatDate(product.last_updated_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Shopping:</span>
                  <span className="font-medium">{formatDate(product.last_shopping_date)}</span>
                </div>
              </div>
            </CardContent>
          </Card>);

      })}
    </div>);

};

export default ProductCards;