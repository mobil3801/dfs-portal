import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Users, Building, Save, Plus, Calculator, Calendar, Clock, Info, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import {
  getCurrentPayPeriod,
  calculatePayDate,
  validatePayPeriod,
  formatDateForInput,
  generatePayPeriodOptions,
  adjustToPayPeriod,
  formatPayPeriod } from
'@/utils/payPeriodUtils';

interface SalaryRecord {
  id?: number;
  employee_id: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  pay_frequency: string;
  hourly_rate: number;
  regular_hours: number;
  assign_hours: number;
  overtime_hours: number;
  overtime_rate: number;
  overtime_pay: number;
  bonus_amount: number;
  commission: number;
  gross_pay: number;
  federal_tax: number;
  state_tax: number;
  social_security: number;
  medicare: number;
  health_insurance: number;
  retirement_401k: number;
  other_deductions: number;
  total_deductions: number;
  net_pay: number;
  station: string;
  status: string;
  notes: string;
  created_by: number;
}

interface Employee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  position: string;
  station: string;
  salary: number;
  is_active: boolean;
}

const SalaryList: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<{[key: string]: boolean;}>({});
  const { toast } = useToast();
  const { userProfile, isAdmin } = useAuth();

  const SALARY_TABLE_ID = '11788';
  const EMPLOYEES_TABLE_ID = '11727';

  // Station configurations
  const stations = [
  { id: 'MOBIL', name: 'MOBIL', color: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
  { id: 'AMOCO ROSEDALE', name: 'AMOCO (Rosedale)', color: 'bg-green-50 border-green-200 hover:bg-green-100' },
  { id: 'AMOCO BROOKLYN', name: 'AMOCO (Brooklyn)', color: 'bg-purple-50 border-purple-200 hover:bg-purple-100' },
  { id: 'MANAGER', name: 'Manager', color: 'bg-orange-50 border-orange-200 hover:bg-orange-100' }];


  // Form states for each station
  const [salaryForms, setSalaryForms] = useState<{[key: string]: SalaryRecord;}>({});
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

  const getDefaultFormData = (station: string): SalaryRecord => {
    const currentPayPeriod = getCurrentPayPeriod();
    return {
      employee_id: '',
      pay_period_start: formatDateForInput(currentPayPeriod.startDate),
      pay_period_end: formatDateForInput(currentPayPeriod.endDate),
      pay_date: formatDateForInput(currentPayPeriod.payDate),
      pay_frequency: 'Weekly',
      hourly_rate: 0,
      regular_hours: 0,
      assign_hours: 0,
      overtime_hours: 0,
      overtime_rate: 0,
      overtime_pay: 0,
      bonus_amount: 0,
      commission: 0,
      gross_pay: 0,
      federal_tax: 0,
      state_tax: 0,
      social_security: 0,
      medicare: 0,
      health_insurance: 0,
      retirement_401k: 0,
      other_deductions: 0,
      total_deductions: 0,
      net_pay: 0,
      station: station === 'MANAGER' ? '' : station,
      status: 'Pending',
      notes: '',
      created_by: userProfile?.id || 1
    };
  };

  useEffect(() => {
    fetchEmployees();
    initializeForms();
  }, []);

  const initializeForms = () => {
    const forms: {[key: string]: SalaryRecord;} = {};
    stations.forEach((station) => {
      forms[station.id] = getDefaultFormData(station.id);
    });
    setSalaryForms(forms);
  };

  const fetchEmployees = useCallback(async () => {
    try {
      console.log('🔄 Fetching employees data...');
      const { data, error } = await window.ezsite.apis.tablePage(EMPLOYEES_TABLE_ID, {
        PageNo: 1,
        PageSize: 1000,
        OrderByField: 'first_name',
        IsAsc: true,
        Filters: [{ name: 'is_active', op: 'Equal', value: true }]
      });

      if (error) throw error;

      const employeesList = data?.List || [];
      console.log('✅ Employees fetched successfully:', employeesList.length);
      setEmployees(employeesList);
    } catch (error) {
      console.error('❌ Error fetching employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch employee data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getEmployeesByStation = (stationId: string) => {
    if (stationId === 'MANAGER') {
      return employees.filter((emp) =>
      emp.station &&
      !['MOBIL', 'AMOCO ROSEDALE', 'AMOCO BROOKLYN'].includes(emp.station)
      );
    }
    return employees.filter((emp) => emp.station === stationId);
  };

  const handleFormChange = (stationId: string, field: keyof SalaryRecord, value: string | number) => {
    setSalaryForms((prev) => {
      const newForms = { ...prev };
      newForms[stationId] = { ...newForms[stationId], [field]: value };

      // Auto-calculate if it's a calculation field
      if (['hourly_rate', 'regular_hours', 'overtime_rate', 'overtime_hours', 'bonus_amount', 'commission', 'health_insurance', 'retirement_401k', 'other_deductions'].includes(field)) {
        const form = newForms[stationId];
        calculatePayroll(form, stationId, newForms);
      }

      return newForms;
    });
  };

  const handlePayPeriodSelection = (stationId: string, selectedStartDate: string) => {
    const adjustedPayPeriod = adjustToPayPeriod(selectedStartDate);
    setSalaryForms((prev) => ({
      ...prev,
      [stationId]: {
        ...prev[stationId],
        pay_period_start: formatDateForInput(adjustedPayPeriod.startDate),
        pay_period_end: formatDateForInput(adjustedPayPeriod.endDate),
        pay_date: formatDateForInput(adjustedPayPeriod.payDate)
      }
    }));
  };

  const handlePayPeriodStartChange = (stationId: string, startDate: string) => {
    const adjustedPayPeriod = adjustToPayPeriod(startDate);
    setSalaryForms((prev) => ({
      ...prev,
      [stationId]: {
        ...prev[stationId],
        pay_period_start: formatDateForInput(adjustedPayPeriod.startDate),
        pay_period_end: formatDateForInput(adjustedPayPeriod.endDate),
        pay_date: formatDateForInput(adjustedPayPeriod.payDate)
      }
    }));
  };

  const handlePayPeriodEndChange = (stationId: string, endDate: string) => {
    setSalaryForms((prev) => ({
      ...prev,
      [stationId]: {
        ...prev[stationId],
        pay_period_end: endDate,
        pay_date: formatDateForInput(calculatePayDate(endDate))
      }
    }));
  };

  const handleEmployeeChange = (stationId: string, employeeId: string) => {
    const employee = employees.find((emp) => emp.employee_id === employeeId);
    if (employee) {
      setSalaryForms((prev) => {
        const newForms = { ...prev };
        newForms[stationId] = {
          ...newForms[stationId],
          employee_id: employeeId,
          station: employee.station,
          hourly_rate: employee.salary || 0 // Use employee salary as hourly rate
        };

        // Recalculate with new hourly rate
        calculatePayroll(newForms[stationId], stationId, newForms);

        return newForms;
      });
    }
  };

  const calculatePayroll = (form: SalaryRecord, stationId: string, allForms: {[key: string]: SalaryRecord;}) => {
    // Calculate overtime pay: Over Rate × Overtime Hours = Over Time Pay
    const overtimePay = form.overtime_rate * form.overtime_hours;

    // Calculate gross pay: (Hourly Rate × Worked Hour) + Bonus + Commission + (Over Rate × Overtime Hours = Over Time Pay)
    const grossPay = form.hourly_rate * form.regular_hours + form.bonus_amount + form.commission + overtimePay;

    // Calculate net pay: Gross Pay − (Health Insurance + 401(K) + Other Deductions)
    const netPay = grossPay - (form.health_insurance + form.retirement_401k + form.other_deductions);

    allForms[stationId] = {
      ...form,
      overtime_pay: overtimePay,
      gross_pay: grossPay,
      net_pay: netPay
    };
  };

  const handleSubmit = async (stationId: string) => {
    const form = salaryForms[stationId];
    if (!form.employee_id) {
      toast({
        title: 'Error',
        description: 'Please select an employee',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting((prev) => ({ ...prev, [stationId]: true }));

    try {
      const submitData = {
        ...form,
        pay_period_start: new Date(form.pay_period_start).toISOString(),
        pay_period_end: new Date(form.pay_period_end).toISOString(),
        pay_date: new Date(form.pay_date).toISOString()
      };

      const { error } = await window.ezsite.apis.tableCreate(SALARY_TABLE_ID, submitData);
      if (error) throw error;

      toast({
        title: 'Success',
        description: `Salary record created successfully for ${stationId}`,
        variant: 'default'
      });

      // Reset form
      setSalaryForms((prev) => ({
        ...prev,
        [stationId]: getDefaultFormData(stationId)
      }));
    } catch (error) {
      console.error('Error creating salary record:', error);
      toast({
        title: 'Error',
        description: 'Failed to create salary record',
        variant: 'destructive'
      });
    } finally {
      setSubmitting((prev) => ({ ...prev, [stationId]: false }));
    }
  };

  const renderSalaryForm = (station: any) => {
    const stationEmployees = getEmployeesByStation(station.id);
    const form = salaryForms[station.id] || getDefaultFormData(station.id);
    const isSubmittingForm = submitting[station.id] || false;

    return (
      <Card key={station.id} className={`${station.color} border-2`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {station.name}
          </CardTitle>
          <CardDescription>
            Salary management for {station.name} station
            <Badge variant="outline" className="ml-2">
              {stationEmployees.length} employee{stationEmployees.length !== 1 ? 's' : ''}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stationEmployees.length === 0 ?
          <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No active employees found for this station</p>
            </div> :

          <>
              {/* Employee Selection */}
              <div className="space-y-2">
                <Label htmlFor={`employee-${station.id}`}>Employee *</Label>
                <Select
                value={form.employee_id}
                onValueChange={(value) => handleEmployeeChange(station.id, value)}>

                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {stationEmployees.map((employee) =>
                  <SelectItem key={employee.employee_id} value={employee.employee_id}>
                        {employee.first_name} {employee.last_name} ({employee.employee_id})
                      </SelectItem>
                  )}
                  </SelectContent>
                </Select>
              </div>

              {/* Pay Period Configuration */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Pay Period Configuration
                </Label>
                
                {/* Pay Period Quick Selection */}
                <div className="space-y-2">
                  <Label htmlFor={`pay-period-quick-${station.id}`}>Quick Select Pay Period</Label>
                  <Select onValueChange={(value) => handlePayPeriodSelection(station.id, value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a predefined pay period" />
                    </SelectTrigger>
                    <SelectContent>
                      {generatePayPeriodOptions().map((option) =>
                    <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                    )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Pay Period Dates */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`pay-start-${station.id}`}>Pay Period Start</Label>
                    <Input
                    id={`pay-start-${station.id}`}
                    type="date"
                    value={form.pay_period_start}
                    onChange={(e) => handlePayPeriodStartChange(station.id, e.target.value)} />
                    <div className="text-xs text-muted-foreground">
                      Must be a Sunday
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`pay-end-${station.id}`}>Pay Period End</Label>
                    <Input
                    id={`pay-end-${station.id}`}
                    type="date"
                    value={form.pay_period_end}
                    onChange={(e) => handlePayPeriodEndChange(station.id, e.target.value)} />
                    <div className="text-xs text-muted-foreground">
                      Must be a Saturday
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`pay-date-${station.id}`}>Pay Date</Label>
                    <Input
                    id={`pay-date-${station.id}`}
                    type="date"
                    value={form.pay_date}
                    onChange={(e) => handleFormChange(station.id, 'pay_date', e.target.value)}
                    className="bg-muted" />
                    <div className="text-xs text-muted-foreground">
                      Auto-calculated: Following Sunday
                    </div>
                  </div>
                </div>

                {/* Pay Period Validation */}
                {(() => {
                const validation = validatePayPeriod(form.pay_period_start, form.pay_period_end);
                return !validation.isValid && validation.errors.length > 0 &&
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                      <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-2">
                        <Info className="h-4 w-4" />
                        Pay Period Issues:
                      </div>
                      <ul className="text-amber-600 text-sm space-y-1">
                        {validation.errors.map((error, index) =>
                    <li key={index}>• {error}</li>
                    )}
                      </ul>
                    </div>;

              })()}

                {/* Pay Frequency */}
                <div className="space-y-2">
                  <Label htmlFor={`frequency-${station.id}`}>Pay Frequency</Label>
                  <Select
                  value={form.pay_frequency}
                  onValueChange={(value) => handleFormChange(station.id, 'pay_frequency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Weekly">Weekly (Sunday to Saturday)</SelectItem>
                      <SelectItem value="Biweekly">Biweekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Semi-monthly">Semi-monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Earnings */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Earnings
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`hourly-rate-${station.id}`}>Hourly Rate</Label>
                    <NumberInput
                    id={`hourly-rate-${station.id}`}
                    step="0.01"
                    value={form.hourly_rate}
                    onChange={(value) => handleFormChange(station.id, 'hourly_rate', value)} />

                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`regular-hours-${station.id}`}>Worked Hour</Label>
                    <NumberInput
                    id={`regular-hours-${station.id}`}
                    step="0.01"
                    value={form.regular_hours}
                    onChange={(value) => handleFormChange(station.id, 'regular_hours', value)} />

                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`assign-hours-${station.id}`}>Assign Hours</Label>
                    <NumberInput
                    id={`assign-hours-${station.id}`}
                    step="0.01"
                    value={form.assign_hours}
                    onChange={(value) => handleFormChange(station.id, 'assign_hours', value)} />

                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`overtime-hours-${station.id}`}>Overtime Hours</Label>
                    <NumberInput
                    id={`overtime-hours-${station.id}`}
                    step="0.01"
                    value={form.overtime_hours}
                    onChange={(value) => handleFormChange(station.id, 'overtime_hours', value)} />

                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`bonus-${station.id}`}>Bonus</Label>
                    <NumberInput
                    id={`bonus-${station.id}`}
                    step="0.01"
                    value={form.bonus_amount}
                    onChange={(value) => handleFormChange(station.id, 'bonus_amount', value)} />

                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`commission-${station.id}`}>Commission</Label>
                    <NumberInput
                    id={`commission-${station.id}`}
                    step="0.01"
                    value={form.commission}
                    onChange={(value) => handleFormChange(station.id, 'commission', value)} />

                  </div>
                </div>
              </div>

              {/* Calculated Values */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Calculated Values
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`overtime-rate-${station.id}`}>Overtime Rate</Label>
                    <NumberInput
                    id={`overtime-rate-${station.id}`}
                    step="0.01"
                    value={form.overtime_rate}
                    onChange={(value) => handleFormChange(station.id, 'overtime_rate', value)} />

                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`overtime-pay-${station.id}`}>Overtime Pay</Label>
                    <NumberInput
                    id={`overtime-pay-${station.id}`}
                    step="0.01"
                    value={form.overtime_pay}
                    onChange={(value) => handleFormChange(station.id, 'overtime_pay', value)} />

                  </div>
                  <div className="space-y-2">
                    <Label>Gross Pay</Label>
                    <div className="p-2 bg-green-50 border border-green-200 rounded-md text-sm font-semibold text-green-700">
                      ${form.gross_pay.toFixed(2)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Net Pay</Label>
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-md text-sm font-semibold text-blue-700">
                      ${form.net_pay.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Deductions */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Additional Deductions</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`health-insurance-${station.id}`}>Health Insurance</Label>
                    <NumberInput
                    id={`health-insurance-${station.id}`}
                    step="0.01"
                    value={form.health_insurance}
                    onChange={(value) => handleFormChange(station.id, 'health_insurance', value)} />

                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`retirement-${station.id}`}>401(k)</Label>
                    <NumberInput
                    id={`retirement-${station.id}`}
                    step="0.01"
                    value={form.retirement_401k}
                    onChange={(value) => handleFormChange(station.id, 'retirement_401k', value)} />

                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`other-deductions-${station.id}`}>Other Deductions</Label>
                    <NumberInput
                    id={`other-deductions-${station.id}`}
                    step="0.01"
                    value={form.other_deductions}
                    onChange={(value) => handleFormChange(station.id, 'other_deductions', value)} />

                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor={`notes-${station.id}`}>Notes</Label>
                <Textarea
                id={`notes-${station.id}`}
                value={form.notes}
                onChange={(e) => handleFormChange(station.id, 'notes', e.target.value)}
                placeholder="Additional notes about this salary record..."
                rows={3} />

              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button
                onClick={() => handleSubmit(station.id)}
                disabled={isSubmittingForm || !form.employee_id}
                className="w-full">

                  {isSubmittingForm ?
                <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </> :

                <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Salary Record
                    </>
                }
                </Button>
              </div>
            </>
          }
        </CardContent>
      </Card>);

  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>);

  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">Station-Based Salary Management</h1>
        <p className="text-muted-foreground mt-2">
          Select a station below to manage salary records
        </p>
      </div>

      {/* Pay Period Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Current Pay Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-muted-foreground">Pay Period</div>
                <div className="font-semibold">{formatPayPeriod(getCurrentPayPeriod())}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Pay Date</div>
                <div className="font-semibold text-green-700">
                  {format(getCurrentPayPeriod().payDate, 'MMM dd, yyyy')}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Frequency</div>
                <div className="font-semibold">Weekly (Sunday to Saturday)</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedStation ?
      <>
          {/* Station Selection Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stations.map((station) => {
            const stationEmployees = getEmployeesByStation(station.id);
            return (
              <Card
                key={station.id}
                className={`${station.color} border-2 cursor-pointer transition-all duration-200 transform hover:scale-105`}
                onClick={() => setSelectedStation(station.id)}>

                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      <Building className="h-12 w-12 text-gray-600" />
                    </div>
                    <CardTitle className="text-xl font-bold">{station.name}</CardTitle>
                    <CardDescription className="text-sm">
                      Click to manage salary records
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center pt-0">
                    <Badge variant="outline" className="text-lg px-4 py-2">
                      {stationEmployees.length} employee{stationEmployees.length !== 1 ? 's' : ''}
                    </Badge>
                    <div className="mt-4 text-sm text-muted-foreground">
                      Tap to access salary forms
                    </div>
                  </CardContent>
                </Card>);

          })}
          </div>
        </> :

      <>
          {/* Back Button and Selected Station Form */}
          <div className="flex items-center gap-4 mb-6">
            <Button
            variant="outline"
            onClick={() => setSelectedStation(null)}
            className="flex items-center gap-2">

              <ArrowLeft className="h-4 w-4" />
              Back to Station Selection
            </Button>
            <div>
              <h2 className="text-2xl font-bold">
                {stations.find((s) => s.id === selectedStation)?.name} - Salary Management
              </h2>
              <p className="text-muted-foreground">
                Fill out the salary form for employees at this station
              </p>
            </div>
          </div>
          
          {/* Selected Station Salary Form */}
          {renderSalaryForm(stations.find((s) => s.id === selectedStation)!)}
        </>
      }
    </div>);


};

export default SalaryList;