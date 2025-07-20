import React from 'react';
import { ComponentErrorBoundary } from '@/components/ErrorBoundary';
import ExpensesSection from '@/components/SalesReportSections/ExpensesSection';

interface Expense {
  id: string;
  vendorId?: string;
  vendorName?: string;
  othersName?: string;
  amount: number;
  paymentType: 'Cash' | 'Credit Card' | 'Cheque';
  chequeNo?: string;
  invoiceFileId?: number;
  notes: string;
}

interface ExpensesSectionWrapperProps {
  expenses: Expense[];
  onChange: (expenses: Expense[]) => void;
}

const ExpensesSectionWrapper: React.FC<ExpensesSectionWrapperProps> = (props) => {
  return (
    <ComponentErrorBoundary>
      <ExpensesSection {...props} />
    </ComponentErrorBoundary>);

};

export default ExpensesSectionWrapper;