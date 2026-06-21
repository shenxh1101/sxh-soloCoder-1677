import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Star,
  Upload,
  Eye,
  Wand2,
  Truck,
  Plus,
  FolderUp,
  Link2,
  Package,
  User,
} from 'lucide-react';
import StatCard from '@/components/StatCard/StatCard';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useOrderStore } from '@/store/useOrderStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useClientStore } from '@/store/useClientStore';
import type { ProductionStatus } from '@/types';
import { STATUS_META } from '@/mock/seed';

const PRODUCTION_STATUSES: ProductionStatus[] = [
  'pending_photos',
  'pending_selection',
  'retouching',
  'layout',
  'album_making',
  'shipping',
  'completed',
];

interface TimelineItem {
  id: string;
  orderId: string;
  clientName: string;
  status: ProductionStatus;
  updatedAt: string;
  operatorName: string;
  remark?: string;
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function Dashboard() {
  const orders = useOrderStore((s) => s.orders);
  const getUserById = useAuthStore((s) => s.getUserById);
  const getClient = useClientStore((s) => s.getClient);
  const currentUser = useAuthStore((s) => s.currentUser);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const {
    thisMonthOrders,
    inProgressCount,
    completedCount,
    avgSatisfaction,
  } = useMemo(() => {
    const thisMonth = orders.filter((o) => o.createdAt.startsWith(currentMonth));
    const inProgress = orders.filter((o) => o.status !== 'completed');
    const completed = orders.filter((o) => o.status === 'completed');
    const ordersWithSat = orders.filter((o) => o.satisfaction !== undefined);
    const avgSat = ordersWithSat.length > 0
      ? ordersWithSat.reduce((sum, o) => sum + (o.satisfaction || 0), 0) / ordersWithSat.length
      : 0;

    return {
      thisMonthOrders: thisMonth,
      inProgressCount: inProgress.length,
      completedCount: completed.length,
      avgSatisfaction: Math.round(avgSat * 10) / 10,
    };
  }, [orders, currentMonth]);

  const todoStats = useMemo(() => {
    return {
      pendingPhotos: orders.filter((o) => o.status === 'pending_photos').length,
      pendingSelection: orders.filter((o) => o.status === 'pending_selection').length,
      retouching: orders.filter((o) => o.status === 'retouching').length,
      shipping: orders.filter((o) => o.status === 'shipping').length,
    };
  }, [orders]);

  const timeline = useMemo(() => {
    const allHistory: TimelineItem[] = [];

    for (const order of orders) {
      const client = getClient(order.clientId);
      for (const record of order.statusHistory) {
        const operator = getUserById(record.operatorId);
        allHistory.push({
          id: `${order.id}-${record.updatedAt}`,
          orderId: order.id,
          clientName: client ? `${client.name} & ${client.partnerName}` : '未知客户',
          status: record.status,
          updatedAt: record.updatedAt,
          operatorName: operator?.name || '未知操作人',
          remark: record.remark,
        });
      }
    }

    return allHistory
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 20);
  }, [orders, getClient, getUserById]);

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
    const maxCount = Math.max(...Object.values(counts), 1);
    return { counts, maxCount };
  }, [orders]);

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    return `${month}-${day} ${hour}:${minute}`;
  };

  const todoItems = [
    { key: 'pendingPhotos', label: '待上传照片', count: todoStats.pendingPhotos, icon: Upload, color: 'bg-amber-100 text-amber-600' },
    { key: 'pendingSelection', label: '待客户选片', count: todoStats.pendingSelection, icon: Eye, color: 'bg-violet-100 text-violet-600' },
    { key: 'retouching', label: '待精修完成', count: todoStats.retouching, icon: Wand2, color: 'bg-blue-100 text-blue-600' },
    { key: 'shipping', label: '待发货完成', count: todoStats.shipping, icon: Truck, color: 'bg-red-100 text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="flex items-center justify-between"
      >
        <motion.div variants={fadeInUp}>
          <h1 className="text-2xl font-bold font-noto-serif-sc text-darkGray mb-1">
            工作台
          </h1>
          <p className="text-sm text-gray-500">
            欢迎回来，{currentUser?.name || '管理员'}，今天是美好的一天
          </p>
        </motion.div>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        <motion.div variants={fadeInUp}>
          <StatCard
            icon={Calendar}
            title="本月订单"
            value={thisMonthOrders.length}
            subtitle={`${currentMonth} 新增订单总数`}
            variant="roseGold"
            trend={8}
          />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <StatCard
            icon={Clock}
            title="进行中"
            value={inProgressCount}
            subtitle="正在处理的订单数"
            variant="champagne"
            trend={5}
          />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <StatCard
            icon={CheckCircle2}
            title="已完成"
            value={completedCount}
            subtitle="已交付的订单总数"
            variant="forestGreen"
            trend={12}
          />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <StatCard
            icon={Star}
            title="满意度均值"
            value={avgSatisfaction}
            suffix="分"
            subtitle="客户平均满意度评分"
            variant="coralRed"
            prefix=""
          />
        </motion.div>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
      >
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-roseGold" />
                  待办任务
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {todoItems.map((item) => (
                  <motion.div
                    key={item.key}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-warmPink/30 to-white border border-warmPink/50 transition-all duration-300 hover:shadow-md cursor-pointer"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color} shrink-0`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-500 mb-1 truncate">{item.label}</p>
                      <p className="text-2xl font-bold text-darkGray">
                        {item.count}
                        <span className="text-sm font-normal text-gray-400 ml-1">单</span>
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-roseGold" />
                  快速操作
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <motion.button
                  whileHover={{ scale: 1.03, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-roseGold/10 via-champagne/5 to-transparent border border-roseGold/20 hover:border-roseGold/40 transition-all duration-300 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-roseGold to-champagne flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                    <Plus className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-darkGray mb-0.5">新建订单</p>
                    <p className="text-xs text-gray-400">创建新拍摄订单</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-forestGreen/10 via-emerald-50 to-transparent border border-forestGreen/20 hover:border-forestGreen/40 transition-all duration-300 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-forestGreen to-emerald-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                    <FolderUp className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-darkGray mb-0.5">批量上传</p>
                    <p className="text-xs text-gray-400">批量上传原片</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-coralRed/10 via-rose-50 to-transparent border border-coralRed/20 hover:border-coralRed/40 transition-all duration-300 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-coralRed to-rose-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                    <Link2 className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-darkGray mb-0.5">选片链接</p>
                    <p className="text-xs text-gray-400">管理选片链接</p>
                  </div>
                </motion.button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-roseGold" />
                  最近动态
                </CardTitle>
                <span className="text-sm text-gray-400">最近20条状态变更</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-[22px] top-2 bottom-2 w-px bg-gradient-to-b from-roseGold/50 via-champagne/40 to-transparent" />

                <div className="space-y-5">
                  {timeline.map((item, idx) => {
                    const meta = STATUS_META[item.status];
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03, duration: 0.4 }}
                        className="relative flex gap-4 pl-12"
                      >
                        <div
                          className="absolute left-0 top-1 w-11 h-11 rounded-full border-4 border-white shadow-md flex items-center justify-center"
                          style={{ backgroundColor: meta.bgColor }}
                        >
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: meta.color }}
                          />
                        </div>

                        <div className="flex-1 min-w-0 py-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="font-medium text-darkGray truncate">
                              {item.clientName}
                            </span>
                            <StatusBadge status={item.status} size="sm" showIcon={false} />
                          </div>
                          {item.remark && (
                            <p className="text-sm text-gray-500 mb-1.5 line-clamp-1">
                              {item.remark}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                            <span className="inline-flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {item.operatorName}
                            </span>
                            <span>{formatDateTime(item.updatedAt)}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {timeline.length === 0 && (
                    <div className="py-12 text-center text-gray-400">
                      暂无动态记录
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-roseGold" />
                  制作进度概览
                </CardTitle>
                <span className="text-sm text-gray-400">共 {orders.length} 个订单</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {PRODUCTION_STATUSES.map((status, idx) => {
                  const meta = STATUS_META[status];
                  const count = statusCounts.counts[status];
                  const percentage = statusCounts.maxCount > 0
                    ? Math.round((count / statusCounts.maxCount) * 100)
                    : 0;

                  return (
                    <motion.div
                      key={status}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.4 }}
                      className="flex items-center gap-4"
                    >
                      <div className="w-32 shrink-0">
                        <StatusBadge status={status} size="md" showIcon />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="h-8 bg-warmPink/30 rounded-xl overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: 0.3 + idx * 0.05, duration: 0.6, ease: 'easeOut' }}
                            className="h-full rounded-xl relative overflow-hidden"
                            style={{
                              background: `linear-gradient(90deg, ${meta.color}cc, ${meta.color})`,
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer bg-[length:200%_100%]" />
                          </motion.div>
                        </div>
                      </div>

                      <div className="w-20 text-right shrink-0">
                        <span
                          className="text-xl font-bold"
                          style={{ color: meta.color }}
                        >
                          {count}
                        </span>
                        <span className="text-sm text-gray-400 ml-1">单</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
