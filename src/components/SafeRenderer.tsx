import React from 'react';
import { sanitizeTextContent, sanitizeElementId, sanitizeClassName, sanitizeDataAttribute } from '@/utils/sanitizeHelper';

interface SafeRendererProps {
  children?: React.ReactNode;
  className?: string;
  id?: string;
  [key: string]: any;
}

/**
 * SafeRenderer component that automatically sanitizes props to prevent InvalidCharacterError
 */
const SafeRenderer: React.FC<SafeRendererProps> = ({
  children,
  className,
  id,
  ...props
}) => {
  // Sanitize common problematic props
  const safeProps: any = {};

  // Sanitize className
  if (className) {
    safeProps.className = sanitizeClassName(className);
  }

  // Sanitize id
  if (id) {
    safeProps.id = sanitizeElementId(id);
  }

  // Sanitize other props
  Object.entries(props).forEach(([key, value]) => {
    if (key.startsWith('data-')) {
      // Special handling for data attributes
      safeProps[key] = sanitizeDataAttribute(value);
    } else if (typeof value === 'string') {
      // Sanitize string values
      safeProps[key] = sanitizeTextContent(value);
    } else {
      // Keep non-string values as is
      safeProps[key] = value;
    }
  });

  return (
    <div {...safeProps}>
      {children}
    </div>);

};

/**
 * Higher-order component that wraps components with safe rendering
 */
export const withSafeRendering = <P extends object,>(
Component: React.ComponentType<P>)
: React.FC<P> => {
  return (props: P) => {
    try {
      return <Component {...props} />;
    } catch (error) {
      if (error instanceof Error && error.name === 'InvalidCharacterError') {
        console.error('InvalidCharacterError caught and handled:', error);

        // Sanitize props before retrying
        const sanitizedProps = Object.entries(props as any).reduce((acc, [key, value]) => {
          if (typeof value === 'string') {
            acc[key] = sanitizeTextContent(value);
          } else {
            acc[key] = value;
          }
          return acc;
        }, {} as any);

        return <Component {...sanitizedProps} />;
      }

      // Re-throw non-InvalidCharacterError errors
      throw error;
    }
  };
};

/**
 * SafeText component for rendering text content safely
 */
export const SafeText: React.FC<{
  children: string;
  className?: string;
  tag?: keyof JSX.IntrinsicElements;
  [key: string]: any;
}> = ({
  children,
  className,
  tag: Tag = 'span',
  ...props
}) => {
  const safeText = sanitizeTextContent(children || '');
  const safeClassName = className ? sanitizeClassName(className) : undefined;

  const safeProps = Object.entries(props).reduce((acc, [key, value]) => {
    if (typeof value === 'string') {
      acc[key] = sanitizeTextContent(value);
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as any);

  return (
    <Tag
      className={safeClassName}
      {...safeProps}
      dangerouslySetInnerHTML={{ __html: safeText }} />);


};

/**
 * SafeInput component for form inputs with sanitized attributes
 */
export const SafeInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {
  safeId?: string;
}> = ({
  className,
  id,
  safeId,
  value,
  defaultValue,
  ...props
}) => {
  const inputId = safeId || id;
  const safeProps = {
    ...props,
    className: className ? sanitizeClassName(className) : undefined,
    id: inputId ? sanitizeElementId(inputId) : undefined,
    value: typeof value === 'string' ? sanitizeTextContent(value) : value,
    defaultValue: typeof defaultValue === 'string' ? sanitizeTextContent(defaultValue) : defaultValue
  };

  return <input {...safeProps} />;
};

export default SafeRenderer;