import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Settings, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CompressionSettings {
  enabled: boolean;
  maxSizeMB: number;
  quality: number;
  maxResolution: number;
  autoCompress: boolean;
}

interface ImageCompressionSettingsProps {
  className?: string;
  onSettingsChange?: (settings: CompressionSettings) => void;
}

const DEFAULT_SETTINGS: CompressionSettings = {
  enabled: true,
  maxSizeMB: 1,
  quality: 0.8,
  maxResolution: 1920,
  autoCompress: true
};

const ImageCompressionSettings: React.FC<ImageCompressionSettingsProps> = ({
  className = '',
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<CompressionSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('imageCompressionSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error('Failed to load compression settings:', error);
      }
    }
  }, []);

  // Track changes
  useEffect(() => {
    const savedSettings = localStorage.getItem('imageCompressionSettings');
    const currentSettings = JSON.stringify(settings);
    const originalSettings = savedSettings || JSON.stringify(DEFAULT_SETTINGS);
    setHasChanges(currentSettings !== originalSettings);
  }, [settings]);

  const updateSetting = <K extends keyof CompressionSettings,>(
  key: K,
  value: CompressionSettings[K]) =>
  {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    try {
      localStorage.setItem('imageCompressionSettings', JSON.stringify(settings));
      onSettingsChange?.(settings);
      setHasChanges(false);
      toast({
        title: 'Settings Saved',
        description: 'Image compression settings have been updated successfully.'
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Failed to Save',
        description: 'Could not save compression settings.',
        variant: 'destructive'
      });
    }
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    toast({
      title: 'Settings Reset',
      description: 'Compression settings have been reset to defaults.'
    });
  };

  const qualityPercentage = Math.round(settings.quality * 100);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          Image Compression Settings
          {settings.enabled &&
          <Badge variant="default" className="ml-2">
              <Settings className="h-3 w-3 mr-1" />
              Active
            </Badge>
          }
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Enable/Disable compression */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Enable Auto-Compression</Label>
            <p className="text-sm text-gray-600">
              Automatically compress large images during upload
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => updateSetting('enabled', checked)} />

        </div>

        {settings.enabled &&
        <>
            {/* Auto-compress threshold */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Compression Threshold</Label>
                <Badge variant="outline">{settings.maxSizeMB}MB</Badge>
              </div>
              <Slider
              value={[settings.maxSizeMB]}
              onValueChange={([value]) => updateSetting('maxSizeMB', value)}
              max={10}
              min={0.5}
              step={0.5}
              className="w-full" />

              <p className="text-xs text-gray-600">
                Images larger than this size will be compressed
              </p>
            </div>

            {/* Quality setting */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Compression Quality</Label>
                <Badge variant="outline">{qualityPercentage}%</Badge>
              </div>
              <Slider
              value={[settings.quality]}
              onValueChange={([value]) => updateSetting('quality', value)}
              max={1}
              min={0.1}
              step={0.1}
              className="w-full" />

              <p className="text-xs text-gray-600">
                Higher quality means larger file sizes
              </p>
            </div>

            {/* Maximum resolution */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Maximum Resolution</Label>
                <Badge variant="outline">{settings.maxResolution}px</Badge>
              </div>
              <Slider
              value={[settings.maxResolution]}
              onValueChange={([value]) => updateSetting('maxResolution', value)}
              max={4096}
              min={720}
              step={240}
              className="w-full" />

              <p className="text-xs text-gray-600">
                Maximum width or height for compressed images
              </p>
            </div>

            {/* Auto-compress all images */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-compress All Images</Label>
                <p className="text-sm text-gray-600">
                  Compress all images regardless of size
                </p>
              </div>
              <Switch
              checked={settings.autoCompress}
              onCheckedChange={(checked) => updateSetting('autoCompress', checked)} />

            </div>
          </>
        }

        {/* Compression preview/info */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Current Settings Summary</h4>
          <div className="space-y-1 text-xs text-gray-600">
            <p>Status: {settings.enabled ? 'Enabled' : 'Disabled'}</p>
            {settings.enabled &&
            <>
                <p>Threshold: Images over {settings.maxSizeMB}MB will be compressed</p>
                <p>Quality: {qualityPercentage}% (balance of quality vs. file size)</p>
                <p>Max Resolution: {settings.maxResolution}px (width or height)</p>
                <p>Auto-compress: {settings.autoCompress ? 'All images' : 'Large images only'}</p>
              </>
            }
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={saveSettings}
            disabled={!hasChanges}
            className="flex-1">

            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
          <Button
            variant="outline"
            onClick={resetSettings}>

            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>);

};

export default ImageCompressionSettings;