import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  gradient?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, gradient = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden',
          hover && 'transition-all duration-300 hover:shadow-md hover:-translate-y-0.5',
          gradient && 'bg-gradient-to-br from-sky-500 to-blue-600 text-white border-transparent',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-5 py-4 border-b border-slate-100', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('text-lg font-semibold text-slate-800', className)}
        {...props}
      >
        {children}
      </h3>
    );
  }
);
CardTitle.displayName = 'CardTitle';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('px-5 py-4', className)} {...props}>
        {children}
      </div>
    );
  }
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-5 py-4 border-t border-slate-100 bg-slate-50/50', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardFooter.displayName = 'CardFooter';
