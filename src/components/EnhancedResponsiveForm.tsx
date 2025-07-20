import React from 'react';
import { useResponsiveLayout } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ResponsiveFormProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveForm: React.FC<ResponsiveFormProps> = ({
  children,
  className = ''
}) => {
  const responsive = useResponsiveLayout();

  const formClass = cn(
    'space-y-6',
    responsive.isMobile && 'space-y-4',
    className
  );

  return (
    <div className={formClass}>
      {children}
    </div>);

};

interface ResponsiveFormGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export const ResponsiveFormGrid: React.FC<ResponsiveFormGridProps> = ({
  children,
  columns = 2,
  className = ''
}) => {
  const responsive = useResponsiveLayout();

  const getGridCols = () => {
    if (responsive.isMobile) return 'grid-cols-1';
    if (responsive.isTablet) {
      return columns > 2 ? 'grid-cols-2' : `grid-cols-${columns}`;
    }
    return `grid-cols-${columns}`;
  };

  const gridClass = cn(
    'grid gap-4',
    responsive.isMobile && 'gap-3',
    responsive.isTablet && 'gap-4',
    responsive.isDesktop && 'gap-6',
    getGridCols(),
    className
  );

  return (
    <div className={gridClass}>
      {children}
    </div>);

};

interface ResponsiveButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'horizontal' | 'vertical' | 'responsive';
}

export const ResponsiveButtonGroup: React.FC<ResponsiveButtonGroupProps> = ({
  children,
  className = '',
  direction = 'responsive'
}) => {
  const responsive = useResponsiveLayout();

  const getFlexClass = () => {
    if (direction === 'vertical') return 'flex-col space-y-2';
    if (direction === 'horizontal') return 'flex-row space-x-2';

    // Responsive direction
    if (responsive.isMobile) {
      return 'flex-col space-y-2';
    }
    return 'flex-row space-x-2';
  };

  const buttonGroupClass = cn(
    'flex',
    getFlexClass(),
    responsive.isMobile && 'w-full',
    className
  );

  // Clone children to add responsive props
  const responsiveChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        ...child.props,
        className: cn(
          child.props.className,
          responsive.isMobile && 'w-full'
        )
      });
    }
    return child;
  });

  return (
    <div className={buttonGroupClass}>
      {responsiveChildren}
    </div>);

};

interface ResponsiveCardContainerProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export const ResponsiveCardContainer: React.FC<ResponsiveCardContainerProps> = ({
  children,
  className = '',
  padding = 'md'
}) => {
  const responsive = useResponsiveLayout();

  const getPaddingClass = () => {
    const basePadding = {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6'
    }[padding];

    const mobilePadding = {
      sm: 'p-2',
      md: 'p-3',
      lg: 'p-4'
    }[padding];

    return responsive.isMobile ? mobilePadding : basePadding;
  };

  const containerClass = cn(
    'bg-white rounded-lg border shadow-sm',
    getPaddingClass(),
    responsive.isMobile && 'mx-1',
    className
  );

  return (
    <div className={containerClass}>
      {children}
    </div>);

};

interface ResponsiveTextProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  size = 'base',
  className = ''
}) => {
  const responsive = useResponsiveLayout();

  const getTextSize = () => {
    const sizeMap = {
      xs: responsive.isMobile ? 'text-xs' : 'text-xs',
      sm: responsive.isMobile ? 'text-xs' : 'text-sm',
      base: responsive.isMobile ? 'text-sm' : 'text-base',
      lg: responsive.isMobile ? 'text-base' : 'text-lg',
      xl: responsive.isMobile ? 'text-lg' : 'text-xl',
      '2xl': responsive.isMobile ? 'text-xl' : 'text-2xl',
      '3xl': responsive.isMobile ? 'text-2xl' : 'text-3xl'
    };
    return sizeMap[size];
  };

  const textClass = cn(
    getTextSize(),
    responsive.isMobile && 'leading-relaxed',
    className
  );

  return (
    <span className={textClass}>
      {children}
    </span>);

};

interface ResponsiveModalProps {
  children: React.ReactNode;
  className?: string;
  fullScreenOnMobile?: boolean;
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  children,
  className = '',
  fullScreenOnMobile = false
}) => {
  const responsive = useResponsiveLayout();

  const modalClass = cn(
    'bg-white rounded-lg shadow-xl',
    responsive.isMobile && fullScreenOnMobile ?
    'fixed inset-0 m-0 rounded-none' :
    responsive.isMobile ?
    'mx-2 my-4 max-h-[90vh] overflow-y-auto' :
    'max-w-4xl mx-auto max-h-[85vh] overflow-y-auto',
    className
  );

  return (
    <div className={modalClass}>
      {children}
    </div>);

};

export default {
  ResponsiveForm,
  ResponsiveFormGrid,
  ResponsiveButtonGroup,
  ResponsiveCardContainer,
  ResponsiveText,
  ResponsiveModal
};