import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Truck, Save, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import StationDropdown from '@/components/StationDropdown';

interface DeliveryRecord {
  id?: number;
  delivery_date: string;
  bol_number: string;
  station: string;
  regular_tank_volume: number;
  plus_tank_volume: number;
  super_tank_volume: number;
  regular_delivered: number;
  plus_delivered: number;
  super_delivered: number;
  delivery_notes: string;
  created_by: number;
}

interface AfterDeliveryReport {
  regular_tank_final: number;
  plus_tank_final: number;
  super_tank_final: number;
}

interface DiscrepancyData {
  regular_expected: number;
  plus_expected: number;
  super_expected: number;
  regular_discrepancy: number;
  plus_discrepancy: number;
  super_discrepancy: number;
  has_discrepancy: boolean;
}

const DeliveryForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<DeliveryRecord>({
    delivery_date: new Date().toISOString().split('T')[0],
    bol_number: '',
    station: '',
    regular_tank_volume: 0,
    plus_tank_volume: 0,
    super_tank_volume: 0,
    regular_delivered: 0,
    plus_delivered: 0,
    super_delivered: 0,
    delivery_notes: '',
    created_by: 1 // This should be set from auth context
  });

  const [afterDeliveryData, setAfterDeliveryData] = useState<AfterDeliveryReport>({
    regular_tank_final: 0,
    plus_tank_final: 0,
    super_tank_final: 0
  });

  const [discrepancyData, setDiscrepancyData] = useState<DiscrepancyData>({
    regular_expected: 0,
    plus_expected: 0,
    super_expected: 0,
    regular_discrepancy: 0,
    plus_discrepancy: 0,
    super_discrepancy: 0,
    has_discrepancy: false
  });

  // Calculate expected tank levels and discrepancies
  useEffect(() => {
    const regular_expected = formData.regular_tank_volume + formData.regular_delivered;
    const plus_expected = formData.plus_tank_volume + formData.plus_delivered;
    const super_expected = formData.super_tank_volume + formData.super_delivered;

    const regular_discrepancy = afterDeliveryData.regular_tank_final - regular_expected;
    const plus_discrepancy = afterDeliveryData.plus_tank_final - plus_expected;
    const super_discrepancy = afterDeliveryData.super_tank_final - super_expected;

    const tolerance = 5; // 5 gallon tolerance
    const has_discrepancy =
    Math.abs(regular_discrepancy) > tolerance ||
    Math.abs(plus_discrepancy) > tolerance ||
    Math.abs(super_discrepancy) > tolerance;

    setDiscrepancyData({
      regular_expected,
      plus_expected,
      super_expected,
      regular_discrepancy,
      plus_discrepancy,
      super_discrepancy,
      has_discrepancy
    });
  }, [formData, afterDeliveryData.regular_tank_final, afterDeliveryData.plus_tank_final, afterDeliveryData.super_tank_final]);

  useEffect(() => {
    if (id) {
      loadDeliveryRecord();
    }
  }, [id]);

  const loadAfterDeliveryReport = async (deliveryId: number) => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(12331, {
        PageNo: 1,
        PageSize: 1,
        Filters: [{ name: 'delivery_record_id', op: 'Equal', value: deliveryId }]
      });

      if (error) throw error;

      if (data?.List?.length > 0) {
        const report = data.List[0];
        setAfterDeliveryData({
          regular_tank_final: report.regular_tank_final || 0,
          plus_tank_final: report.plus_tank_final || 0,
          super_tank_final: report.super_tank_final || 0
        });
      }
    } catch (error) {
      console.error('Error loading after delivery report:', error);
    }
  };

  const loadDeliveryRecord = async () => {
    try {
      setLoading(true);
      const { data, error } = await window.ezsite.apis.tablePage(12196, {
        PageNo: 1,
        PageSize: 1,
        Filters: [{ name: 'id', op: 'Equal', value: parseInt(id!) }]
      });

      if (error) throw error;

      if (data?.List?.length > 0) {
        const record = data.List[0];
        setFormData({
          ...record,
          delivery_date: record.delivery_date ? new Date(record.delivery_date).toISOString().split('T')[0] : ''
        });

        // Load associated after-delivery tank report if exists
        loadAfterDeliveryReport(parseInt(id!));
      }
    } catch (error) {
      console.error('Error loading delivery record:', error);
      toast({
        title: "Error",
        description: "Failed to load delivery record",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.station || !formData.delivery_date || !formData.bol_number) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Date, BOL Number, and Station)",
        variant: "destructive"
      });
      return;
    }

    // Check if ALL station is selected (not allowed for delivery records)
    if (formData.station === 'ALL') {
      toast({
        title: "Invalid Station Selection",
        description: "Please select a specific station for delivery records. 'ALL' is not allowed.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        ...formData,
        delivery_date: new Date(formData.delivery_date).toISOString()
      };

      let deliveryRecordId;

      if (id) {
        const { error } = await window.ezsite.apis.tableUpdate(12196, {
          ID: parseInt(id),
          ...submitData
        });
        if (error) throw error;
        deliveryRecordId = parseInt(id);

        toast({
          title: "Success",
          description: "Delivery record updated successfully"
        });
      } else {
        const { data, error } = await window.ezsite.apis.tableCreate(12196, submitData);
        if (error) throw error;
        deliveryRecordId = data.ID;

        toast({
          title: "Success",
          description: "Delivery record created successfully"
        });
      }

      // Save after-delivery tank report if any final tank values are provided
      if (afterDeliveryData.regular_tank_final > 0 || afterDeliveryData.plus_tank_final > 0 || afterDeliveryData.super_tank_final > 0) {
        const afterDeliverySubmitData = {
          report_date: new Date().toISOString(),
          station: formData.station,
          delivery_record_id: deliveryRecordId,
          bol_number: formData.bol_number,
          regular_tank_final: afterDeliveryData.regular_tank_final,
          plus_tank_final: afterDeliveryData.plus_tank_final,
          super_tank_final: afterDeliveryData.super_tank_final,
          created_by: formData.created_by
        };

        // Check if after-delivery report already exists for this delivery
        const { data: existingReport } = await window.ezsite.apis.tablePage(12331, {
          PageNo: 1,
          PageSize: 1,
          Filters: [{ name: 'delivery_record_id', op: 'Equal', value: deliveryRecordId }]
        });

        if (existingReport?.List?.length > 0) {
          // Update existing report
          const { error: afterError } = await window.ezsite.apis.tableUpdate(12331, {
            ID: existingReport.List[0].ID,
            ...afterDeliverySubmitData
          });
          if (afterError) throw afterError;
        } else {
          // Create new report
          const { error: afterError } = await window.ezsite.apis.tableCreate(12331, afterDeliverySubmitData);
          if (afterError) throw afterError;
        }
      }

      navigate('/delivery');
    } catch (error) {
      console.error('Error saving delivery record:', error);
      toast({
        title: "Error",
        description: "Failed to save delivery record",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof DeliveryRecord, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAfterDeliveryChange = (field: keyof AfterDeliveryReport, value: any) => {
    setAfterDeliveryData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading && id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading delivery record...</p>
        </div>
      </div>);

  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Button
          onClick={() => navigate('/delivery')}
          variant="ghost"
          className="mb-4">

          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Delivery List
        </Button>
        
        <div className="flex items-center gap-2 mb-4">
          <Truck className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            {id ? 'Edit Delivery Record' : 'New Delivery Record'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="delivery_date">Delivery Date *</Label>
                <Input
                  id="delivery_date"
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => handleInputChange('delivery_date', e.target.value)}
                  required />

              </div>
              
              <div>
                <Label htmlFor="bol_number">BOL Number *</Label>
                <Input
                  id="bol_number"
                  type="text"
                  placeholder="Enter BOL Number"
                  value={formData.bol_number}
                  onChange={(e) => handleInputChange('bol_number', e.target.value)}
                  required />

              </div>
              
              <div>
                <StationDropdown
                  id="station"
                  label="Station"
                  value={formData.station}
                  onValueChange={(value) => handleInputChange('station', value)}
                  placeholder="Select station"
                  required
                  includeAll={false} // Delivery records should be for specific stations only
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Before Delivery Tank Report */}
        <Card>
          <CardHeader>
            <CardTitle>Before Delivery Tank Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="regular_tank_volume">Regular Tank Volume (Gallons)</Label>
                <NumberInput
                  id="regular_tank_volume"
                  step="0.01"
                  value={formData.regular_tank_volume}
                  onChange={(value) => handleInputChange('regular_tank_volume', value)} />

              </div>
              
              <div>
                <Label htmlFor="plus_tank_volume">Plus Tank Volume (Gallons)</Label>
                <NumberInput
                  id="plus_tank_volume"
                  step="0.01"
                  value={formData.plus_tank_volume}
                  onChange={(value) => handleInputChange('plus_tank_volume', value)} />

              </div>
              
              <div>
                <Label htmlFor="super_tank_volume">Super Tank Volume (Gallons)</Label>
                <NumberInput
                  id="super_tank_volume"
                  step="0.01"
                  value={formData.super_tank_volume}
                  onChange={(value) => handleInputChange('super_tank_volume', value)} />

              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivered Amounts */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Amounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="regular_delivered">Regular Delivered (Gallons)</Label>
                <NumberInput
                  id="regular_delivered"
                  step="0.01"
                  value={formData.regular_delivered}
                  onChange={(value) => handleInputChange('regular_delivered', value)} />

              </div>
              
              <div>
                <Label htmlFor="plus_delivered">Plus Delivered (Gallons)</Label>
                <NumberInput
                  id="plus_delivered"
                  step="0.01"
                  value={formData.plus_delivered}
                  onChange={(value) => handleInputChange('plus_delivered', value)} />

              </div>
              
              <div>
                <Label htmlFor="super_delivered">Super Delivered (Gallons)</Label>
                <NumberInput
                  id="super_delivered"
                  step="0.01"
                  value={formData.super_delivered}
                  onChange={(value) => handleInputChange('super_delivered', value)} />

              </div>
            </div>
          </CardContent>
        </Card>

        {/* After Delivery Tank Report */}
        <Card>
          <CardHeader>
            <CardTitle>After Delivery Tank Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="regular_tank_final">Regular Tank Final (Gallons)</Label>
                <NumberInput
                  id="regular_tank_final"
                  step="0.01"
                  value={afterDeliveryData.regular_tank_final}
                  onChange={(value) => handleAfterDeliveryChange('regular_tank_final', value)} />

              </div>
              
              <div>
                <Label htmlFor="plus_tank_final">Plus Tank Final (Gallons)</Label>
                <NumberInput
                  id="plus_tank_final"
                  step="0.01"
                  value={afterDeliveryData.plus_tank_final}
                  onChange={(value) => handleAfterDeliveryChange('plus_tank_final', value)} />

              </div>
              
              <div>
                <Label htmlFor="super_tank_final">Super Tank Final (Gallons)</Label>
                <NumberInput
                  id="super_tank_final"
                  step="0.01"
                  value={afterDeliveryData.super_tank_final}
                  onChange={(value) => handleAfterDeliveryChange('super_tank_final', value)} />

              </div>
            </div>
          </CardContent>
        </Card>

        {/* Discrepancy Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {discrepancyData.has_discrepancy ?
              <AlertTriangle className="h-5 w-5 text-red-500" /> :

              <CheckCircle className="h-5 w-5 text-green-500" />
              }
              Discrepancy Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {discrepancyData.has_discrepancy &&
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-red-800">Discrepancies Detected</span>
                </div>
                <p className="text-red-700 text-sm">
                  One or more tank levels show discrepancies greater than 5 gallons. Please review and verify the measurements.
                </p>
              </div>
            }
            
            {!discrepancyData.has_discrepancy && (afterDeliveryData.regular_tank_final > 0 || afterDeliveryData.plus_tank_final > 0 || afterDeliveryData.super_tank_final > 0) &&
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-green-800">All Measurements Verified</span>
                </div>
                <p className="text-green-700 text-sm">
                  Tank levels are within acceptable tolerance limits (±5 gallons).
                </p>
              </div>
            }
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Regular Gas</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Before + Delivered:</span>
                    <span>{discrepancyData.regular_expected.toFixed(2)} gal</span>
                  </div>
                  <div className="flex justify-between">
                    <span>After Delivery:</span>
                    <span>{afterDeliveryData.regular_tank_final.toFixed(2)} gal</span>
                  </div>
                  <div className={`flex justify-between font-medium ${
                  Math.abs(discrepancyData.regular_discrepancy) > 5 ? 'text-red-600' : 'text-green-600'}`
                  }>
                    <span>Difference:</span>
                    <span>{discrepancyData.regular_discrepancy >= 0 ? '+' : ''}{discrepancyData.regular_discrepancy.toFixed(2)} gal</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Plus Gas</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Before + Delivered:</span>
                    <span>{discrepancyData.plus_expected.toFixed(2)} gal</span>
                  </div>
                  <div className="flex justify-between">
                    <span>After Delivery:</span>
                    <span>{afterDeliveryData.plus_tank_final.toFixed(2)} gal</span>
                  </div>
                  <div className={`flex justify-between font-medium ${
                  Math.abs(discrepancyData.plus_discrepancy) > 5 ? 'text-red-600' : 'text-green-600'}`
                  }>
                    <span>Difference:</span>
                    <span>{discrepancyData.plus_discrepancy >= 0 ? '+' : ''}{discrepancyData.plus_discrepancy.toFixed(2)} gal</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Super Gas</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Before + Delivered:</span>
                    <span>{discrepancyData.super_expected.toFixed(2)} gal</span>
                  </div>
                  <div className="flex justify-between">
                    <span>After Delivery:</span>
                    <span>{afterDeliveryData.super_tank_final.toFixed(2)} gal</span>
                  </div>
                  <div className={`flex justify-between font-medium ${
                  Math.abs(discrepancyData.super_discrepancy) > 5 ? 'text-red-600' : 'text-green-600'}`
                  }>
                    <span>Difference:</span>
                    <span>{discrepancyData.super_discrepancy >= 0 ? '+' : ''}{discrepancyData.super_discrepancy.toFixed(2)} gal</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> Acceptable tolerance is ±5 gallons. Differences outside this range should be investigated and documented.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="delivery_notes">Delivery Notes</Label>
              <Textarea
                id="delivery_notes"
                value={formData.delivery_notes}
                onChange={(e) => handleInputChange('delivery_notes', e.target.value)}
                placeholder="Enter any additional notes about the delivery..."
                rows={3} />

            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/delivery')}>

            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Saving...' : 'Save Delivery Record'}
          </Button>
        </div>
      </form>
    </div>);

};

export default DeliveryForm;