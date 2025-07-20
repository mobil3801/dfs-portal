import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyComponentLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minHeight?: string;
}

const DefaultLoader = ({ minHeight = '400px' }: {minHeight?: string;}) =>
<div className="flex items-center justify-center" style={{ minHeight }}>
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
      <p className="text-gray-600">Loading component...</p>
    </div>
  </div>;


const LazyComponentLoader: React.FC<LazyComponentLoaderProps> = ({
  children,
  fallback,
  minHeight = '400px'
}) => {
  return (
    <Suspense fallback={fallback || <DefaultLoader minHeight={minHeight} />}>
      {children}
    </Suspense>);

};

export default LazyComponentLoader;