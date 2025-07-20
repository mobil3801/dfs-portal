
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter } from
'@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Clock,
  Calendar,
  MapPin,
  Trash2,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2 } from
'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DraftSavingService from '@/utils/draftSaving';

interface DraftInfo {
  station: string;
  reportDate: string;
  savedAt: Date;
  expiresAt: Date;
  timeRemainingHours: number;
}

interface DraftManagementDialogProps {
  open: boolean;
  onClose: () => void;
  onLoadDraft?: (draftData: any, station: string, reportDate: string) => void;
  currentStation?: string;
  currentReportDate?: string;
}

const DraftManagementDialog: React.FC<DraftManagementDialogProps> = ({
  open,
  onClose,
  onLoadDraft,
  currentStation,
  currentReportDate
}) => {
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<DraftInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadDrafts();
      // Clean up expired drafts when dialog opens
      DraftSavingService.cleanupExpiredDrafts();
    }
  }, [open]);

  const loadDrafts = () => {
    setLoading(true);
    try {
      const allDrafts = DraftSavingService.getAllDrafts();
      setDrafts(allDrafts);
    } catch (error) {
      console.error('Error loading drafts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load drafts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDraft = (draft: DraftInfo) => {
    try {
      const draftData = DraftSavingService.loadDraft(draft.station, draft.reportDate);

      if (draftData) {
        onLoadDraft?.(draftData, draft.station, draft.reportDate);
        toast({
          title: 'Draft Loaded',
          description: `Draft from ${draft.station} loaded successfully`
        });
        onClose();
      } else {
        toast({
          title: 'Error',
          description: 'Draft data could not be loaded',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      toast({
        title: 'Error',
        description: 'Failed to load draft',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteDraft = (draft: DraftInfo) => {
    try {
      DraftSavingService.deleteDraft(draft.station, draft.reportDate);
      setDrafts((prev) => prev.filter((d) =>
      d.station !== draft.station || d.reportDate !== draft.reportDate
      ));
      toast({
        title: 'Draft Deleted',
        description: `Draft from ${draft.station} deleted successfully`
      });
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete draft',
        variant: 'destructive'
      });
    }
  };

  const formatTimeRemaining = (hours: number): string => {
    if (hours < 1) {
      const minutes = Math.floor(hours * 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return `${Math.floor(hours)} hour${Math.floor(hours) !== 1 ? 's' : ''}`;
  };

  const isCurrentDraft = (draft: DraftInfo): boolean => {
    return draft.station === currentStation && draft.reportDate === currentReportDate;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Draft Management
          </DialogTitle>
          <DialogDescription>
            Manage your saved drafts. Drafts are automatically deleted after 12 hours.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ?
          <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading drafts...</span>
            </div> :
          drafts.length === 0 ?
          <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No drafts found. Drafts are automatically saved when you use the "Save as Draft" button.
              </AlertDescription>
            </Alert> :

          <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-4">
                Found {drafts.length} draft{drafts.length !== 1 ? 's' : ''}
              </div>
              
              {drafts.map((draft, index) =>
            <Card key={`${draft.station}-${draft.reportDate}`} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="gap-1">
                            <MapPin className="w-3 h-3" />
                            {draft.station}
                          </Badge>
                          
                          <Badge variant="outline" className="gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(draft.reportDate).toLocaleDateString()}
                          </Badge>

                          {isCurrentDraft(draft) &&
                      <Badge className="gap-1 bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Current Form
                            </Badge>
                      }
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Saved: {draft.savedAt.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Expires in: {formatTimeRemaining(draft.timeRemainingHours)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadDraft(draft)}
                      className="gap-1">

                          <Upload className="w-3 h-3" />
                          Load
                        </Button>
                        
                        <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDraft(draft)}
                      className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50">

                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Expiry warning */}
                    {draft.timeRemainingHours < 2 &&
                <Alert className="mt-3 border-amber-200 bg-amber-50">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                          This draft will expire soon. Load it now to preserve your data.
                        </AlertDescription>
                      </Alert>
                }
                  </CardContent>
                </Card>
            )}
            </div>
          }
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

};

export default DraftManagementDialog;