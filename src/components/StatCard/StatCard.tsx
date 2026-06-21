import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatCardVariant = 'roseGold' | 'champagne' | 'forestGreen' | 'coralRed';

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: number;
  subtitle: string;
  trend?: number;
  variant?: StatCardVariant;
  suffix?: string;
  prefix?: string;
  className?: string;
}

const variantStyles: Record<
  StatCardVariant,
  {
    gradient: string;
    iconBg: string;
    iconColor: string;
    accent: string;
    pattern: string;
  }
> = {
  roseGold: {
    gradient: 'from-roseGold/15 via-champagne/10 to-roseGold/5',
    iconBg: 'from-roseGold to-champagne',
    iconColor: 'text-white',
    accent: 'text-roseGold',
    pattern: 'bg-[radial-gradient(circle_at_top_right,_rgba(212,165,116,0.15),_transparent_50%)]',
  },
  champagne: {
    gradient: 'from-champagne/20 via-warmPink/10 to-champagne/5',
    iconBg: 'from-champagne to-roseGold/80',
    iconColor: 'text-white',
    accent: 'text-amber-700',
    pattern: 'bg-[radial-gradient(circle_at_top_right,_rgba(232,201,155,0.2),_transparent_50%)]',
  },
  forestGreen: {
    gradient: 'from-forestGreen/15 via-emerald-50/50 to-forestGreen/5',
    iconBg: 'from-forestGreen to-emerald-600',
    iconColor: 'text-white',
    accent: 'text-forestGreen',
    pattern: 'bg-[radial-gradient(circle_at_top_right,_rgba(74,124,89,0.15),_transparent_50%)]',
  },
  coralRed: {
    gradient: 'from-coralRed/15 via-rose-50/50 to-coralRed/5',
    iconBg: 'from-coralRed to-rose-500',
    iconColor: 'text-white',
    accent: 'text-coralRed',
    pattern: 'bg-[radial-gradient(circle_at_top_right,_rgba(224,122,95,0.15),_transparent_50%)]',
  },
};

function useCountUp(target: number, start: boolean, duration = 1500) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let startTime: number | null = null;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(startValue + (target - startValue) * easeOutQuart));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    requestAnimationFrame(animate);
  }, [target, start, duration]);

  return count;
}

function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1).replace(/\.0$/, '') + 'w';
  }
  return num.toLocaleString('zh-CN');
}

export default function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  trend,
  variant = 'roseGold',
  suffix = '',
  prefix = '',
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: '-50px' });
  const displayValue = useCountUp(value, isInView);

  const trendPositive = trend !== undefined && trend >= 0;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      whileHover={{ y: -6, scale: 1.01 }}
      className={cn(
        'relative overflow-hidden rounded-3xl p-6 bg-white shadow-lg',
        'border border-white/60 backdrop-blur-sm',
        'transition-all duration-500 ease-out',
        'hover:shadow-2xl hover:shadow-black/5',
        styles.pattern,
        className
      )}
    >
      <div
        className={cn(
          'absolute inset-0 opacity-60 bg-gradient-to-br',
          styles.gradient
        )}
      />

      <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full opacity-20 blur-3xl bg-gradient-to-br from-white/50 to-transparent pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 mb-4"
          >
            <span
              className={cn(
                'inline-flex items-center justify-center w-12 h-12 rounded-2xl',
                'bg-gradient-to-br shadow-lg',
                styles.iconBg
              )}
            >
              <Icon className={cn('w-6 h-6', styles.iconColor)} />
            </span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.15 }}
            className="text-sm text-gray-500 font-medium mb-2"
          >
            {title}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex items-baseline gap-1 mb-3"
          >
            {prefix && (
              <span
                className={cn(
                  'text-2xl font-semibold',
                  styles.accent
                )}
              >
                {prefix}
              </span>
            )}
            <span
              className={cn(
                'text-4xl lg:text-5xl font-bold tracking-tight font-noto-serif-sc',
                styles.accent
              )}
            >
              {formatNumber(displayValue)}
            </span>
            {suffix && (
              <span className="text-lg text-gray-500 font-medium ml-1">
                {suffix}
              </span>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3"
          >
            <p className="text-sm text-gray-500">{subtitle}</p>
            {trend !== undefined && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.4, type: 'spring' }}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
                  trendPositive
                    ? 'bg-forestGreen/10 text-forestGreen'
                    : 'bg-coralRed/10 text-coralRed'
                )}
              >
                {trendPositive ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {Math.abs(trend)}%
              </motion.span>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 0.08, scale: 1 } : {}}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="shrink-0"
        >
          <Icon
            className={cn(
              'w-28 h-28 opacity-80',
              styles.accent
            )}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
