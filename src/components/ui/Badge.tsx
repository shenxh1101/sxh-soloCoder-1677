import * as React from 'react'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'roseGold' | 'success' | 'warning' | 'danger' | 'info'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant
  dot?: boolean
}

const variantStyles: Record<Variant, { wrapper: string; dot: string }> = {
  default: {
    wrapper: 'bg-warmPink/50 text-darkGray border border-warmPink',
    dot: 'bg-darkGray',
  },
  roseGold: {
    wrapper: 'bg-roseGold/10 text-roseGold border border-roseGold/30',
    dot: 'bg-roseGold',
  },
  success: {
    wrapper: 'bg-forestGreen/10 text-forestGreen border border-forestGreen/30',
    dot: 'bg-forestGreen',
  },
  warning: {
    wrapper: 'bg-amber-50 text-amber-700 border border-amber-200',
    dot: 'bg-amber-500',
  },
  danger: {
    wrapper: 'bg-coralRed/10 text-coralRed border border-coralRed/30',
    dot: 'bg-coralRed',
  },
  info: {
    wrapper: 'bg-sky-50 text-sky-700 border border-sky-200',
    dot: 'bg-sky-500',
  },
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', dot = false, children, ...props }, ref) => {
    const styles = variantStyles[variant]
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
          styles.wrapper,
          className
        )}
        {...props}
      >
        {dot && (
          <span className={cn('w-1.5 h-1.5 rounded-full', styles.dot)} />
        )}
        {children}
      </div>
    )
  }
)
Badge.displayName = 'Badge'
