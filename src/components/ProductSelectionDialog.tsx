import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NumberInput } from '@/components/ui/number-input';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, X } from 'lucide-react';
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
}

interface ProductSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirm: (product: Product, quantity: number, unitType: string) => void;
}

const ProductSelectionDialog: React.FC<ProductSelectionDialogProps> = ({
  isOpen,
  onClose,
  product,
  onConfirm
}) => {
  const [quantity, setQuantity] = useState(1);
  const [unitType, setUnitType] = useState('pieces');

  // Unit type options
  const unitTypes = [
  { value: 'pieces', label: 'Pieces (Individual Units)' },
  { value: 'cases', label: 'Cases (Bulk Units)' },
  { value: 'boxes', label: 'Boxes' },
  { value: 'packs', label: 'Packs' },
  { value: 'bottles', label: 'Bottles' },
  { value: 'cans', label: 'Cans' },
  { value: 'bags', label: 'Bags' },
  { value: 'cartons', label: 'Cartons' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'gallons', label: 'Gallons' },
  { value: 'liters', label: 'Liters' },
  { value: 'pounds', label: 'Pounds' },
  { value: 'kilograms', label: 'Kilograms' }];


  const handleConfirm = () => {
    if (!product) return;

    if (quantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity greater than 0",
        variant: "destructive"
      });
      return;
    }

    if (quantity > product.quantity_in_stock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.quantity_in_stock} units available in stock`,
        variant: "destructive"
      });
      return;
    }

    onConfirm(product, quantity, unitType);
    handleClose();
  };

  const handleClose = () => {
    setQuantity(1);
    setUnitType('pieces');
    onClose();
  };

  const calculatePrice = () => {
    if (!product) return 0;

    // Calculate price based on unit type
    let pricePerUnit = product.price;

    if (unitType === 'cases' && product.unit_per_case > 0) {
      pricePerUnit = product.price * product.unit_per_case;
    }

    return pricePerUnit * quantity;
  };

  const getUnitInfo = () => {
    if (!product) return '';

    if (unitType === 'cases' && product.unit_per_case > 0) {
      return `(${product.unit_per_case} pieces per case)`;
    }

    return '';
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Add Product to Order</span>
          </DialogTitle>
          <DialogDescription>
            Configure the quantity and unit type for this product
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg">{product.product_name}</h3>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-muted-foreground">
                Product Code: <span className="font-medium">{product.product_code}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Category: <span className="font-medium">{product.category}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Supplier: <span className="font-medium">{product.supplier}</span>
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary">
                  ${product.price.toFixed(2)} per unit
                </Badge>
                <Badge variant="outline">
                  {product.quantity_in_stock} in stock
                </Badge>
              </div>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <NumberInput
              id="quantity"
              value={quantity}
              onChange={setQuantity}
              min={1}
              max={product.quantity_in_stock}
              className="w-full"
              placeholder="Enter quantity" />

            <p className="text-xs text-muted-foreground">
              Maximum available: {product.quantity_in_stock} units
            </p>
          </div>

          {/* Unit Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="unitType">Unit Type *</Label>
            <Select value={unitType} onValueChange={setUnitType}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit type" />
              </SelectTrigger>
              <SelectContent>
                {unitTypes.map((unit) =>
                <SelectItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {getUnitInfo() &&
            <p className="text-xs text-muted-foreground">{getUnitInfo()}</p>
            }
          </div>

          {/* Price Calculation */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Price:</span>
              <span className="text-lg font-bold text-blue-600">
                ${calculatePrice().toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {quantity} {unitType} × ${(calculatePrice() / quantity).toFixed(2)} each
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3">
            <Button variant="outline" onClick={handleClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              <Plus className="w-4 h-4 mr-2" />
              Add to Order
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>);

};

export default ProductSelectionDialog;