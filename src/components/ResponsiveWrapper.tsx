import React from 'react';
import { useResponsiveLayout } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ResponsiveWrapperProps {
  children: React.ReactNode;
  className?: string;
  mobileClassName?: string;
  tabletClassName?: string;
  desktopClassName?: string;
}

export const ResponsiveWrapper: React.FC<ResponsiveWrapperProps> = ({
  children,
  className = '',
  mobileClassName = '',
  tabletClassName = '',
  desktopClassName = ''
}) => {
  const responsive = useResponsiveLayout();

  const responsiveClass = cn(
    className,
    responsive.isMobile && mobileClassName,
    responsive.isTablet && tabletClassName,
    responsive.isDesktop && desktopClassName
  );

  return (
    <div className={responsiveClass}>
      {children}
    </div>);

};

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className = ''
}) => {
  const responsive = useResponsiveLayout();

  const gridClass = cn(
    'grid gap-4',
    responsive.isMobile && 'grid-cols-1',
    responsive.isTablet && 'grid-cols-2',
    responsive.isDesktop && 'grid-cols-3 lg:grid-cols-4',
    className
  );

  return (
    <div className={gridClass}>
      {children}
    </div>);

};

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  fallbackComponent?: React.ReactNode;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  children,
  className = '',
  fallbackComponent
}) => {
  const responsive = useResponsiveLayout();

  if (responsive.isMobile && fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  return (
    <div className={cn(
      'overflow-x-auto',
      responsive.isMobile && 'overflow-x-scroll',
      className
    )}>
      {children}
    </div>);

};

interface ResponsiveCardGridProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveCardGrid: React.FC<ResponsiveCardGridProps> = ({
  children,
  className = ''
}) => {
  const responsive = useResponsiveLayout();

  const gridClass = cn(
    'grid gap-4 sm:gap-6',
    responsive.isMobile && 'grid-cols-1',
    responsive.isTablet && 'grid-cols-2',
    responsive.isDesktop && 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    className
  );

  return (
    <div className={gridClass}>
      {children}
    </div>);

};

interface ResponsiveStackProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg';
}

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  className = '',
  spacing = 'md'
}) => {
  const responsive = useResponsiveLayout();

  const spacingClass = {
    sm: 'space-y-2 sm:space-y-3',
    md: 'space-y-4 sm:space-y-6',
    lg: 'space-y-6 sm:space-y-8'
  }[spacing];

  const stackClass = cn(
    'flex flex-col',
    spacingClass,
    responsive.isMobile && 'px-1',
    className
  );

  return (
    <div className={stackClass}>
      {children}
    </div>);

};

export default ResponsiveWrapper;