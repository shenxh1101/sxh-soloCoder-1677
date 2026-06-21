import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string
  error?: string
  prefixIcon?: React.ReactNode
  suffixIcon?: React.ReactNode
  containerClassName?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      prefixIcon,
      suffixIcon,
      containerClassName,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId()

    return (
      <div className={cn('flex flex-col gap-1.5 w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-darkGray/80"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            'relative flex items-center w-full rounded-xl border transition-all duration-200 bg-white',
            error
              ? 'border-coralRed focus-within:ring-2 focus-within:ring-coralRed/30'
              : 'border-warmPink/50 hover:border-roseGold/50 focus-within:border-roseGold focus-within:ring-2 focus-within:ring-roseGold/30'
          )}
        >
          {prefixIcon && (
            <span className="pl-3 text-darkGray/40 flex-shrink-0">
              {prefixIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'flex-1 w-full px-3 py-2.5 text-sm bg-transparent outline-none placeholder:text-darkGray/30 text-darkGray',
              prefixIcon ? 'pl-2' : '',
              suffixIcon ? 'pr-2' : '',
              className
            )}
            {...props}
          />
          {suffixIcon && (
            <span className="pr-3 text-darkGray/40 flex-shrink-0">
              {suffixIcon}
            </span>
          )}
        </div>
        {error && (
          <p className="text-xs text-coralRed mt-0.5">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
