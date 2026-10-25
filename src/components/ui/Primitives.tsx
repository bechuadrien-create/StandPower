import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'terracotta' | 'outline' | 'ghost' | 'danger';
  size?: 'md' | 'lg' | 'sm';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      className = '',
      children,
      disabled,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-colors select-none disabled:opacity-50 disabled:pointer-events-none';
    const sizes = {
      sm: 'min-h-[48px] px-3.5 py-2 text-sm',
      md: 'min-h-[48px] px-4 py-2.5 text-sm',
      lg: 'min-h-[52px] px-5 py-3 text-base font-semibold',
    };
    const variants = {
      primary:
        'bg-sp-accent text-sp-accent-fg hover:opacity-95 active:opacity-90 shadow-sm',
      secondary:
        'bg-sp-elevated text-sp-text border border-sp-border hover:bg-sp-border/60',
      terracotta:
        'bg-sp-terracotta text-sp-terracotta-fg hover:opacity-95 active:opacity-90 shadow-sm',
      outline:
        'bg-transparent text-sp-text border border-sp-border hover:bg-sp-elevated',
      ghost: 'bg-transparent text-sp-muted hover:text-sp-text hover:bg-sp-elevated/60',
      danger:
        'bg-sp-danger/15 text-sp-danger border border-sp-danger/40 hover:bg-sp-danger/25',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={`${base} ${sizes[size]} ${variants[variant]} ${
          fullWidth ? 'w-full' : ''
        } ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export function Card({
  children,
  className = '',
  as: Component = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
}) {
  return (
    <Component
      className={`bg-sp-surface border border-sp-border rounded-2xl p-4 shadow-sm ${className}`}
    >
      {children}
    </Component>
  );
}

export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'sage' | 'terracotta' | 'warning' | 'success';
  className?: string;
}) {
  const tones = {
    neutral: 'bg-sp-elevated text-sp-muted border-sp-border',
    sage: 'bg-sp-accent/20 text-sp-text border-sp-accent/40',
    terracotta: 'bg-sp-terracotta/20 text-sp-text border-sp-terracotta/40',
    warning: 'bg-sp-warning/20 text-sp-text border-sp-warning/40',
    success: 'bg-sp-success/20 text-sp-text border-sp-success/40',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function AlertBox({
  title,
  children,
  tone = 'info',
}: {
  title?: string;
  children: React.ReactNode;
  tone?: 'info' | 'warning' | 'error' | 'success';
}) {
  const styles = {
    info: 'bg-sp-elevated/80 border-sp-border text-sp-text',
    warning: 'bg-sp-warning/15 border-sp-warning/40 text-sp-text',
    error: 'bg-sp-danger/15 border-sp-danger/50 text-sp-text',
    success: 'bg-sp-success/15 border-sp-success/40 text-sp-text',
  };
  const Icon =
    tone === 'error' || tone === 'warning'
      ? AlertCircle
      : tone === 'success'
      ? CheckCircle2
      : Info;

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border p-3.5 text-sm flex items-start gap-3 ${styles[tone]}`}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5 text-sp-accent" aria-hidden="true" />
      <div className="space-y-1">
        {title && <p className="font-semibold text-sp-text">{title}</p>}
        <div className="text-sp-muted leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-sp-surface border border-dashed border-sp-border rounded-2xl p-6 text-center space-y-3">
      <h3 className="text-base font-semibold text-sp-text">{title}</h3>
      <p className="text-sm text-sp-muted max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {action && <div className="pt-2 flex justify-center">{action}</div>}
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string | null }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs text-sp-danger mt-1 font-medium">
      {message}
    </p>
  );
}
