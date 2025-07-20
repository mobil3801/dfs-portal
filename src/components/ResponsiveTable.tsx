import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface ResponsiveTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface ResponsiveTableProps {
  data: any[];
  columns: ResponsiveTableColumn[];
  onRowClick?: (row: any) => void;
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  mobileCardRender?: (row: any, index: number) => React.ReactNode;
  showMobileActions?: boolean;
  mobileActions?: (row: any) => React.ReactNode;
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  data,
  columns,
  onRowClick,
  onSort,
  sortKey,
  sortDirection,
  loading = false,
  emptyMessage = 'No data available',
  className,
  mobileCardRender,
  showMobileActions = true,
  mobileActions
}) => {
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) =>
        <div
          key={i}
          className={cn(
            'h-16 bg-gray-100 rounded animate-pulse',
            isMobile && 'h-32'
          )} />

        )}
      </div>);

  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>);

  }

  // Mobile Card View
  if (isMobile && mobileCardRender) {
    return (
      <div className="space-y-4">
        {data.map((row, index) =>
        <Card
          key={row.ID || index}
          className={cn(
            'transition-shadow hover:shadow-md',
            onRowClick && 'cursor-pointer',
            className
          )}
          onClick={() => onRowClick?.(row)}>

            {mobileCardRender(row, index)}
          </Card>
        )}
      </div>);

  }

  // Mobile Default Card View
  if (isMobile) {
    return (
      <div className="space-y-4">
        {data.map((row, index) =>
        <Card
          key={row.ID || index}
          className={cn(
            'transition-shadow hover:shadow-md',
            onRowClick && 'cursor-pointer',
            className
          )}
          onClick={() => onRowClick?.(row)}>

            <CardContent className="p-4">
              <div className="space-y-3">
                {columns.slice(0, 4).map((column) => {
                const value = row[column.key];
                const displayValue = column.render ? column.render(value, row) : value;

                return (
                  <div key={column.key} className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-600 min-w-0 flex-1">
                        {column.label}:
                      </span>
                      <div className="text-sm text-gray-900 text-right ml-2 min-w-0 flex-1">
                        {displayValue}
                      </div>
                    </div>);

              })}
                
                {showMobileActions &&
              <div className="flex items-center justify-between pt-2 border-t">
                    {mobileActions ?
                <div onClick={(e) => e.stopPropagation()}>
                        {mobileActions(row)}
                      </div> :

                <div className="flex items-center text-blue-600">
                        <span className="text-sm">View Details</span>
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </div>
                }
                  </div>
              }
              </div>
            </CardContent>
          </Card>
        )}
      </div>);

  }

  // Desktop Table View
  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) =>
              <th
                key={column.key}
                className={cn(
                  'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                  column.sortable && 'cursor-pointer hover:bg-gray-100',
                  column.className
                )}
                onClick={() => column.sortable && onSort?.(column.key)}>

                  <div className="flex items-center">
                    {column.label}
                    {column.sortable && sortKey === column.key &&
                  <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                  }
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) =>
            <tr
              key={row.ID || index}
              className={cn(
                'hover:bg-gray-50 transition-colors',
                onRowClick && 'cursor-pointer'
              )}
              onClick={() => onRowClick?.(row)}>

                {columns.map((column) => {
                const value = row[column.key];
                const displayValue = column.render ? column.render(value, row) : value;

                return (
                  <td
                    key={column.key}
                    className={cn(
                      'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
                      column.className
                    )}>

                      {displayValue}
                    </td>);

              })}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>);

};

export default ResponsiveTable;