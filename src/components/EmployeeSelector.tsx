import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Users, Loader2 } from 'lucide-react';

interface Employee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  position: string;
  station: string;
  is_active: boolean;
}

interface EmployeeSelectorProps {
  value?: string;
  onValueChange: (employeeId: string, employeeName: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  station?: string; // Filter by station if provided
  className?: string;
  showLabel?: boolean;
}

const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({
  value,
  onValueChange,
  label = "Employee",
  placeholder = "Select employee",
  required = false,
  disabled = false,
  station,
  className = "",
  showLabel = true
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();
  }, [station]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const filters = [
      { name: 'is_active', op: 'Equal', value: true }];


      // Add station filter if provided
      if (station) {
        filters.push({ name: 'station', op: 'Equal', value: station });
      }

      const { data, error } = await window.ezsite.apis.tablePage(11727, {
        PageNo: 1,
        PageSize: 1000,
        OrderByField: 'first_name',
        IsAsc: true,
        Filters: filters
      });

      if (error) throw error;
      setEmployees(data?.List || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employees',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (selectedEmployeeId: string) => {
    const selectedEmployee = employees.find((emp) => emp.employee_id === selectedEmployeeId);
    if (selectedEmployee) {
      const fullName = `${selectedEmployee.first_name} ${selectedEmployee.last_name}`;
      onValueChange(selectedEmployeeId, fullName);
    }
  };

  // Filter out employees with empty employee_id values
  const validEmployees = employees.filter((employee) => employee.employee_id && employee.employee_id.trim() !== '');

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel &&
      <Label htmlFor="employee-selector" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      }
      
      <Select
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled || loading}
        required={required}>

        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={
            loading ?
            <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading employees...
                </div> :
            placeholder
            } />

        </SelectTrigger>
        <SelectContent>
          {validEmployees.length === 0 && !loading &&
          <div className="p-2 text-center text-gray-500">
              {station ? `No active employees found for ${station}` : 'No active employees found'}
            </div>
          }
          
          {validEmployees.map((employee) =>
          <SelectItem key={employee.id} value={employee.employee_id}>
              <div className="flex flex-col">
                <span className="font-medium">
                  {employee.first_name} {employee.last_name}
                </span>
                <span className="text-xs text-gray-500">
                  ID: {employee.employee_id} • {employee.position} • {employee.station}
                </span>
              </div>
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      
      {station &&
      <p className="text-xs text-gray-500">
          Showing employees from {station} station only
        </p>
      }
    </div>);

};

export default EmployeeSelector;