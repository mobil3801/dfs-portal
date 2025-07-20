import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { Ticket, Info } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface LotterySalesSectionProps {
  values: {
    lotteryNetSales: number;
    scratchOffSales: number;
  };
  onChange: (field: string, value: number) => void;
}

const LotterySalesSection: React.FC<LotterySalesSectionProps> = ({
  values,
  onChange
}) => {
  const isMobile = useIsMobile();

  // Total Sales Cash - Auto calculated (Net Sales + Scratch Off Sales)
  const totalSalesCash = values.lotteryNetSales + values.scratchOffSales;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-800 flex items-center space-x-2">
            <Ticket className="w-5 h-5" />
            <span>NY Lottery Sales</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-2 gap-4'}`}>
            <div className="space-y-2">
              <Label htmlFor="lotteryNet">Net Sales ($) *</Label>
              <NumberInput
                id="lotteryNet"
                value={values.lotteryNetSales}
                onChange={(value) => onChange('lotteryNetSales', value || 0)}
                allowNegative={true}
                step={0.01}
                precision={2}
                required />

            </div>
            <div className="space-y-2">
              <Label htmlFor="scratchOff">Scratch Off Sales ($) *</Label>
              <NumberInput
                id="scratchOff"
                value={values.scratchOffSales}
                onChange={(value) => onChange('scratchOffSales', value || 0)}
                allowNegative={true}
                step={0.01}
                precision={2}
                required />

            </div>
          </div>
          
          <div className="pt-4 border-t border-yellow-200">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Total Sales Cash (Auto-calculated)</Label>
              <div className="text-2xl font-bold text-yellow-800">${totalSalesCash.toFixed(2)}</div>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Net Sales + Scratch Off Sales = ${totalSalesCash.toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      











    </div>);

};

export default LotterySalesSection;