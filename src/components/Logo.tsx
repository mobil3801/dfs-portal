import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = false
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeClasses[size]} flex-shrink-0`}>
        <img
          src="https://cdn.ezsite.ai/AutoDev/19016/c533e5f9-97eb-43d2-8be6-bcdff5709bba.png"
          alt="DFS Manager Logo"
          className="w-full h-full object-contain rounded-lg shadow-sm"
          onError={(e) => {
            // Fallback to a simple colored div if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }} />

        {/* Fallback logo */}
        <div className={`hidden ${sizeClasses[size]} bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold ${textSizeClasses[size]}`}>
          DFS
        </div>
      </div>
      {showText &&
      <div className="flex flex-col">
          <span className={`font-bold text-gray-800 ${textSizeClasses[size]}`}>
            DFS Manager
          </span>
          <span className="text-xs text-gray-600">
            Gas Station Management
          </span>
        </div>
      }
    </div>);

};

export { Logo };