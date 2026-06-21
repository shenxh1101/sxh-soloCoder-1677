import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Workflow,
  Package,
  Filter,
  Search,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import StatusTimeline from '@/components/StatusTimeline/StatusTimeline';
import { useOrderStore } from '@/store/useOrderStore';
import { useClientStore } from '@/store/useClientStore';
import { useAuthStore } from '@/store/useAuthStore';
import { STATUS_META } from '@/mock/seed';
import { formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';
import type { ProductionStatus } from '@/types';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function Progress() {
  const orders = useOrderStore((s) => s.orders);
  const getClient = useClientStore((s) => s.getClient);
  const getUserById = useAuthStore((s) => s.getUserById);

  const statusOptions: SelectOption[] = useMemo(() => {
    const options = Object.entries(STATUS_META).map(([value, meta]) => ({
      value,
      label: meta.label,
    }));
    return [{ value: '', label: '全部状态' }, ...options];
  }, []);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const client = getClient(order.clientId);
      if (searchKeyword.trim() && client) {
        const kw = searchKeyword.trim().toLowerCase();
        if (
          !client.name.toLowerCase().includes(kw) &&
          !client.partnerName.toLowerCase().includes(kw) &&
          !order.packageName.toLowerCase().includes(kw)
        ) {
          return false;
        }
      }
      if (statusFilter && order.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [orders, searchKeyword, statusFilter, getClient]);

  const statusCounts = useMemo(() => {
    const counts: Record<ProductionStatus, number> = {
      pending_photos: 0,
      pending_selection: 0,
      retouching: 0,
      layout: 0,
      album_making: 0,
      shipping: 0,
      completed: 0,
    };
    for (const order of orders) {
      counts[order.status]++;
    }
    return counts;
  }, [orders]);

  return (
    <div className="space-y-6 min-h-full">
      <motion.div variants={staggerContainer} initial="hidden" animate="show">
        <motion.div variants={fadeInUp} className="mb-6">
          <h1 className="text-2xl font-bold text-darkGray flex items-center gap-3">
            <Workflow className="w-7 h-7 text-roseGold" />
            制作进度
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            跟踪所有订单的生产制作进度
          </p>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="搜索客户姓名、套餐名称..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    prefixIcon={<Search className="w-4 h-4" />}
                  />
                </div>
                <div className="w-full md:w-48">
                  <Select
                    options={statusOptions}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    placeholder="筛选状态"
                  />
                </div>
                {(searchKeyword || statusFilter) && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearchKeyword('');
                      setStatusFilter('');
                    }}
                  >
                    <Filter className="w-4 h-4" />
                    清除
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp} className="mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {Object.entries(STATUS_META).map(([status, meta]) => {
              const count = statusCounts[status as ProductionStatus];
              const isActive = statusFilter === status;
              return (
                <motion.button
                  key={status}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    setStatusFilter(isActive ? '' : status)
                  }
                  className={cn(
                    'p-4 rounded-2xl border transition-all duration-300 text-left',
                    isActive
                      ? 'bg-gradient-to-br from-roseGold/20 to-champagne/20 border-roseGold/40 shadow-md'
                      : 'bg-white border-warmPink/30 hover:border-roseGold/30'
                  )}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                    style={{ backgroundColor: meta.bgColor }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                  </div>
                  <p className="text-2xl font-bold text-darkGray">{count}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    {meta.label}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        <motion.div variants={staggerContainer} initial="hidden" animate="show">
          {filteredOrders.length === 0 ? (
            <motion.div
              variants={fadeInUp}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-warmPink/50 to-champagne/30 flex items-center justify-center mb-6">
                <Package className="w-14 h-14 text-roseGold/50" />
              </div>
              <h3 className="text-xl font-semibold text-darkGray mb-2">暂无订单</h3>
              <p className="text-gray-500">没有找到匹配的订单记录</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order, idx) => {
                const client = getClient(order.clientId);
                const consultant = getUserById(order.consultantId);
                return (
                  <motion.div key={order.id} variants={fadeInUp} custom={idx}>
                    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
                      <div className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              <h3 className="text-lg font-bold text-darkGray">
                                {client
                                  ? `${client.name} & ${client.partnerName}`
                                  : '未知客户'}
                              </h3>
                              <StatusBadge status={order.status} size="md" />
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Package className="w-4 h-4 text-roseGold/60 shrink-0" />
                                <span className="truncate">{order.packageName}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Clock className="w-4 h-4 text-champagne shrink-0" />
                                <span>拍摄：{formatDate(order.shootDate, 'short')}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <ChevronRight className="w-4 h-4 text-forestGreen shrink-0" />
                                <span>顾问：{consultant?.name || '未分配'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-5 pt-5 border-t border-warmPink/30">
                          <StatusTimeline statusHistory={order.statusHistory} />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
