import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Plus, DollarSign, FileText, Trash2, Calendar, User, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import ExpenseFormDialog from '@/components/ExpenseFormDialog';

interface ExpenseRecord {
  id: number;
  vendor_name: string;
  others_name: string;
  amount: number;
  payment_type: 'Cash' | 'Credit' | 'Cheque';
  cheque_number: string;
  invoice_file_id?: number;
  station: string;
  expense_date: string;
  created_by: number;
}

interface ExpenseFormData {
  vendor: string;
  othersName: string;
  amount: number;
  paymentType: 'Cash' | 'Credit' | 'Cheque';
  chequeNumber: string;
  invoiceFileId?: number;
  invoiceFileName?: string;
}

interface ExpensesSectionProps {
  station: string;
  reportDate: string;
  onExpensesChange?: (totalExpenses: number, cashExpenses: number) => void;
}

const ExpensesSection: React.FC<ExpensesSectionProps> = ({
  station = "MOBIL",
  reportDate,
  onExpensesChange
}) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Load expenses for current station and date
  useEffect(() => {
    if (reportDate) {
      loadExpenses();
    }
  }, [station, reportDate]);

  // Calculate totals whenever expenses change
  useEffect(() => {
    const totals = calculateTotals();
    onExpensesChange?.(totals.totalExpenses, totals.cashExpense);
  }, [expenses, onExpensesChange]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const { data, error } = await window.ezsite.apis.tablePage(18494, {
        PageNo: 1,
        PageSize: 100,
        OrderByField: "expense_date",
        IsAsc: false,
        Filters: [
        {
          name: "station",
          op: "Equal",
          value: station
        },
        {
          name: "expense_date",
          op: "StringStartsWith",
          value: reportDate?.split('T')[0] || new Date().toISOString().split('T')[0]
        }]

      });

      if (error) throw error;
      setExpenses(data?.List || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast({
        title: "Error",
        description: "Failed to load expenses",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (formData: ExpenseFormData) => {
    try {
      setLoading(true);

      const expenseData = {
        vendor_name: formData.vendor || '',
        others_name: formData.othersName,
        amount: formData.amount,
        payment_type: formData.paymentType,
        cheque_number: formData.chequeNumber || '',
        invoice_file_id: formData.invoiceFileId || 0,
        station: station,
        expense_date: reportDate || new Date().toISOString(),
        created_by: 1 // TODO: Get from auth context
      };

      const { error } = await window.ezsite.apis.tableCreate(18494, expenseData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Expense added successfully"
      });

      // Reload expenses
      loadExpenses();

    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (expenseId: number) => {
    try {
      setLoading(true);

      const { error } = await window.ezsite.apis.tableDelete(18494, { ID: expenseId });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Expense deleted successfully"
      });

      // Reload expenses
      loadExpenses();

    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals by payment type
  const calculateTotals = () => {
    const cashExpense = expenses.
    filter((exp) => exp.payment_type === 'Cash').
    reduce((sum, exp) => sum + (exp.amount || 0), 0);

    const cardExpense = expenses.
    filter((exp) => exp.payment_type === 'Credit').
    reduce((sum, exp) => sum + (exp.amount || 0), 0);

    const chequeExpense = expenses.
    filter((exp) => exp.payment_type === 'Cheque').
    reduce((sum, exp) => sum + (exp.amount || 0), 0);

    const totalExpenses = cashExpense + cardExpense + chequeExpense;

    return { cashExpense, cardExpense, chequeExpense, totalExpenses };
  };

  const { cashExpense, cardExpense, chequeExpense, totalExpenses } = calculateTotals();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'Cash':return '💵';
      case 'Credit':return '💳';
      case 'Cheque':return '🧾';
      default:return '💰';
    }
  };

  return (
    <>
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Expenses
          </h3>
          <Button
            onClick={() => setShowForm(true)}
            size="sm"
            className="gap-2 hover:bg-blue-600 transition-colors"
            disabled={loading}
            type="button">

            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </div>

        <div className="space-y-4">
          {loading ?
          <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50 animate-spin" />
              <p>Loading expenses...</p>
            </div> :
          expenses.length === 0 ?
          <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No expenses added yet</p>
              <p className="text-sm">Click "Add Expense" to get started</p>
            </div> :

          expenses.map((expense) =>
          <Card key={expense.id} className="p-4 space-y-3 border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="gap-1">
                    <FileText className="h-3 w-3" />
                    Expense #{expense.id}
                  </Badge>
                  <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteExpense(expense.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                disabled={loading}
                type="button">

                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
                  {/* Vendor/Other's Name */}
                  <div className="space-y-1">
                    <Label className="text-sm text-gray-600 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {expense.vendor_name ? 'Vendor' : "Other's Name"}
                    </Label>
                    <div className="text-sm font-medium">
                      {expense.vendor_name || expense.others_name}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="space-y-1">
                    <Label className="text-sm text-gray-600 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Amount
                    </Label>
                    <div className="text-lg font-bold text-red-600">
                      ${expense.amount.toFixed(2)}
                    </div>
                  </div>

                  {/* Payment Type */}
                  <div className="space-y-1">
                    <Label className="text-sm text-gray-600 flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      Payment Type
                    </Label>
                    <Badge variant={expense.payment_type === 'Cash' ? 'default' : 'secondary'} className="gap-1">
                      {getPaymentTypeIcon(expense.payment_type)}
                      {expense.payment_type}
                      {expense.payment_type === 'Cheque' && expense.cheque_number &&
                  <span className="ml-1">#{expense.cheque_number}</span>
                  }
                    </Badge>
                  </div>

                  {/* Date */}
                  <div className="space-y-1">
                    <Label className="text-sm text-gray-600 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Date
                    </Label>
                    <div className="text-sm">
                      {formatDate(expense.expense_date)}
                    </div>
                  </div>

                  {/* Invoice File */}
                  {expense.invoice_file_id &&
              <div className="space-y-1 col-span-full">
                      <Label className="text-sm text-gray-600 flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Invoice Attached
                      </Label>
                      <Badge variant="secondary" className="gap-1">
                        <FileText className="h-3 w-3" />
                        File ID: {expense.invoice_file_id}
                      </Badge>
                    </div>
              }
                </div>
              </Card>
          )
          }
        </div>

        {/* Expense Totals Calculation */}
        {expenses.length > 0 &&
        <Card className="p-4 bg-gray-50 border-2 border-gray-200">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Expense Summary
            </h4>
            
            <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'}`}>
              <div className="bg-white p-3 rounded-lg border">
                <Label className="text-sm text-gray-600">Cash Expense</Label>
                <div className="text-xl font-bold text-red-600">
                  ${cashExpense.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Used in Short/Over calculation
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg border">
                <Label className="text-sm text-gray-600">Card Expense</Label>
                <div className="text-xl font-bold text-red-600">
                  ${cardExpense.toFixed(2)}
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg border">
                <Label className="text-sm text-gray-600">Cheque Expense</Label>
                <div className="text-xl font-bold text-red-600">
                  ${chequeExpense.toFixed(2)}
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg border border-red-300">
                <Label className="text-sm text-gray-600">Total Expenses</Label>
                <div className="text-2xl font-bold text-red-600">
                  ${totalExpenses.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Explanation of calculation */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Short/Over Calculation:</p>
                <p className="text-xs">
                  Cash Collection on Hand - (Gas Cash + Grocery Cash + Lottery Cash - Cash Expenses)
                </p>
              </div>
            </div>
          </Card>
        }
      </Card>

      <ExpenseFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={addExpense} />

    </>);

};

export default ExpensesSection;