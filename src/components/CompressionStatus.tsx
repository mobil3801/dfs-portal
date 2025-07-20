import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, FileImage, TrendingDown, Check } from 'lucide-react';
import { formatFileSize, type CompressionResult } from '@/utils/imageCompression';

interface CompressionStatusProps {
  result: CompressionResult;
  className?: string;
}

const CompressionStatus: React.FC<CompressionStatusProps> = ({ result, className = '' }) => {
  if (!result.wasCompressed) {
    return null;
  }

  const savingsPercentage = ((result.originalSize - result.compressedSize) / result.originalSize * 100).toFixed(1);

  return (
    <Card className={`border-green-200 bg-green-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-100 rounded-full">
            <Zap className="h-4 w-4 text-green-600" />
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">Image Compressed Successfully</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="space-y-1">
                <p className="text-gray-600">Original Size</p>
                <Badge variant="outline" className="text-xs">
                  <FileImage className="h-3 w-3 mr-1" />
                  {formatFileSize(result.originalSize)}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <p className="text-gray-600">Compressed Size</p>
                <Badge variant="outline" className="text-xs bg-green-100 border-green-300">
                  <FileImage className="h-3 w-3 mr-1" />
                  {formatFileSize(result.compressedSize)}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <p className="text-gray-600">Space Saved</p>
                <Badge variant="default" className="text-xs bg-green-600">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {savingsPercentage}%
                </Badge>
              </div>
              
              <div className="space-y-1">
                <p className="text-gray-600">Compression Ratio</p>
                <Badge variant="outline" className="text-xs">
                  {result.compressionRatio.toFixed(1)}:1
                </Badge>
              </div>
            </div>
            
            <p className="text-xs text-green-700">
              Your image has been optimized for faster uploads and better performance while maintaining visual quality.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>);

};

export default CompressionStatus;