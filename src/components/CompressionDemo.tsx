import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Zap, FileImage, TrendingDown, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { compressImage, formatFileSize, isImageFile, type CompressionResult } from '@/utils/imageCompression';

interface CompressionDemoProps {
  className?: string;
}

const CompressionDemo: React.FC<CompressionDemoProps> = ({ className = '' }) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setCompressionResult(null);
    }
  };

  const handleCompress = async () => {
    if (!selectedFile) return;

    setIsCompressing(true);
    try {
      const result = await compressImage(selectedFile, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        quality: 0.8
      });

      setCompressionResult(result);

      if (result.wasCompressed) {
        toast({
          title: 'Compression Complete!',
          description: `File size reduced by ${((1 - result.compressedSize / result.originalSize) * 100).toFixed(1)}%`
        });
      } else {
        toast({
          title: 'No compression needed',
          description: 'File was already optimized or not an image',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Compression failed:', error);
      toast({
        title: 'Compression failed',
        description: 'Could not compress the image',
        variant: 'destructive'
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const resetDemo = () => {
    setSelectedFile(null);
    setCompressionResult(null);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          Compression Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedFile ?
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <div className="space-y-3">
              <Upload className="h-8 w-8 mx-auto text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">Select an image to test compression</p>
                <p className="text-xs text-gray-500">Choose a large image file (&gt;1MB) to see compression in action</p>
              </div>
              <label className="cursor-pointer">
                <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden" />

                <Button variant="outline" className="mt-2">
                  Choose File
                </Button>
              </label>
            </div>
          </div> :

        <div className="space-y-4">
            {/* Selected file info */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileImage className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium truncate">{selectedFile.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={resetDemo}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                <span>Size: {formatFileSize(selectedFile.size)}</span>
                <span>Type: {selectedFile.type}</span>
                {isImageFile(selectedFile) && selectedFile.size > 1024 * 1024 &&
              <Badge variant="outline" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    Will be compressed
                  </Badge>
              }
              </div>
            </div>

            {/* Compression button */}
            <Button
            onClick={handleCompress}
            disabled={isCompressing}
            className="w-full">

              {isCompressing ?
            <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Compressing...
                </> :

            <>
                  <Zap className="h-4 w-4 mr-2" />
                  Test Compression
                </>
            }
            </Button>

            {/* Results */}
            {compressionResult &&
          <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {compressionResult.wasCompressed ?
              <Check className="h-5 w-5 text-green-600" /> :

              <FileImage className="h-5 w-5 text-blue-600" />
              }
                  <span className="font-medium text-sm">
                    {compressionResult.wasCompressed ? 'Compression Complete' : 'No Compression Needed'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Original Size</p>
                    <p className="font-medium">{formatFileSize(compressionResult.originalSize)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Final Size</p>
                    <p className="font-medium">{formatFileSize(compressionResult.compressedSize)}</p>
                  </div>
                </div>

                {compressionResult.wasCompressed &&
            <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <TrendingDown className="h-4 w-4" />
                      <span className="font-medium">
                        {((1 - compressionResult.compressedSize / compressionResult.originalSize) * 100).toFixed(1)}% reduction
                      </span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      Saved {formatFileSize(compressionResult.originalSize - compressionResult.compressedSize)} of storage space
                    </p>
                  </div>
            }
              </div>
          }
          </div>
        }
      </CardContent>
    </Card>);

};

export default CompressionDemo;