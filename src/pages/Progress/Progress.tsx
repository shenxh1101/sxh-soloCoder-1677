import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Workflow,
  Package,
  Filter,
  Search,
  ChevronRight,
  Clock,
  AlertTriangle,
  UserCircle,
  LayoutGrid,
  ListTodo,
  CalendarClock,
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
import { formatDate, daysBetween, isSameDay } from '@/utils/date';
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

const IN_PROGRESS_STATUSES: ProductionStatus[] = [
  'retouching',
  'layout',
  'album_making',
  'shipping',
];

const STANDARD_DURATIONS: Record<string, number> = {
  retouching: 7,
  layout: 5,
  album_making: 5,
  shipping: 3,
};

const ROLE_LABELS: Record<string, string> = {
  consultant: '顾问',
  editor: '修图师',
  service: '客服',
  admin: '管理员',
};

export default function Progress() {
  const navigate = useNavigate();
  const orders = useOrderStore((s) => s.orders);
  const getPaymentSummary = useOrderStore((s) => s.getPaymentSummary);
  const getClient = useClientStore((s) => s.getClient);
  const getUserById = useAuthStore((s) => s.getUserById);
  const users = useAuthStore((s) => s.users);

  const [viewMode, setViewMode] = useState<'board' | 'todo'>('board');

  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [todoSearch, setTodoSearch] = useState('');
  const [todoAssignee, setTodoAssignee] = useState<string>('');
  const [todoOverdueOnly, setTodoOverdueOnly] = useState(false);

  const statusOptions: SelectOption[] = useMemo(() => {
    const options = Object.entries(STATUS_META).map(([value, meta]) => ({
      value,
      label: meta.label,
    }));
    return [{ value: '', label: '全部状态' }, ...options];
  }, []);

  const assigneeOptions: SelectOption[] = useMemo(() => {
    const assignees = users.filter(
      (u) => (u.role === 'consultant' || u.role === 'editor') && u.isActive
    );
    return [
      { value: '', label: '全部负责人' },
      ...assignees.map((u) => ({
        value: u.id,
        label: `${u.name}（${ROLE_LABELS[u.role] || u.role}）`,
      })),
    ];
  }, [users]);

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

  const todoOrderItems = useMemo(() => {
    const inProgress = orders.filter((o) =>
      IN_PROGRESS_STATUSES.includes(o.status)
    );

    return inProgress
      .map((order) => {
        const client = getClient(order.clientId);
        const lastStatusRecord = order.statusHistory.length > 0 ? order.statusHistory[order.statusHistory.length - 1] : null;
        const assigneeId = lastStatusRecord?.operatorId || order.consultantId;
        const assignee = getUserById(assigneeId);

        const startDate = lastStatusRecord ? new Date(lastStatusRecord.updatedAt) : new Date();
        const duration = STANDARD_DURATIONS[order.status as keyof typeof STANDARD_DURATIONS] || 5;
        const dueDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);
        const daysOverdue = Math.floor((new Date().getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
        const isOverdue = daysOverdue > 0;
        const isDueToday = isSameDay(dueDate, new Date());

        const enteredDate = startDate;
        const daysStayed = daysBetween(
          lastStatusRecord?.updatedAt || order.createdAt
        );
        const standardDays = duration;
        const estimatedDate = dueDate;
        const daysRemaining = Math.ceil((dueDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000));

        let dueGroup: 'overdue' | 'today' | 'upcoming';
        if (isOverdue) {
          dueGroup = 'overdue';
        } else if (isDueToday) {
          dueGroup = 'today';
        } else {
          dueGroup = 'upcoming';
        }

        return {
          order,
          client,
          assigneeId,
          assignee,
          enteredDate,
          daysStayed,
          standardDays,
          isOverdue,
          estimatedDate,
          isDueToday,
          dueDate,
          daysOverdue,
          daysRemaining,
          dueGroup,
        };
      })
      .filter((item) => {
        if (todoSearch.trim() && item.client) {
          const kw = todoSearch.trim().toLowerCase();
          if (!item.client.name.toLowerCase().includes(kw)) return false;
        }
        if (todoAssignee && item.assigneeId !== todoAssignee) return false;
        if (todoOverdueOnly && !item.isOverdue) return false;
        return true;
      });
  }, [orders, todoSearch, todoAssignee, todoOverdueOnly, getClient, getUserById]);

  type TodoItem = typeof todoOrderItems[number];
  type GroupedByDate = {
    overdue: TodoItem[];
    today: TodoItem[];
    upcoming: Record<string, TodoItem[]>;
  };
  type GroupedByAssignee = {
    assigneeId: string;
    items: TodoItem[];
    groupedByDate: GroupedByDate;
    counts: { overdue: number; today: number; upcoming: number };
  }[];

  const groupedByAssignee = useMemo<GroupedByAssignee>(() => {
    const groups: Record<string, TodoItem[]> = {};
    for (const item of todoOrderItems) {
      const key = item.assigneeId;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }

    return Object.entries(groups)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([assigneeId, items]) => {
        const groupedByDate: GroupedByDate = {
          overdue: [],
          today: [],
          upcoming: {},
        };

        for (const item of items) {
          if (item.dueGroup === 'overdue') {
            groupedByDate.overdue.push(item);
          } else if (item.dueGroup === 'today') {
            groupedByDate.today.push(item);
          } else {
            const dateKey = formatDate(item.dueDate, 'YYYY-MM-DD');
            if (!groupedByDate.upcoming[dateKey]) {
              groupedByDate.upcoming[dateKey] = [];
            }
            groupedByDate.upcoming[dateKey].push(item);
          }
        }

        groupedByDate.overdue.sort((a, b) => a.daysOverdue - b.daysOverdue);
        groupedByDate.today.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

        const upcomingCount = Object.values(groupedByDate.upcoming).reduce(
          (sum, arr) => sum + arr.length,
          0
        );

        return {
          assigneeId,
          items,
          groupedByDate,
          counts: {
            overdue: groupedByDate.overdue.length,
            today: groupedByDate.today.length,
            upcoming: upcomingCount,
          },
        };
      });
  }, [todoOrderItems]);

  const todoStats = useMemo(() => {
    const allInProgress = orders.filter((o) =>
      IN_PROGRESS_STATUSES.includes(o.status)
    );
    let overdueCount = 0;
    let dueTodayCount = 0;
    for (const order of allInProgress) {
      const lastRecord =
        order.statusHistory[order.statusHistory.length - 1];
      if (!lastRecord) continue;
      const daysStayed = daysBetween(lastRecord.updatedAt);
      const standardDays = STANDARD_DURATIONS[order.status] || 5;
      if (daysStayed > standardDays) overdueCount++;

      const enteredDate = new Date(lastRecord.updatedAt);
      const estimatedDate = new Date(enteredDate);
      estimatedDate.setDate(estimatedDate.getDate() + standardDays);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const estDateOnly = new Date(estimatedDate);
      estDateOnly.setHours(0, 0, 0, 0);
      if (estDateOnly.getTime() === today.getTime()) dueTodayCount++;
    }
    return {
      total: allInProgress.length,
      overdue: overdueCount,
      dueToday: dueTodayCount,
    };
  }, [orders]);

  const getStayColor = (days: number, standard: number) => {
    if (days > standard) return 'text-red-600';
    if (days > standard * 0.6) return 'text-amber-600';
    return 'text-green-600';
  };

  const getStayBg = (days: number, standard: number) => {
    if (days > standard) return 'bg-red-50 border-red-200';
    if (days > standard * 0.6) return 'bg-amber-50 border-amber-200';
    return 'bg-green-50 border-green-200';
  };

  return (
    <div className="space-y-6 min-h-full">
      <motion.div variants={staggerContainer} initial="hidden" animate="show">
        <motion.div variants={fadeInUp} className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-darkGray flex items-center gap-3">
              <Workflow className="w-7 h-7 text-roseGold" />
              制作进度
            </h1>
            <div className="flex items-center bg-warmPink/20 rounded-xl p-1">
              <button
                onClick={() => setViewMode('board')}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  viewMode === 'board'
                    ? 'bg-white text-roseGold shadow-sm'
                    : 'text-gray-500 hover:text-darkGray'
                )}
              >
                <LayoutGrid className="w-4 h-4" />
                看板视图
              </button>
              <button
                onClick={() => setViewMode('todo')}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  viewMode === 'todo'
                    ? 'bg-white text-roseGold shadow-sm'
                    : 'text-gray-500 hover:text-darkGray'
                )}
              >
                <ListTodo className="w-4 h-4" />
                待办视图
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {viewMode === 'board'
              ? '跟踪所有订单的生产制作进度'
              : '按负责人和预计完成时间分组查看进行中订单'}
          </p>
        </motion.div>

        {viewMode === 'board' ? (
          <>
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
                    const unpaid = getPaymentSummary(order.id).unpaid;
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
                                  {unpaid > 0 && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-coralRed/15 text-coralRed font-medium">
                                      未收 ¥{unpaid}
                                    </span>
                                  )}
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
          </>
        ) : (
          <>
            <motion.div variants={fadeInUp}>
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder="按客户姓名搜索..."
                        value={todoSearch}
                        onChange={(e) => setTodoSearch(e.target.value)}
                        prefixIcon={<Search className="w-4 h-4" />}
                      />
                    </div>
                    <div className="w-full md:w-48">
                      <Select
                        options={assigneeOptions}
                        value={todoAssignee}
                        onChange={setTodoAssignee}
                        placeholder="筛选负责人"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setTodoOverdueOnly(false)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                          !todoOverdueOnly
                            ? 'bg-roseGold/15 text-roseGold border border-roseGold/30'
                            : 'text-gray-500 hover:text-darkGray border border-transparent'
                        )}
                      >
                        显示全部
                      </button>
                      <button
                        onClick={() => setTodoOverdueOnly(true)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                          todoOverdueOnly
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'text-gray-500 hover:text-darkGray border border-transparent'
                        )}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                        仅超期
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span>
                      进行中 <strong className="text-darkGray">{todoStats.total}</strong> 单
                    </span>
                    <span className="text-red-500">
                      超期 <strong>{todoStats.overdue}</strong> 单
                    </span>
                    <span className="text-amber-600">
                      今日到期 <strong>{todoStats.dueToday}</strong> 单
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {groupedByAssignee.length === 0 ? (
              <motion.div
                variants={fadeInUp}
                className="flex flex-col items-center justify-center py-20"
              >
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-warmPink/50 to-champagne/30 flex items-center justify-center mb-6">
                  <ListTodo className="w-14 h-14 text-roseGold/50" />
                </div>
                <h3 className="text-xl font-semibold text-darkGray mb-2">暂无待办</h3>
                <p className="text-gray-500">没有进行中的订单</p>
              </motion.div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="space-y-6"
              >
                {groupedByAssignee.map(({ assigneeId, items, groupedByDate, counts }) => {
                  const assignee = getUserById(assigneeId);
                  if (!assignee) return null;

                  const renderOrderCard = (item: TodoItem) => {
                    const {
                      order,
                      client,
                      daysStayed,
                      standardDays,
                      isOverdue,
                      estimatedDate,
                      enteredDate,
                      daysOverdue,
                      daysRemaining,
                      dueGroup,
                    } = item;

                    const unpaid = getPaymentSummary(order.id).unpaid;

                    let borderClass = '';
                    let badgeLabel = '';
                    let badgeClass = '';

                    if (dueGroup === 'overdue') {
                      borderClass = 'border-l-4 border-coralRed';
                      badgeLabel = `超期${daysOverdue}天`;
                      badgeClass = 'bg-red-100 text-red-600';
                    } else if (dueGroup === 'today') {
                      borderClass = 'border-l-4 border-champagne';
                      badgeLabel = '今日到期';
                      badgeClass = 'bg-amber-100 text-amber-700';
                    } else {
                      borderClass = 'border-l-4 border-forestGreen';
                      badgeLabel = `还剩${daysRemaining}天`;
                      badgeClass = 'bg-green-100 text-green-700';
                    }

                    return (
                      <div
                        key={order.id}
                        className={cn(
                          'relative flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border transition-all bg-white',
                          borderClass,
                          isOverdue ? 'border-red-200/60' : 'border-warmPink/20'
                        )}
                      >
                        <div className="absolute top-3 right-3">
                          <span className={cn(
                            'px-2 py-0.5 rounded-md text-xs font-medium',
                            badgeClass
                          )}>
                            {badgeLabel}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 pr-16">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-base font-bold text-darkGray truncate">
                              {client?.name || '未知客户'}
                            </span>
                            {client?.partnerName && (
                              <span className="text-sm text-gray-400">
                                & {client.partnerName}
                              </span>
                            )}
                            <span className="text-xs text-gray-400 truncate">
                              {order.packageName}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <StatusBadge status={order.status} size="sm" />
                            {unpaid > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded bg-coralRed/15 text-coralRed font-medium">
                                未收 ¥{unpaid}
                              </span>
                            )}
                            <span className="text-gray-400">
                              进入状态：{formatDate(enteredDate, 'short')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div
                            className={cn(
                              'flex items-center gap-1 px-2.5 py-1 rounded-lg border text-sm font-medium',
                              getStayBg(daysStayed, standardDays),
                              getStayColor(daysStayed, standardDays)
                            )}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            {daysStayed}天
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <CalendarClock className="w-3.5 h-3.5" />
                            {formatDate(estimatedDate, 'short')}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const clientExists = getClient(order.clientId);
                              if (clientExists) {
                                navigate(`/clients/${order.clientId}`);
                              }
                            }}
                          >
                            查看详情
                          </Button>
                        </div>
                      </div>
                    );
                  };

                  const sortedUpcomingDates = Object.keys(groupedByDate.upcoming).sort();

                  return (
                    <motion.div key={assigneeId} variants={fadeInUp}>
                      <Card>
                        <div className="p-5 border-b border-warmPink/20">
                          <div className="flex items-center gap-3">
                            {assignee.avatar ? (
                              <img
                                src={assignee.avatar}
                                alt={assignee.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-roseGold/30"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-roseGold/30 to-champagne/30 flex items-center justify-center">
                                <UserCircle className="w-6 h-6 text-roseGold" />
                              </div>
                            )}
                            <div>
                              <h3 className="text-lg font-bold text-darkGray">
                                {assignee.name}
                              </h3>
                              <span className="text-xs text-gray-500">
                                {ROLE_LABELS[assignee.role] || assignee.role} ·
                                负责 {items.length} 单
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="p-5 space-y-5">
                          {counts.overdue > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-coralRed mb-3 flex items-center gap-2">
                                🔴 已超期 <span className="text-gray-400 font-normal">({counts.overdue}单)</span>
                              </h4>
                              <div className="space-y-3">
                                {groupedByDate.overdue.map(renderOrderCard)}
                              </div>
                            </div>
                          )}

                          {counts.today > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-champagne mb-3 flex items-center gap-2">
                                🟠 今日到期 <span className="text-gray-400 font-normal">({counts.today}单)</span>
                              </h4>
                              <div className="space-y-3">
                                {groupedByDate.today.map(renderOrderCard)}
                              </div>
                            </div>
                          )}

                          {counts.upcoming > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-forestGreen mb-3 flex items-center gap-2">
                                🟢 后续日期 <span className="text-gray-400 font-normal">({counts.upcoming}单)</span>
                              </h4>
                              <div className="space-y-4">
                                {sortedUpcomingDates.map((dateKey) => (
                                  <div key={dateKey}>
                                    <h5 className="text-xs text-gray-500 mb-2 font-medium">
                                      {formatDate(dateKey, 'date')}
                                    </h5>
                                    <div className="space-y-3">
                                      {groupedByDate.upcoming[dateKey].map(renderOrderCard)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
