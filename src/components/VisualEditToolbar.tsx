import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit3, Settings, CheckCircle, Eye, Pencil, Trash2, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface VisualEditToolbarProps {
  className?: string;
  showQuickActions?: boolean;
}

const VisualEditToolbar: React.FC<VisualEditToolbarProps> = ({
  className = '',
  showQuickActions = true
}) => {
  const { isVisualEditingEnabled, canEdit, canDelete, canCreate } = useAuth();

  if (!isVisualEditingEnabled) {
    return null;
  }

  return (
    <Card className={`border-green-200 bg-green-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Visual Editing Active</span>
            </div>
            <div className="flex items-center space-x-2">
              {canCreate() &&
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Plus className="w-3 h-3 mr-1" />
                  Create
                </Badge>
              }
              {canEdit() &&
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  <Pencil className="w-3 h-3 mr-1" />
                  Edit
                </Badge>
              }
              {canDelete() &&
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Badge>
              }
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                <Eye className="w-3 h-3 mr-1" />
                View
              </Badge>
            </div>
          </div>
          
          {showQuickActions &&
          <div className="flex items-center space-x-2">
              <span className="text-sm text-green-700">All permissions enabled</span>
              <Button variant="ghost" size="sm" className="text-green-700 hover:text-green-800">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          }
        </div>
      </CardContent>
    </Card>);

};

export default VisualEditToolbar;