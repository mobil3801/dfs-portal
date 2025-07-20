import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Save,
  TrendingUp,
  FileEdit,
  Clock,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Folder,
  RefreshCw,
  Printer } from
'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import StationSelector from '@/components/StationSelector';
import GasGrocerySalesSection from '@/components/SalesReportSections/GasGrocerySalesSection';
import LotterySalesSection from '@/components/SalesReportSections/LotterySalesSection';
import GasTankReportSection from '@/components/SalesReportSections/GasTankReportSection';
import ExpensesSection from '@/components/SalesReportSections/ExpensesSection';
import DocumentsUploadSection from '@/components/SalesReportSections/DocumentsUploadSection';
import CashCollectionSection from '@/components/SalesReportSections/CashCollectionSection';
import DraftManagementDialog from '@/components/DraftManagementDialog';
import DraftSavingService from '@/utils/draftSaving';
import EnhancedSalesReportPrintDialog from '@/components/EnhancedSalesReportPrintDialog';

export default function SalesReportForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditing = !!id;

  const [selectedStation, setSelectedStation] = useState('');
  const [employees, setEmployees] = useState<Array<{id: number;first_name: string;last_name: string;employee_id: string;}>>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [cashExpenses, setCashExpenses] = useState(0);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [draftInfo, setDraftInfo] = useState<{
    savedAt: Date;
    expiresAt: Date;
    timeRemainingHours: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentReport, setCurrentReport] = useState<any>(null);

  const [formData, setFormData] = useState({
    report_date: new Date().toISOString().split('T')[0],
    station: '',
    shift: 'DAY',
    employee_name: '',
    employee_id: '',
    // Cash Collection
    cashCollectionOnHand: 0,
    // Gas & Grocery Sales - Manual Entry
    creditCardAmount: 0,
    debitCardAmount: 0,
    mobileAmount: 0,
    cashAmount: 0,
    grocerySales: 0,
    ebtSales: 0, // MOBIL only
    // Grocery Sales Breakdown - Manual Entry
    groceryCashSales: 0,
    groceryCardSales: 0,
    // Lottery - Manual Entry
    lotteryNetSales: 0,
    scratchOffSales: 0,
    // Gas Tank Report - Manual Entry
    regularGallons: 0,
    superGallons: 0,
    dieselGallons: 0,
    // Documents
    dayReportFileId: undefined as number | undefined,
    veederRootFileId: undefined as number | undefined,
    lottoReportFileId: undefined as number | undefined,
    scratchOffReportFileId: undefined as number | undefined,
    // Notes
    notes: ''
  });

  useEffect(() => {
    if (selectedStation) {
      setFormData((prev) => ({ ...prev, station: selectedStation }));
      loadEmployees(selectedStation);
      if (!isEditing) {
        checkForExistingDraft();
      }
    }
  }, [selectedStation, isEditing]);

  useEffect(() => {
    if (isEditing && id) {
      loadExistingReport();
    }
  }, [isEditing, id]);

  // Check for existing draft when form data changes (only for new reports)
  useEffect(() => {
    if (selectedStation && formData.report_date && !isEditing) {
      checkForExistingDraft();
    }
  }, [selectedStation, formData.report_date, isEditing]);

  // Auto-calculations with proper synchronization
  const totalSales = useMemo(() => {
    return formData.creditCardAmount + formData.debitCardAmount + formData.mobileAmount + formData.cashAmount + formData.grocerySales;
  }, [formData.creditCardAmount, formData.debitCardAmount, formData.mobileAmount, formData.cashAmount, formData.grocerySales]);

  const totalGallons = useMemo(() => {
    return formData.regularGallons + formData.superGallons + formData.dieselGallons;
  }, [formData.regularGallons, formData.superGallons, formData.dieselGallons]);

  const totalLotteryCash = useMemo(() => {
    return formData.lotteryNetSales + formData.scratchOffSales;
  }, [formData.lotteryNetSales, formData.scratchOffSales]);

  const totalGrocerySales = useMemo(() => {
    return formData.groceryCashSales + formData.groceryCardSales + formData.ebtSales;
  }, [formData.groceryCashSales, formData.groceryCardSales, formData.ebtSales]);

  // Expected cash from sales calculation
  const expectedCashFromSales = useMemo(() => {
    return formData.cashAmount + formData.groceryCashSales + totalLotteryCash;
  }, [formData.cashAmount, formData.groceryCashSales, totalLotteryCash]);

  // Final Short/Over calculation: Cash Collection - (Expected Cash - Cash Expenses)
  const totalShortOver = useMemo(() => {
    return formData.cashCollectionOnHand - (expectedCashFromSales - cashExpenses);
  }, [formData.cashCollectionOnHand, expectedCashFromSales, cashExpenses]);

  const checkForExistingDraft = () => {
    if (selectedStation && formData.report_date && !isEditing) {
      const info = DraftSavingService.getDraftInfo(selectedStation, formData.report_date);
      setDraftInfo(info);
    }
  };

  const loadExistingReport = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const { data, error } = await window.ezsite.apis.tablePage(12356, {
        PageNo: 1,
        PageSize: 1,
        Filters: [{ name: 'id', op: 'Equal', value: parseInt(id) }]
      });

      if (error) {
        throw new Error(error);
      }

      if (data?.List && data.List.length > 0) {
        const report = data.List[0];
        setCurrentReport(report);

        // Set station first, which will trigger employee loading
        setSelectedStation(report.station);

        // Helper function to safely parse numeric values
        const parseNumeric = (value: any) => {
          if (value === null || value === undefined || value === '') return 0;
          const num = parseFloat(value);
          return isNaN(num) ? 0 : num;
        };

        // Helper function to safely parse date strings
        const parseDate = (dateString: any) => {
          if (!dateString) return new Date().toISOString().split('T')[0];
          return new Date(dateString).toISOString().split('T')[0];
        };

        // Parse expenses data if it exists
        let expensesData = { total_expenses: 0, cash_expenses: 0 };
        let groceryBreakdown = { groceryCashSales: 0, groceryCardSales: 0 };

        if (report.expenses_data) {
          try {
            expensesData = JSON.parse(report.expenses_data);

            // Parse grocery breakdown data from expenses_data
            if (expensesData.grocery_breakdown) {
              groceryBreakdown = expensesData.grocery_breakdown;
            }
          } catch (e) {
            console.warn('Failed to parse expenses data:', e);
          }
        }

        // Update form data with all fields from the report
        setFormData({
          report_date: parseDate(report.report_date),
          station: report.station || '',
          shift: report.shift || 'DAY',
          employee_name: report.employee_name || '',
          employee_id: report.employee_id || '',
          cashCollectionOnHand: parseNumeric(report.cash_collection_on_hand),
          creditCardAmount: parseNumeric(report.credit_card_amount),
          debitCardAmount: parseNumeric(report.debit_card_amount),
          mobileAmount: parseNumeric(report.mobile_amount),
          cashAmount: parseNumeric(report.cash_amount),
          grocerySales: parseNumeric(report.grocery_sales),
          ebtSales: parseNumeric(report.ebt_sales),
          groceryCashSales: parseNumeric(groceryBreakdown.groceryCashSales),
          groceryCardSales: parseNumeric(groceryBreakdown.groceryCardSales),
          lotteryNetSales: parseNumeric(report.lottery_net_sales),
          scratchOffSales: parseNumeric(report.scratch_off_sales),
          regularGallons: parseNumeric(report.regular_gallons),
          superGallons: parseNumeric(report.super_gallons),
          dieselGallons: parseNumeric(report.diesel_gallons),
          dayReportFileId: report.day_report_file_id || undefined,
          veederRootFileId: report.veeder_root_file_id || undefined,
          lottoReportFileId: report.lotto_report_file_id || undefined,
          scratchOffReportFileId: report.scratch_off_report_file_id || undefined,
          notes: report.notes || ''
        });

        // Set expenses data
        setTotalExpenses(parseNumeric(expensesData.total_expenses));
        setCashExpenses(parseNumeric(expensesData.cash_expenses));

        toast({
          title: 'Report Loaded',
          description: 'Existing report data has been loaded successfully.'
        });
      } else {
        toast({
          title: 'Report Not Found',
          description: 'The requested report could not be found.',
          variant: 'destructive'
        });
        navigate('/sales-reports');
      }
    } catch (error) {
      console.error('Error loading report:', error);
      toast({
        title: 'Error Loading Report',
        description: error instanceof Error ? error.message : 'Failed to load existing report',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployees = async (station: string) => {
    setIsLoadingEmployees(true);
    try {
      const { data, error } = await window.ezsite.apis.tablePage(11727, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: 'first_name',
        IsAsc: true,
        Filters: [
        { name: 'station', op: 'Equal', value: station },
        { name: 'is_active', op: 'Equal', value: true }]

      });

      if (error) throw new Error(error);
      setEmployees(data?.List || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employees',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const handleSaveAsDraft = () => {
    try {
      if (!selectedStation || !formData.report_date) {
        toast({
          title: 'Cannot Save Draft',
          description: 'Please select a station and report date first',
          variant: 'destructive'
        });
        return;
      }

      const success = DraftSavingService.saveDraft(selectedStation, formData.report_date, {
        ...formData,
        totalExpenses,
        cashExpenses,
        calculatedValues: {
          totalSales,
          totalGallons,
          totalLotteryCash,
          totalGrocerySales,
          expectedCashFromSales,
          totalShortOver
        }
      });

      if (success) {
        toast({
          title: 'Draft Saved',
          description: `Form data saved for ${selectedStation} on ${formData.report_date}. Will expire in 12 hours.`
        });
        checkForExistingDraft();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save draft',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: 'Error',
        description: 'Failed to save draft',
        variant: 'destructive'
      });
    }
  };

  const handleLoadDraft = (draftData: any, station: string, reportDate: string) => {
    try {
      setSelectedStation(station);
      setFormData({
        ...draftData,
        station
      });

      if (draftData.totalExpenses) setTotalExpenses(draftData.totalExpenses);
      if (draftData.cashExpenses) setCashExpenses(draftData.cashExpenses);

      // Delete the draft after loading
      DraftSavingService.deleteDraft(station, reportDate);
      setDraftInfo(null);
    } catch (error) {
      console.error('Error loading draft:', error);
      toast({
        title: 'Error',
        description: 'Failed to load draft data',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      report_date: new Date().toISOString().split('T')[0],
      station: selectedStation,
      shift: 'DAY',
      employee_name: '',
      employee_id: '',
      cashCollectionOnHand: 0,
      creditCardAmount: 0,
      debitCardAmount: 0,
      mobileAmount: 0,
      cashAmount: 0,
      grocerySales: 0,
      ebtSales: 0,
      groceryCashSales: 0,
      groceryCardSales: 0,
      lotteryNetSales: 0,
      scratchOffSales: 0,
      regularGallons: 0,
      superGallons: 0,
      dieselGallons: 0,
      dayReportFileId: undefined,
      veederRootFileId: undefined,
      lottoReportFileId: undefined,
      scratchOffReportFileId: undefined,
      notes: ''
    });
    setTotalExpenses(0);
    setCashExpenses(0);
    setDraftInfo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.station || !formData.report_date || !formData.employee_name) {
        toast({
          title: 'Missing Required Fields',
          description: 'Please fill in all required fields: Station, Report Date, and Employee Name.',
          variant: 'destructive'
        });
        return;
      }

      // Validate required documents (only for new reports)
      if (!isEditing) {
        const requiredDocs = ['dayReportFileId', 'veederRootFileId', 'lottoReportFileId', 'scratchOffReportFileId'];
        const missingDocs = requiredDocs.filter((doc) => !formData[doc as keyof typeof formData]);

        if (missingDocs.length > 0) {
          toast({
            title: 'Missing Documents',
            description: 'Please upload all required documents before submitting.',
            variant: 'destructive'
          });
          return;
        }
      }

      // Ensure all numeric values are properly parsed and rounded to 2 decimal places
      const parseAndRound = (value: number | string) => {
        const num = parseFloat(String(value)) || 0;
        return Math.round(num * 100) / 100;
      };

      const submitData = {
        report_date: formData.report_date,
        station: formData.station,
        shift: formData.shift,
        employee_name: formData.employee_name,
        employee_id: formData.employee_id,
        cash_collection_on_hand: parseAndRound(formData.cashCollectionOnHand),
        total_short_over: parseAndRound(totalShortOver),
        credit_card_amount: parseAndRound(formData.creditCardAmount),
        debit_card_amount: parseAndRound(formData.debitCardAmount),
        mobile_amount: parseAndRound(formData.mobileAmount),
        cash_amount: parseAndRound(formData.cashAmount),
        grocery_sales: parseAndRound(formData.grocerySales),
        ebt_sales: parseAndRound(formData.ebtSales),
        lottery_net_sales: parseAndRound(formData.lotteryNetSales),
        scratch_off_sales: parseAndRound(formData.scratchOffSales),
        lottery_total_cash: parseAndRound(totalLotteryCash),
        regular_gallons: parseAndRound(formData.regularGallons),
        super_gallons: parseAndRound(formData.superGallons),
        diesel_gallons: parseAndRound(formData.dieselGallons),
        total_gallons: parseAndRound(totalGallons),
        expenses_data: JSON.stringify({
          total_expenses: parseAndRound(totalExpenses),
          cash_expenses: parseAndRound(cashExpenses),
          grocery_breakdown: {
            groceryCashSales: parseAndRound(formData.groceryCashSales),
            groceryCardSales: parseAndRound(formData.groceryCardSales)
          }
        }),
        day_report_file_id: formData.dayReportFileId || null,
        veeder_root_file_id: formData.veederRootFileId || null,
        lotto_report_file_id: formData.lottoReportFileId || null,
        scratch_off_report_file_id: formData.scratchOffReportFileId || null,
        total_sales: parseAndRound(totalSales),
        notes: formData.notes || '',
        created_by: user?.ID || 0
      };

      let result;
      if (isEditing) {
        // Include ID for update
        result = await window.ezsite.apis.tableUpdate(12356, {
          ...submitData,
          id: parseInt(id!)
        });
      } else {
        result = await window.ezsite.apis.tableCreate(12356, submitData);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: isEditing ? 'Report Updated' : 'Report Created',
        description: `Sales report has been ${isEditing ? 'updated' : 'created'} successfully.`
      });

      // Delete any existing draft after successful submission
      if (selectedStation && formData.report_date && !isEditing) {
        DraftSavingService.deleteDraft(selectedStation, formData.report_date);
      }

      // Set current report for printing
      setCurrentReport({
        ...submitData,
        id: parseInt(id!) || result.data?.id || 0,
        created_by: user?.ID || 0
      });

      // For edit mode, reload the updated data
      if (isEditing) {
        loadExistingReport();
      } else {
        // Reset form after successful submission for new reports
        resetForm();
        toast({
          title: 'Form Reset',
          description: 'Form has been reset for new entry'
        });
      }

    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save report',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    if (!currentReport) {
      toast({
        title: 'No Report to Print',
        description: 'Please save the report first before printing',
        variant: 'destructive'
      });
      return;
    }
    setShowPrintDialog(true);
  };

  const updateFormData = (field: string, value: any) => {
    // Ensure numeric values are properly handled
    let processedValue = value;
    if (typeof value === 'string' && !isNaN(parseFloat(value))) {
      processedValue = parseFloat(value);
    } else if (typeof value === 'number') {
      processedValue = value;
    }

    setFormData((prev) => {
      const newData = { ...prev, [field]: processedValue };

      // If updating grocery breakdown fields, also update the total grocery sales
      if (field === 'groceryCashSales' || field === 'groceryCardSales' || field === 'ebtSales') {
        const groceryCashSales = field === 'groceryCashSales' ? processedValue : prev.groceryCashSales || 0;
        const groceryCardSales = field === 'groceryCardSales' ? processedValue : prev.groceryCardSales || 0;
        const ebtSales = field === 'ebtSales' ? processedValue : prev.ebtSales || 0;

        newData.grocerySales = groceryCashSales + groceryCardSales + ebtSales;
      }

      return newData;
    });
  };

  const handleDocumentUpload = (field: string, fileId: number) => {
    setFormData((prev) => ({ ...prev, [field]: fileId }));
  };

  const handleExpensesChange = (totalExpenses: number, cashExpenses: number = 0) => {
    setTotalExpenses(totalExpenses);
    setCashExpenses(cashExpenses);
  };

  const validEmployees = employees.filter((employee) => employee.employee_id && employee.employee_id.trim() !== '');

  // Show loading state during data loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading report data...</p>
            </div>
          </div>
        </div>
      </div>);

  }

  // If no station selected, show station selector
  if (!selectedStation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Reports
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit' : 'Create'} Daily Sales Report
            </h1>
            <p className="text-gray-600 mt-2">Step 1: Select your station to begin</p>
          </div>
          <StationSelector onStationSelect={setSelectedStation} />
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/sales-reports')}
            className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit' : 'Create'} Daily Sales Report
            </h1>
            <p className="text-gray-600 mt-2">
              Station: <span className="font-semibold">{selectedStation}</span>
            </p>
          </div>
        </div>

        {/* Draft Info Alert */}
        {draftInfo && !isEditing &&
        <Alert className="mb-6 border-amber-200 bg-amber-50">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <div className="flex items-center justify-between">
                <span>
                  You have a saved draft from {draftInfo.savedAt.toLocaleString()}. 
                  Expires in {Math.floor(draftInfo.timeRemainingHours)} hours.
                </span>
                <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDraftDialog(true)}
                className="ml-4 text-amber-800 border-amber-300 hover:bg-amber-100">

                  <Folder className="w-3 h-3 mr-1" />
                  Manage Drafts
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        }

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="report_date">Report Date *</Label>
                  <Input
                    type="date"
                    id="report_date"
                    value={formData.report_date}
                    onChange={(e) => updateFormData('report_date', e.target.value)}
                    required />
                </div>
                <div className="space-y-2">
                  <Label>Station</Label>
                  <div className="h-9 px-3 py-2 border border-gray-200 rounded-md bg-gray-100 flex items-center">
                    <span className="text-gray-700 font-medium">{selectedStation}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shift">Shift *</Label>
                  <Select
                    value={formData.shift}
                    onValueChange={(value) => updateFormData('shift', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAY">DAY</SelectItem>
                      <SelectItem value="NIGHT">NIGHT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee">Employee Name *</Label>
                  <Select
                    value={formData.employee_id}
                    onValueChange={(value) => {
                      const selectedEmployee = validEmployees.find((emp) => emp.employee_id === value);
                      if (selectedEmployee) {
                        updateFormData('employee_id', value);
                        updateFormData('employee_name', `${selectedEmployee.first_name} ${selectedEmployee.last_name}`);
                      }
                    }}
                    disabled={isLoadingEmployees}>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingEmployees ? "Loading employees..." : "Select employee"} />
                    </SelectTrigger>
                    <SelectContent>
                      {validEmployees.length === 0 && !isLoadingEmployees &&
                      <div className="p-2 text-center text-gray-500">
                          No active employees found for {selectedStation}
                        </div>
                      }
                      {validEmployees.map((employee) =>
                      <SelectItem key={employee.id} value={employee.employee_id}>
                          {employee.first_name} {employee.last_name} (ID: {employee.employee_id})
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cash Collection with Enhanced Calculation Display */}
          <CashCollectionSection
            values={{
              cashCollectionOnHand: formData.cashCollectionOnHand,
              totalCashFromSales: expectedCashFromSales,
              totalCashFromExpenses: cashExpenses,
              totalShortOver: totalShortOver
            }}
            onChange={updateFormData} />

          {/* Enhanced Short/Over Calculation Display */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Total (+/-) Short/Over Calculation
              </CardTitle>
              <CardDescription className="text-green-700">
                User Requirements: Gas Cash + Grocery Cash + Lottery Cash - Cash Expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="text-sm text-green-600 mb-1">Gas & Grocery Cash</div>
                  <div className="text-2xl font-bold text-green-800">${formData.cashAmount.toFixed(2)}</div>
                  <div className="text-xs text-gray-500 mt-1">From Gas & Grocery Section</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="text-sm text-green-600 mb-1">Grocery Breakdown Cash</div>
                  <div className="text-2xl font-bold text-green-800">${formData.groceryCashSales.toFixed(2)}</div>
                  <div className="text-xs text-gray-500 mt-1">From Grocery Breakdown</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="text-sm text-green-600 mb-1">NY Lottery Total Cash</div>
                  <div className="text-2xl font-bold text-green-800">${totalLotteryCash.toFixed(2)}</div>
                  <div className="text-xs text-gray-500 mt-1">Net Sales + Scratch Off</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-red-200">
                  <div className="text-sm text-red-600 mb-1">Cash Expenses</div>
                  <div className="text-2xl font-bold text-red-600">-${cashExpenses.toFixed(2)}</div>
                  <div className="text-xs text-gray-500 mt-1">Subtracted from total</div>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-white rounded-lg border-2 border-green-300">
                <div className="text-sm text-green-600 mb-1">Expected Cash from Sales</div>
                <div className="text-3xl font-bold text-green-800">${expectedCashFromSales.toFixed(2)}</div>
                <div className="text-xs text-green-600 mt-1">
                  Formula: ${formData.cashAmount.toFixed(2)} + ${formData.groceryCashSales.toFixed(2)} + ${totalLotteryCash.toFixed(2)}
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                <div className="text-sm text-blue-600 mb-1">Final Short/Over Calculation</div>
                <div className={`text-3xl font-bold ${totalShortOver >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  {totalShortOver >= 0 ? '+' : ''}${totalShortOver.toFixed(2)}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Cash Collection (${formData.cashCollectionOnHand.toFixed(2)}) - (Expected Cash - Cash Expenses) = {totalShortOver >= 0 ? 'Over' : 'Short'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gas & Grocery Sales */}
          <GasGrocerySalesSection
            station={selectedStation}
            values={{
              creditCardAmount: formData.creditCardAmount,
              debitCardAmount: formData.debitCardAmount,
              mobileAmount: formData.mobileAmount,
              cashAmount: formData.cashAmount,
              grocerySales: formData.grocerySales,
              ebtSales: formData.ebtSales,
              groceryCashSales: formData.groceryCashSales,
              groceryCardSales: formData.groceryCardSales
            }}
            onChange={updateFormData} />

          {/* NY Lottery Sales */}
          <LotterySalesSection
            values={{
              lotteryNetSales: formData.lotteryNetSales,
              scratchOffSales: formData.scratchOffSales
            }}
            onChange={updateFormData} />

          {/* Gas Tank Report */}
          <GasTankReportSection
            values={{
              regularGallons: formData.regularGallons,
              superGallons: formData.superGallons,
              dieselGallons: formData.dieselGallons
            }}
            onChange={updateFormData} />

          {/* Expenses Section */}
          <ExpensesSection
            station={selectedStation}
            reportDate={formData.report_date}
            onExpensesChange={handleExpensesChange} />

          {/* Documents Upload */}
          <DocumentsUploadSection
            documents={{
              dayReportFileId: formData.dayReportFileId,
              veederRootFileId: formData.veederRootFileId,
              lottoReportFileId: formData.lottoReportFileId,
              scratchOffReportFileId: formData.scratchOffReportFileId
            }}
            onChange={handleDocumentUpload} />

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateFormData('notes', e.target.value)}
                  placeholder="Enter any additional notes about the day's operations..."
                  rows={4} />
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">Report Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-800">${totalSales.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Total Sales</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-800">{totalGallons.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Total Gallons</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-800">${totalLotteryCash.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Lottery Sales</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-800">${totalGrocerySales.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Grocery Sales</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-800">${totalExpenses.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Total Expenses</div>
                </div>
              </div>
              
              {/* Additional Short/Over Summary */}
              <div className="mt-6 pt-4 border-t border-blue-200">
                <div className="text-center">
                  <div className="text-sm text-blue-600 mb-1">Total (+/-) Short/Over</div>
                  <div className={`text-4xl font-bold ${totalShortOver >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                    {totalShortOver >= 0 ? '+' : ''}${totalShortOver.toFixed(2)}
                  </div>
                  <Badge variant={totalShortOver >= 0 ? 'default' : 'destructive'} className="mt-2">
                    {totalShortOver >= 0 ? 'Over' : 'Short'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex items-center justify-between pt-6">
            <div className="flex items-center space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/sales-reports')}>
                Cancel
              </Button>
              
              {!isEditing &&
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDraftDialog(true)}
                className="gap-2">
                  <Folder className="w-4 h-4" />
                  Manage Drafts
                </Button>
              }
              
              {/* Print Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handlePrint}
                disabled={!currentReport}
                className="gap-2">
                <Printer className="w-4 h-4" />
                Print Report
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              {!isEditing &&
              <Button
                type="button"
                variant="secondary"
                onClick={handleSaveAsDraft}
                className="gap-2">
                  <FileEdit className="w-4 h-4" />
                  Save as Draft
                </Button>
              }
              
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 gap-2"
                disabled={isSubmitting}>
                {isSubmitting ?
                <RefreshCw className="w-4 h-4 animate-spin" /> :

                <Save className="w-4 h-4" />
                }
                {isEditing ? 'Update' : 'Create'} Report
              </Button>
            </div>
          </div>
        </form>

        {/* Draft Management Dialog */}
        <DraftManagementDialog
          open={showDraftDialog}
          onClose={() => setShowDraftDialog(false)}
          onLoadDraft={handleLoadDraft}
          currentStation={selectedStation}
          currentReportDate={formData.report_date} />

        {/* Print Dialog */}
        <EnhancedSalesReportPrintDialog
          open={showPrintDialog}
          onOpenChange={setShowPrintDialog}
          report={currentReport} />

      </div>
    </div>);

}