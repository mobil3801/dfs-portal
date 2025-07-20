import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle } from
'@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit } from 'lucide-react';

interface BatchEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  selectedCount: number;
  isLoading?: boolean;
  itemName?: string;
  children: React.ReactNode; // Form fields for editing
}

const BatchEditDialog: React.FC<BatchEditDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedCount,
  isLoading = false,
  itemName = 'items',
  children
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Batch Edit {itemName}
          </DialogTitle>
          <DialogDescription>
            Editing{' '}
            <Badge variant="secondary" className="mx-1">
              {selectedCount}
            </Badge>
            {itemName}. Changes will be applied to all selected items.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {children}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : `Update ${selectedCount} ${itemName}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

};

export default BatchEditDialog;