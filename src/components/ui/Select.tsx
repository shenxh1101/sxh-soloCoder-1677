import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string
  options: SelectOption[]
  placeholder?: string
  error?: string
  onChange?: (value: string) => void
  containerClassName?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      options,
      placeholder,
      error,
      onChange,
      containerClassName,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || React.useId()

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange?.(e.target.value)
    }

    return (
      <div className={cn('flex flex-col gap-1.5 w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
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
          <select
            ref={ref}
            id={selectId}
            onChange={handleChange}
            className={cn(
              'flex-1 w-full appearance-none px-3 py-2.5 text-sm bg-transparent outline-none text-darkGray cursor-pointer',
              !props.value && placeholder ? 'text-darkGray/30' : '',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <span className="absolute right-3 pointer-events-none text-darkGray/40">
            <ChevronDown className="w-4 h-4" />
          </span>
        </div>
        {error && <p className="text-xs text-coralRed mt-0.5">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
