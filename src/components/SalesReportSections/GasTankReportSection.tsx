import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { Gauge, Info } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface GasTankReportSectionProps {
  values: {
    regularGallons: number;
    superGallons: number;
    dieselGallons: number;
  };
  onChange: (field: string, value: number) => void;
}

const GasTankReportSection: React.FC<GasTankReportSectionProps> = ({
  values,
  onChange
}) => {
  const isMobile = useIsMobile();

  // Total Gallon Sold - Auto calculated (Regular + Super + Diesel)
  const totalGallonsSold = values.regularGallons + values.superGallons + values.dieselGallons;

  return (
    <div className="space-y-4">
      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center space-x-2">
            <Gauge className="w-5 h-5" />
            <span>Gas Tank Report</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'md:grid-cols-3 gap-4'}`}>
            <div className="space-y-2">
              <Label htmlFor="regular">Regular (Gallons) *</Label>
              <NumberInput
                id="regular"
                value={values.regularGallons}
                onChange={(value) => onChange('regularGallons', value || 0)}
                allowNegative={true}
                step={0.01}
                precision={2}
                required />

            </div>
            <div className="space-y-2">
              <Label htmlFor="super">Super (Gallons) *</Label>
              <NumberInput
                id="super"
                value={values.superGallons}
                onChange={(value) => onChange('superGallons', value || 0)}
                allowNegative={true}
                step={0.01}
                precision={2}
                required />

            </div>
            <div className="space-y-2">
              <Label htmlFor="diesel">Diesel (Gallons) *</Label>
              <NumberInput
                id="diesel"
                value={values.dieselGallons}
                onChange={(value) => onChange('dieselGallons', value || 0)}
                allowNegative={true}
                step={0.01}
                precision={2}
                required />

            </div>
          </div>
          
          <div className="pt-4 border-t border-red-200">
            <div className="flex items-center justify-between">
              <Label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-lg font-semibold">Total Gallon Sold</Label>
              <div className="text-2xl font-bold text-red-800">{totalGallonsSold.toFixed(2)} gal</div>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Regular + Super + Diesel = {totalGallonsSold.toFixed(2)} gallons
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      











    </div>);

};

export default GasTankReportSection;