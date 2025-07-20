import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, Calculator, Info } from 'lucide-react';

interface CashCollectionSectionProps {
  values: {
    cashCollectionOnHand: number;
    totalCashFromSales: number; // Gas Cash + Grocery Cash + Lottery Cash
    totalCashFromExpenses: number; // Cash expenses that reduce expected cash
    totalShortOver?: number; // Passed from parent calculation
  };
  onChange: (field: string, value: number) => void;
}

const CashCollectionSection: React.FC<CashCollectionSectionProps> = ({
  values,
  onChange
}) => {
  // Use the totalShortOver passed from parent or calculate it
  const shortOver = values.totalShortOver ?? values.cashCollectionOnHand - (values.totalCashFromSales - values.totalCashFromExpenses);
  const isShort = shortOver < 0;
  const isOver = shortOver > 0;
  const expectedCash = values.totalCashFromSales - values.totalCashFromExpenses;

  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-800 flex items-center space-x-2">
          <DollarSign className="w-5 h-5" />
          <span>Cash Collection</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cashOnHand">Cash Collection on Hand ($) *</Label>
            <NumberInput
              id="cashOnHand"
              value={values.cashCollectionOnHand}
              onChange={(value) => onChange('cashCollectionOnHand', value || 0)}
              allowNegative={true}
              step={0.01}
              precision={2}
              required />

            <div className="text-xs text-gray-600">
              Physical cash counted at end of shift (can be negative if short)
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Expected Cash ($)</Label>
            <div className="h-10 px-3 py-2 border border-gray-200 rounded-md bg-gray-100 flex items-center">
              <span className="text-gray-700 font-medium">${expectedCash.toFixed(2)}</span>
            </div>
            <div className="text-xs text-gray-600">
              Cash sales - Cash expenses
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Total (+/-) Short/Over</Label>
            <div className="h-10 px-3 py-2 border rounded-md flex items-center justify-between bg-white">
              <span className={`font-bold text-lg ${
              isShort ? 'text-red-600' : isOver ? 'text-green-600' : 'text-gray-700'}`
              }>
                {isShort ? '-' : isOver ? '+' : ''}${Math.abs(shortOver).toFixed(2)}
              </span>
              {isShort && <TrendingDown className="w-5 h-5 text-red-600" />}
              {isOver && <TrendingUp className="w-5 h-5 text-green-600" />}
            </div>
            <div className="flex items-center space-x-1">
              {isShort &&
              <Badge variant="destructive" className="text-xs">
                  Short
                </Badge>
              }
              {isOver &&
              <Badge className="bg-green-100 text-green-800 text-xs">
                  Over
                </Badge>
              }
              {!isShort && !isOver &&
              <Badge variant="outline" className="text-xs">
                  Exact
                </Badge>
              }
            </div>
          </div>
        </div>
        
        {/* Calculation Breakdown */}
        <div className="pt-4 border-t border-gray-200 bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">Short/Over Calculation Breakdown</span>
          </div>
          
          <div className="text-sm text-blue-800 space-y-2">
            <div className="flex justify-between">
              <span>Total Cash from Sales:</span>
              <span className="font-medium">+${values.totalCashFromSales.toFixed(2)}</span>
            </div>
            <div className="text-xs text-blue-600 ml-4 space-y-1">
              <div className="flex justify-between">
                <span>• Gas & Grocery Cash:</span>
                <span>Included above</span>
              </div>
              <div className="flex justify-between">
                <span>• Grocery Breakdown Cash:</span>
                <span>Included above</span>
              </div>
              <div className="flex justify-between">
                <span>• NY Lottery Total Cash:</span>
                <span>Included above</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span>Cash Expenses:</span>
              <span className="font-medium">-${values.totalCashFromExpenses.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-blue-200 pt-2 font-semibold">
              <span>Expected Cash:</span>
              <span>${expectedCash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Actual Cash on Hand:</span>
              <span className="font-medium">${values.cashCollectionOnHand.toFixed(2)}</span>
            </div>
            <div className={`flex justify-between border-t border-blue-200 pt-2 font-bold ${
            isShort ? 'text-red-600' : isOver ? 'text-green-600' : 'text-blue-800'}`
            }>
              <span>Difference (Short/Over):</span>
              <span>{isShort ? '-' : isOver ? '+' : ''}${Math.abs(shortOver).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Formula Information */}
        










      </CardContent>
    </Card>);

};

export default CashCollectionSection;