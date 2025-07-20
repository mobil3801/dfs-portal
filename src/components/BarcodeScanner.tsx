import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Camera, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ComponentErrorBoundary } from './ErrorBoundary';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  triggerText?: string;
  disabled?: boolean;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, triggerText = "Scan Barcode", disabled = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsScanning(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        variant: "destructive",
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions."
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsScanning(false);
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        // Simple barcode detection simulation
        // In a real implementation, you would use a library like ZXing or QuaggaJS
        const simulatedBarcode = Math.random().toString(36).substr(2, 12).toUpperCase();
        onScan(simulatedBarcode);
        setIsOpen(false);
        stopCamera();

        toast({
          title: "Barcode Scanned",
          description: `Detected barcode: ${simulatedBarcode}`
        });
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  return (
    <ComponentErrorBoundary
      componentName="BarcodeScanner"
      severity="medium"
      minHeight="200px">

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={disabled}>
          <Camera className="w-4 h-4 mr-2" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Barcode</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-full max-w-sm aspect-video bg-black rounded-lg overflow-hidden">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover" />

            <canvas
                ref={canvasRef}
                className="hidden" />

            {!isScanning &&
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <Camera className="w-12 h-12 mx-auto mb-2" />
                  <p>Initializing camera...</p>
                </div>
              </div>
              }
          </div>
          <div className="flex space-x-2">
            <Button onClick={captureFrame} disabled={!isScanning}>
              Capture
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Position the barcode within the camera view and click Capture
          </p>
        </div>
      </DialogContent>
      </Dialog>
    </ComponentErrorBoundary>);


};

export default BarcodeScanner;