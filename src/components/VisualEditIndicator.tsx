import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Edit3, CheckCircle } from 'lucide-react';

interface VisualEditIndicatorProps {
  feature?: string;
  className?: string;
}

const VisualEditIndicator: React.FC<VisualEditIndicatorProps> = ({
  feature = 'all features',
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-colors">
        <CheckCircle className="w-3 h-3 mr-1" />
        Visual Editing Enabled
      </Badge>
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors">
        <Edit3 className="w-3 h-3 mr-1" />
        Full Permissions Active
      </Badge>
    </div>);

};

export default VisualEditIndicator;