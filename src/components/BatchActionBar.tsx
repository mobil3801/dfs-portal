import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, X } from 'lucide-react';

interface BatchActionBarProps {
  selectedCount: number;
  onBatchEdit?: () => void;
  onBatchDelete?: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
}

const BatchActionBar: React.FC<BatchActionBarProps> = ({
  selectedCount,
  onBatchEdit,
  onBatchDelete,
  onClearSelection,
  isLoading = false,
  showEdit = true,
  showDelete = true
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
        </Badge>
        
        <div className="flex items-center gap-2">
          {showEdit && onBatchEdit &&
          <Button
            size="sm"
            variant="outline"
            onClick={onBatchEdit}
            disabled={isLoading}
            className="flex items-center gap-2">

              <Edit className="h-4 w-4" />
              Edit Selected
            </Button>
          }
          
          {showDelete && onBatchDelete &&
          <Button
            size="sm"
            variant="outline"
            onClick={onBatchDelete}
            disabled={isLoading}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">

              <Trash2 className="h-4 w-4" />
              Delete Selected
            </Button>
          }
        </div>
      </div>
      
      <Button
        size="sm"
        variant="ghost"
        onClick={onClearSelection}
        disabled={isLoading}
        className="flex items-center gap-2">

        <X className="h-4 w-4" />
        Clear Selection
      </Button>
    </div>);

};

export default BatchActionBar;