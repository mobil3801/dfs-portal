import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { Fuel, ShoppingCart, Info } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface GasGrocerySalesSectionProps {
  station: string;
  values: {
    creditCardAmount: number;
    debitCardAmount: number;
    mobileAmount: number;
    cashAmount: number;
    grocerySales: number;
    ebtSales?: number; // Only for MOBIL
    // New grocery breakdown fields
    groceryCashSales?: number;
    groceryCardSales?: number;
  };
  onChange: (field: string, value: number) => void;
}

const GasGrocerySalesSection: React.FC<GasGrocerySalesSectionProps> = ({
  station,
  values,
  onChange
}) => {
  const isMobile = useIsMobile();
  const isMobil = station === 'MOBIL';

  // Total Sales - Auto calculated (Credit Card + Debit Card + Mobile Payment + Cash + Grocery)
  const totalSales = values.creditCardAmount + values.debitCardAmount + values.mobileAmount + values.cashAmount + values.grocerySales;

  // Total Grocery Sales - Auto calculated (Cash Sales + Credit/Debit Card + EBT)
  const totalGrocerySales = (values.groceryCashSales || 0) + (values.groceryCardSales || 0) + (values.ebtSales || 0);

  return (
    <div className="space-y-6">
      {/* Gas & Grocery Sales Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center space-x-2">
            <Fuel className="w-5 h-5" />
            <span>Gas & Grocery Sales</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-4'}`}>
            <div className="space-y-2">
              <Label htmlFor="creditCard">Credit Card Amount ($) *</Label>
              <NumberInput
                id="creditCard"
                value={values.creditCardAmount}
                onChange={(value) => onChange('creditCardAmount', value || 0)}
                allowNegative={true}
                step={0.01}
                precision={2}
                required />

            </div>
            <div className="space-y-2">
              <Label htmlFor="debitCard">Debit Card Amount ($) *</Label>
              <NumberInput
                id="debitCard"
                value={values.debitCardAmount}
                onChange={(value) => onChange('debitCardAmount', value || 0)}
                allowNegative={true}
                step={0.01}
                precision={2}
                required />

            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Payment Amount ($) *</Label>
              <NumberInput
                id="mobile"
                value={values.mobileAmount}
                onChange={(value) => onChange('mobileAmount', value || 0)}
                allowNegative={true}
                step={0.01}
                precision={2}
                required />

            </div>
            <div className="space-y-2">
              <Label htmlFor="cash">Cash Amount ($) *</Label>
              <NumberInput
                id="cash"
                value={values.cashAmount}
                onChange={(value) => onChange('cashAmount', value || 0)}
                allowNegative={true}
                step={0.01}
                precision={2}
                required />

            </div>
            <div className="space-y-2">
              <Label htmlFor="grocery">Grocery Sales ($) *</Label>
              <NumberInput
                id="grocery"
                value={values.grocerySales}
                onChange={(value) => onChange('grocerySales', value || 0)}
                allowNegative={true}
                step={0.01}
                precision={2}
                required />

            </div>
          </div>
          
          <div className="pt-4 border-t border-blue-200">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Total Sales (Auto-calculated)</Label>
              <div className="text-2xl font-bold text-blue-800">${totalSales.toFixed(2)}</div>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Credit Card + Debit Card + Mobile Payment + Cash + Grocery = ${totalSales.toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grocery Sales Breakdown Section */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5" />
            <span>Grocery Sales Breakdown</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-3 gap-4'}`}>
            <div className="space-y-2">
              <Label htmlFor="groceryCash">Cash Sales ($) *</Label>
              <NumberInput
                id="groceryCash"
                value={values.groceryCashSales || 0}
                onChange={(value) => onChange('groceryCashSales', value || 0)}
                allowNegative={true}
                step={0.01}
                precision={2}
                required />

            </div>
            <div className="space-y-2">
              <Label htmlFor="groceryCard">Credit/Debit Card ($) *</Label>
              <NumberInput
                id="groceryCard"
                value={values.groceryCardSales || 0}
                onChange={(value) => onChange('groceryCardSales', value || 0)}
                allowNegative={true}
                step={0.01}
                precision={2}
                required />

            </div>
            {isMobil &&
            <div className="space-y-2">
                <Label htmlFor="ebt">EBT ($) *</Label>
                <NumberInput
                id="ebt"
                value={values.ebtSales || 0}
                onChange={(value) => onChange('ebtSales', value || 0)}
                allowNegative={true}
                step={0.01}
                precision={2}
                required />

              </div>
            }
          </div>
          
          <div className="pt-4 border-t border-green-200">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Total Grocery Sales (Auto-calculated)</Label>
              <div className="text-2xl font-bold text-green-800">${totalGrocerySales.toFixed(2)}</div>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Cash Sales (${(values.groceryCashSales || 0).toFixed(2)}) + Credit/Debit Card (${(values.groceryCardSales || 0).toFixed(2)}){isMobil ? ` + EBT (${(values.ebtSales || 0).toFixed(2)})` : ''} = ${totalGrocerySales.toFixed(2)}
            </div>
            {/* Sync notification */}
            {totalGrocerySales !== values.grocerySales &&
            <div className="text-xs text-amber-600 mt-1 bg-amber-50 p-2 rounded border border-amber-200">
                <Info className="w-3 h-3 inline mr-1" />
                Grocery sales total will be updated automatically when you save.
              </div>
            }
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      











    </div>);

};

export default GasGrocerySalesSection;