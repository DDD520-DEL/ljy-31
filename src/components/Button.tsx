import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700 shadow-md shadow-sky-500/20 hover:shadow-lg hover:shadow-sky-500/30',
  secondary:
    'bg-slate-100 text-slate-700 hover:bg-slate-200',
  success:
    'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20',
  danger:
    'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100',
  outline:
    'bg-transparent border-2 border-sky-500 text-sky-600 hover:bg-sky-50',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-xl',
  md: 'px-4 py-2.5 text-sm font-medium rounded-xl',
  lg: 'px-6 py-3.5 text-base font-semibold rounded-2xl',
  xl: 'px-8 py-4 text-lg font-semibold rounded-2xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500/50',
          'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
