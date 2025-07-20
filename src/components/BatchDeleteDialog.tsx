import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle } from
'@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';

interface BatchDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCount: number;
  isLoading?: boolean;
  itemName?: string; // e.g., "users", "stations", "logs"
  selectedItems?: any[]; // Optional: show preview of items to be deleted
}

const BatchDeleteDialog: React.FC<BatchDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  isLoading = false,
  itemName = 'items',
  selectedItems = []
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Confirm Batch Delete
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div>
              Are you sure you want to delete{' '}
              <Badge variant="destructive" className="mx-1">
                {selectedCount}
              </Badge>
              {itemName}? This action cannot be undone.
            </div>
            
            {selectedItems.length > 0 && selectedItems.length <= 5 &&
            <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Items to be deleted:</p>
                <div className="space-y-1">
                  {selectedItems.map((item, index) =>
                <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {item.name || item.title || item.id || 'Unknown item'}
                    </div>
                )}
                </div>
              </div>
            }
            
            {selectedItems.length > 5 &&
            <div className="mt-4">
                <p className="text-sm text-gray-600">
                  {selectedCount} {itemName} will be permanently deleted.
                </p>
              </div>
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600">

            {isLoading ? 'Deleting...' : `Delete ${selectedCount} ${itemName}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>);

};

export default BatchDeleteDialog;