import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Clock,
  Wand2,
  Layout,
  BookImage,
  Truck,
  CheckCircle2,
  User,
  ChevronDown,
} from 'lucide-react';
import type { ProductionStatus, StatusRecord } from '@/types';
import { STATUS_META } from '@/mock/seed';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';

const ALL_STATUSES: ProductionStatus[] = [
  'pending_photos',
  'pending_selection',
  'retouching',
  'layout',
  'album_making',
  'shipping',
  'completed',
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Upload,
  Clock,
  Wand2,
  Layout,
  BookImage,
  Truck,
  CheckCircle2,
};

interface StatusTimelineProps {
  statusHistory: StatusRecord[];
  className?: string;
}

function RemarkContent({ remark }: { remark: string }) {
  if (remark.includes('【加修】')) {
    const quantityMatch = remark.match(/(\d+)张/);
    const feeMatch = remark.match(/¥(\d+)/);
    const noteMatch = remark.match(/备注：(.+)$/);

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    if (quantityMatch) {
      const idx = remark.indexOf(quantityMatch[0]);
      if (idx > lastIndex) {
        parts.push(remark.slice(lastIndex, idx));
      }
      parts.push(
        <span key="qty" className="text-roseGold font-semibold">
          {quantityMatch[0]}
        </span>
      );
      lastIndex = idx + quantityMatch[0].length;
    }

    if (feeMatch) {
      const idx = remark.indexOf(feeMatch[0], lastIndex);
      if (idx > lastIndex) {
        parts.push(remark.slice(lastIndex, idx));
      }
      parts.push(
        <span key="fee" className="text-roseGold font-semibold">
          {feeMatch[0]}
        </span>
      );
      lastIndex = idx + feeMatch[0].length;
    }

    if (noteMatch) {
      const noteIdx = remark.indexOf('备注：', lastIndex);
      if (noteIdx > lastIndex) {
        parts.push(remark.slice(lastIndex, noteIdx));
      }
      parts.push(
        <span key="note">{remark.slice(noteIdx)}</span>
      );
      lastIndex = remark.length;
    }

    if (lastIndex < remark.length) {
      parts.push(remark.slice(lastIndex));
    }

    return <>{parts}</>;
  }

  return <>{remark}</>;
}

function StatusNode({
  status,
  index,
  statusHistory,
  currentIdx,
}: {
  status: ProductionStatus;
  index: number;
  statusHistory: StatusRecord[];
  currentIdx: number;
}) {
  const { getUserById } = useAuthStore();
  const [expanded, setExpanded] = useState(false);

  const meta = STATUS_META[status];
  const Icon = iconMap[meta.icon] || Clock;

  const records = statusHistory
    .filter((r) => r.status === status)
    .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
  const latestRecord = records[records.length - 1];
  const hasMultiple = records.length > 1;
  const displayRecords =
    hasMultiple && expanded ? records : latestRecord ? [latestRecord] : [];

  const isCompleted = index < currentIdx;
  const isCurrent = index === currentIdx;
  const isPending = index > currentIdx;

  return (
    <motion.div
      key={status}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={cn(
        'relative flex items-start gap-4 pl-12 pr-4 py-3 rounded-2xl transition-all duration-300',
        isCurrent && 'bg-roseGold/5 ring-1 ring-roseGold/20',
        isCompleted && 'hover:bg-forestGreen/5'
      )}
    >
      <div className="absolute left-3 top-1/2 -translate-y-1/2">
        <div
          className={cn(
            'relative w-[42px] h-[42px] rounded-full flex items-center justify-center transition-all duration-500',
            isCompleted &&
              'bg-gradient-to-br from-forestGreen to-forestGreen/70 text-white shadow-lg shadow-forestGreen/30',
            isCurrent &&
              'bg-gradient-to-br from-roseGold to-champagne text-white shadow-xl shadow-roseGold/40',
            isPending &&
              'bg-gray-100 text-gray-400 border-2 border-dashed border-gray-200'
          )}
        >
          {isCurrent && (
            <>
              <motion.div
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.6, 0, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 rounded-full bg-roseGold/50"
              />
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 0, 0.4],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5,
                }}
                className="absolute inset-0 rounded-full bg-champagne/50"
              />
            </>
          )}
          <motion.div
            whileHover={{ rotate: isCurrent ? 10 : 0, scale: 1.1 }}
            className="relative z-10"
          >
            <Icon
              className={cn(
                'w-5 h-5 transition-all duration-300',
                isCompleted || isCurrent ? 'drop-shadow-sm' : ''
              )}
            />
          </motion.div>
        </div>
      </div>

      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h4
            className={cn(
              'text-base font-semibold transition-colors duration-300',
              isCompleted && 'text-forestGreen',
              isCurrent && 'text-roseGold',
              isPending && 'text-gray-400'
            )}
          >
            {meta.label}
          </h4>
          {isCurrent && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-roseGold/15 text-roseGold"
            >
              进行中
            </motion.span>
          )}
          {isCompleted && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-forestGreen/15 text-forestGreen"
            >
              已完成
            </motion.span>
          )}
        </div>

        {displayRecords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3, delay: index * 0.08 + 0.2 }}
            className="mt-2 space-y-2"
          >
            {displayRecords.map((record, recordIdx) => {
              const operator = getUserById(record.operatorId);
              return (
                <div key={`${record.updatedAt}-${recordIdx}`}>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(record.updatedAt, 'datetime')}
                    </span>
                    {operator && (
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <User className="w-3.5 h-3.5" />
                        {operator.name}
                      </span>
                    )}
                  </div>
                  {record.remark && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.08 + 0.3 }}
                      className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2 mt-2 border-l-2 border-roseGold/30"
                    >
                      <RemarkContent remark={record.remark} />
                    </motion.p>
                  )}
                </div>
              );
            })}

            {hasMultiple && !expanded && (
              <button
                onClick={() => setExpanded(true)}
                className="flex items-center gap-1 text-xs text-roseGold hover:text-roseGold/80 transition-colors mt-1"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                还有{records.length - 1}条记录
              </button>
            )}

            {hasMultiple && expanded && (
              <button
                onClick={() => setExpanded(false)}
                className="flex items-center gap-1 text-xs text-roseGold hover:text-roseGold/80 transition-colors mt-1"
              >
                <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                收起记录
              </button>
            )}
          </motion.div>
        )}

        {isPending && (
          <p className="mt-1 text-sm text-gray-400">
            等待上一步完成后自动进入此阶段
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function StatusTimeline({
  statusHistory,
  className,
}: StatusTimelineProps) {
  const currentStatus =
    statusHistory.length > 0
      ? statusHistory[statusHistory.length - 1].status
      : 'pending_photos';
  const currentIdx = ALL_STATUSES.indexOf(currentStatus);

  return (
    <div className={cn('relative py-4', className)}>
      <div className="absolute left-[22px] top-6 bottom-6 w-0.5 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ height: 0 }}
          animate={{
            height:
              currentIdx >= 0
                ? `${(currentIdx / (ALL_STATUSES.length - 1)) * 100}%`
                : 0,
          }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          className="absolute top-0 left-0 w-full bg-gradient-to-b from-forestGreen via-forestGreen/80 to-roseGold rounded-full"
        />
      </div>

      <div className="space-y-2">
        {ALL_STATUSES.map((status, index) => (
          <StatusNode
            key={status}
            status={status}
            index={index}
            statusHistory={statusHistory}
            currentIdx={currentIdx}
          />
        ))}
      </div>
    </div>
  );
}
