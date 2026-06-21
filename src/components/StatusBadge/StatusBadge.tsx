import { motion } from 'framer-motion';
import {
  Upload,
  Clock,
  Wand2,
  Layout,
  BookImage,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import type { ProductionStatus } from '@/types';
import { STATUS_META } from '@/mock/seed';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Upload,
  Clock,
  Wand2,
  Layout,
  BookImage,
  Truck,
  CheckCircle2,
};

interface StatusBadgeProps {
  status: ProductionStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export default function StatusBadge({
  status,
  size = 'md',
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const meta = STATUS_META[status];
  const Icon = iconMap[meta.icon] || Clock;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.05, y: -1 }}
      className={cn(
        'inline-flex items-center rounded-xl font-medium shadow-sm',
        'border backdrop-blur-sm transition-all duration-300',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: meta.bgColor,
        borderColor: `${meta.color}30`,
        color: meta.color,
      }}
    >
      {showIcon && (
        <motion.div
          animate={{ rotate: status === 'pending_photos' ? [0, 10, -10, 0] : 0 }}
          transition={{
            duration: 2,
            repeat: status === 'pending_photos' ? Infinity : 0,
            repeatType: 'loop',
          }}
        >
          <Icon className={cn(iconSizes[size], 'shrink-0')} />
        </motion.div>
      )}
      <span className="whitespace-nowrap">{meta.label}</span>
    </motion.span>
  );
}
