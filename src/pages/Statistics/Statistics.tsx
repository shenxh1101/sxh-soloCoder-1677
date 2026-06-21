import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Image as ImageIcon,
  Sparkles,
  Star,
  Users,
  Trophy,
  TrendingUp,
  Calendar,
  Crown,
  Medal,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import StatCard from '@/components/StatCard/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select, SelectOption } from '@/components/ui/Select';
import { useStatsStore } from '@/store/useStatsStore';
import { useOrderStore } from '@/store/useOrderStore';
import { cn } from '@/lib/utils';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const SATISFACTION_COLORS = ['#D4A574', '#E8C99B', '#F8E8E0', '#E07A5F', '#D97706'];

function renderStars(rating: number) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const stars = [];
  for (let i = 0; i < 5; i++) {
    const filled = i < fullStars || (i === fullStars && hasHalf);
    stars.push(
      <Star
        key={i}
        className={cn(
          'w-4 h-4',
          filled ? 'text-roseGold fill-roseGold' : 'text-gray-300'
        )}
      />
    );
  }
  return <div className="flex gap-0.5">{stars}</div>;
}

export default function Statistics() {
  const monthlyStats = useStatsStore((s) => s.monthlyStats);
  const getMonthlyTrend = useStatsStore((s) => s.getMonthlyTrend);
  const getConsultantRanking = useStatsStore((s) => s.getConsultantRanking);
  const getSatisfactionDistribution = useStatsStore((s) => s.getSatisfactionDistribution);
  const orders = useOrderStore((s) => s.orders);

  const allMonths = useMemo(() => {
    const months = new Set(monthlyStats.map((s) => s.month));
    return Array.from(months).sort();
  }, [monthlyStats]);

  const monthOptions: SelectOption[] = useMemo(() => {
    return [
      { value: '', label: '全部月份' },
      ...allMonths.map((m) => ({
        value: m,
        label: m.replace('-', '年') + '月',
      })),
    ];
  }, [allMonths]);

  const consultantOptions: SelectOption[] = useMemo(() => {
    const consultantMap = new Map<string, string>();
    monthlyStats.forEach((s) => {
      consultantMap.set(s.consultantId, s.consultantName);
    });
    return [
      { value: '', label: '全部顾问' },
      ...Array.from(consultantMap.entries()).map(([id, name]) => ({
        value: id,
        label: name,
      })),
    ];
  }, [monthlyStats]);

  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedConsultant, setSelectedConsultant] = useState('');

  const filteredMonthlyStats = useMemo(() => {
    return monthlyStats.filter((s) => {
      if (selectedMonth && s.month !== selectedMonth) return false;
      if (selectedConsultant && s.consultantId !== selectedConsultant) return false;
      return true;
    });
  }, [monthlyStats, selectedMonth, selectedConsultant]);

  const monthStatsTotals = useMemo(() => {
    const monthAgg: Record<string, {
      month: string;
      orderCount: number;
      completedPhotos: number;
      retouchedPhotos: number;
      satisfactionSum: number;
      satisfactionCount: number;
      consultantCount: number;
    }> = {};

    for (const s of filteredMonthlyStats) {
      if (!monthAgg[s.month]) {
        monthAgg[s.month] = {
          month: s.month,
          orderCount: 0,
          completedPhotos: 0,
          retouchedPhotos: 0,
          satisfactionSum: 0,
          satisfactionCount: 0,
          consultantCount: 0,
        };
      }
      const agg = monthAgg[s.month];
      agg.orderCount += s.orderCount;
      agg.completedPhotos += s.completedPhotos;
      agg.retouchedPhotos += s.retouchedPhotos;
      agg.satisfactionSum += s.satisfaction;
      agg.satisfactionCount += 1;
      agg.consultantCount += 1;
    }

    const months = Object.keys(monthAgg).sort();
    return months.map((m) => {
      const agg = monthAgg[m];
      return {
        ...agg,
        avgSatisfaction: agg.satisfactionCount > 0
          ? Math.round((agg.satisfactionSum / agg.satisfactionCount) * 10) / 10
          : 0,
        avgOutput: agg.consultantCount > 0
          ? Math.round(agg.completedPhotos / agg.consultantCount)
          : 0,
      };
    });
  }, [filteredMonthlyStats]);

  const summaryStats = useMemo(() => {
    const targetMonth = selectedMonth || allMonths[allMonths.length - 1] || '';
    const monthData = filteredMonthlyStats.filter((s) => s.month === targetMonth);

    let totalPhotos = 0;
    let totalRetouch = 0;
    let satSum = 0;
    let satCount = 0;

    for (const s of monthData) {
      totalPhotos += s.completedPhotos;
      totalRetouch += s.retouchedPhotos;
      satSum += s.satisfaction;
      satCount += 1;
    }

    const avgSat = satCount > 0 ? Math.round((satSum / satCount) * 10) / 10 : 0;

    let servedClients = 0;
    if (targetMonth) {
      const [year, month] = targetMonth.split('-').map(Number);
      servedClients = orders.filter((o) => {
        const d = new Date(o.shootDate);
        return d.getFullYear() === year && d.getMonth() === month - 1;
      }).length;
    } else {
      servedClients = orders.length;
    }

    return { totalPhotos, totalRetouch, avgSat, servedClients, targetMonth };
  }, [selectedMonth, filteredMonthlyStats, allMonths, orders]);

  const trendData = useMemo(() => {
    const trend = getMonthlyTrend();
    const filtered = trend;

    const result: {
      month: string;
      成片数: number;
      精修张数: number;
    }[] = [];

    if (selectedConsultant) {
      for (const t of filtered) {
        const monthConsultantStats = monthlyStats.filter(
          (s) => s.month === t.month && s.consultantId === selectedConsultant
        );
        if (monthConsultantStats.length > 0) {
          let photos = 0;
          let retouch = 0;
          for (const s of monthConsultantStats) {
            photos += s.completedPhotos;
            retouch += s.retouchedPhotos;
          }
          result.push({
            month: t.month.replace('2026-', ''),
            成片数: photos,
            精修张数: retouch,
          });
        }
      }
    } else {
      for (const t of filtered.slice(0, 6)) {
        result.push({
          month: t.month.replace('2026-', ''),
          成片数: t.totalPhotos,
          精修张数: t.totalRetouched,
        });
      }
    }
    return result;
  }, [getMonthlyTrend, selectedConsultant, monthlyStats]);

  const consultantRanking = useMemo(() => {
    const ranking = getConsultantRanking(selectedMonth || undefined);
    if (selectedConsultant) {
      return ranking.filter((c) => c.consultantId === selectedConsultant);
    }
    return ranking;
  }, [getConsultantRanking, selectedMonth, selectedConsultant]);

  const satisfactionDist = useMemo(() => {
    const dist = getSatisfactionDistribution();
    let total = 0;
    let weightedSum = 0;
    const ratings = [5, 4, 3, 2, 1];
    const entries = Object.entries(dist);

    for (let i = 0; i < entries.length; i++) {
      const [, count] = entries[i];
      total += count;
      weightedSum += ratings[i] * count;
    }

    const avgScore = total > 0 ? Math.round((weightedSum / total) * 10) / 10 : 0;

    return entries.map(([label, count], idx) => ({
      name: label,
      value: count,
      color: SATISFACTION_COLORS[idx],
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
      avgScore,
    }));
  }, [getSatisfactionDistribution]);

  const avgSatisfactionScore = satisfactionDist.length > 0
    ? satisfactionDist[0].avgScore
    : 0;

  const totalRow = useMemo(() => {
    let totalOrders = 0;
    let totalPhotos = 0;
    let totalRetouch = 0;
    let totalOutput = 0;
    let satSum = 0;
    for (const m of monthStatsTotals) {
      totalOrders += m.orderCount;
      totalPhotos += m.completedPhotos;
      totalRetouch += m.retouchedPhotos;
      totalOutput += m.avgOutput;
      satSum += m.avgSatisfaction;
    }
    const avgSat = monthStatsTotals.length > 0
      ? Math.round((satSum / monthStatsTotals.length) * 10) / 10
      : 0;
    const avgOutputPer = monthStatsTotals.length > 0
      ? Math.round(totalOutput / monthStatsTotals.length)
      : 0;
    return { totalOrders, totalPhotos, totalRetouch, avgOutputPer, avgSat };
  }, [monthStatsTotals]);

  const formatMonthLabel = (m: string) => {
    const [y, mo] = m.split('-');
    return `${y}年${parseInt(mo, 10)}月`;
  };

  return (
    <div className="space-y-6 min-h-full">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeInUp} className="mb-6">
          <h1 className="text-2xl font-bold text-darkGray flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-roseGold" />
            数据统计中心
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            业绩统计与数据分析，洞察业务运营状况
          </p>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                <div className="w-full md:w-56">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-darkGray/40 z-10 pointer-events-none">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <Select
                      options={monthOptions}
                      value={selectedMonth}
                      onChange={setSelectedMonth}
                      placeholder="选择月份"
                      className="!pl-9"
                    />
                  </div>
                </div>
                <div className="w-full md:w-56">
                  <Select
                    options={consultantOptions}
                    value={selectedConsultant}
                    onChange={setSelectedConsultant}
                    placeholder="全部顾问"
                  />
                </div>
                {(selectedMonth || selectedConsultant) && (
                  <button
                    onClick={() => {
                      setSelectedMonth('');
                      setSelectedConsultant('');
                    }}
                    className="inline-flex items-center px-4 py-2 text-sm text-roseGold hover:text-roseGold/80 font-medium transition-colors"
                  >
                    重置筛选
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6"
        >
          <motion.div variants={fadeInUp}>
            <StatCard
              icon={ImageIcon}
              title="本月成片总数"
              value={summaryStats.totalPhotos}
              suffix="张"
              subtitle={summaryStats.targetMonth ? formatMonthLabel(summaryStats.targetMonth) : '累计统计'}
              variant="roseGold"
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <StatCard
              icon={Sparkles}
              title="精修总张数"
              value={summaryStats.totalRetouch}
              suffix="张"
              subtitle="精修照片统计"
              variant="champagne"
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <StatCard
              icon={Star}
              title="平均满意度"
              value={summaryStats.avgSat}
              suffix="分"
              subtitle="客户综合评价"
              variant="forestGreen"
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <StatCard
              icon={Users}
              title="服务客户数"
              value={summaryStats.servedClients}
              suffix="对"
              subtitle="拍摄客户统计"
              variant="coralRed"
            />
          </motion.div>
        </motion.div>

        <motion.div variants={fadeInUp} className="mb-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-roseGold" />
                月度趋势图
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPhotos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4A574" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#D4A574" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="colorRetouch" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4A7C59" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4A7C59" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F5E6D3" vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${parseInt(v, 10)}月`}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFF',
                        border: '1px solid #F5E6D3',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      }}
                      labelStyle={{ color: '#2D2D2D', fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="成片数"
                      stroke="#D4A574"
                      strokeWidth={3}
                      fill="url(#colorPhotos)"
                      activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="精修张数"
                      stroke="#4A7C59"
                      strokeWidth={3}
                      fill="url(#colorRetouch)"
                      activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <motion.div variants={fadeInUp}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-roseGold" />
                  摄影顾问业绩排行榜
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-warmPink/30">
                        <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          排名
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          顾问姓名
                        </th>
                        <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          订单数
                        </th>
                        <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          成片张数
                        </th>
                        <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          精修张数
                        </th>
                        <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          满意度
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {consultantRanking.map((c, idx) => {
                        const RankIcon = idx === 0 ? Crown : idx === 1 ? Trophy : idx === 2 ? Medal : null;
                        const rankBgColor = idx === 0
                          ? 'bg-gradient-to-br from-amber-400 to-yellow-500'
                          : idx === 1
                          ? 'bg-gradient-to-br from-gray-300 to-gray-400'
                          : idx === 2
                          ? 'bg-gradient-to-br from-orange-400 to-amber-600'
                          : 'bg-gray-100 text-gray-500';
                        return (
                          <motion.tr
                            key={c.consultantId}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            className={cn(
                              'border-b border-warmPink/20 transition-colors',
                              'hover:bg-warmPink/20'
                            )}
                          >
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    'w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm',
                                    rankBgColor
                                  )}
                                >
                                  {RankIcon ? (
                                    <RankIcon className="w-4 h-4 text-white" />
                                  ) : (
                                    idx + 1
                                  )}
                                </div>
                                {idx < 3 && (
                                  <BadgeRose className="shrink-0">
                                    {idx === 0 ? '金玫瑰' : idx === 1 ? '银玫瑰' : '铜玫瑰'}
                                  </BadgeRose>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-semibold text-darkGray text-sm">
                                {c.consultantName}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="text-sm text-darkGray">{c.orderCount}</span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="text-sm font-semibold text-roseGold">
                                {c.completedPhotos}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="text-sm font-semibold text-forestGreen">
                                {c.retouchedPhotos}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center justify-center gap-1.5">
                                {renderStars(c.satisfaction)}
                                <span className="text-xs font-medium text-darkGray/70 ml-1">
                                  {c.satisfaction}
                                </span>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                      {consultantRanking.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                            暂无数据
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-roseGold" />
                  满意度分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  <div className="relative w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={satisfactionDist}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={105}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="#fff"
                          strokeWidth={2}
                        >
                          {satisfactionDist.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FFF',
                            border: '1px solid #F5E6D3',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                          }}
                          formatter={(value: number, name: string, props: { payload?: { percent?: number } }) => [
                            <span className="font-bold text-darkGray">
                              {value} 条 ({props.payload?.percent ?? 0}%)
                            </span>,
                            <span className="text-gray-600">{name}</span>,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-5xl font-bold bg-gradient-to-br from-roseGold to-champagne bg-clip-text text-transparent">
                        {avgSatisfactionScore}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">平均评分</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {satisfactionDist.map((item) => (
                    <div key={item.name} className="flex flex-col items-center gap-1">
                      <div
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-gray-600 font-medium">{item.name}</span>
                      <span className="text-xs text-darkGray font-bold">{item.percent}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-roseGold" />
                月度明细数据
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-roseGold/20">
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        月份
                      </th>
                      <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        订单数
                      </th>
                      <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        成片数
                      </th>
                      <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        精修数
                      </th>
                      <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        人均产出
                      </th>
                      <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        满意度
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthStatsTotals.map((m, idx) => (
                      <motion.tr
                        key={m.month}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="border-b border-warmPink/20 transition-colors hover:bg-warmPink/20"
                      >
                        <td className="py-3 px-3">
                          <span className="font-semibold text-darkGray text-sm">
                            {formatMonthLabel(m.month)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-sm text-darkGray">{m.orderCount}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-sm font-semibold text-roseGold">
                            {m.completedPhotos}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-sm font-semibold text-forestGreen">
                            {m.retouchedPhotos}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-sm font-semibold text-champagne">
                            {m.avgOutput}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-center gap-1.5">
                            {renderStars(m.avgSatisfaction)}
                            <span className="text-xs font-medium text-darkGray/70">
                              {m.avgSatisfaction}
                            </span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                    {monthStatsTotals.length > 0 && (
                      <tr className="bg-gradient-to-r from-roseGold/10 to-champagne/10 border-t-2 border-roseGold/30">
                        <td className="py-4 px-3">
                          <span className="font-bold text-darkGray text-base flex items-center gap-2">
                            <Crown className="w-4 h-4 text-roseGold" />
                            合计 / 平均
                          </span>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className="text-base font-bold text-darkGray">
                            {totalRow.totalOrders}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className="text-base font-bold text-roseGold">
                            {totalRow.totalPhotos}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className="text-base font-bold text-forestGreen">
                            {totalRow.totalRetouch}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-center">
                          <span className="text-base font-bold text-champagne">
                            {totalRow.avgOutputPer}
                          </span>
                        </td>
                        <td className="py-4 px-3">
                          <div className="flex items-center justify-center gap-1.5">
                            {renderStars(totalRow.avgSat)}
                            <span className="text-sm font-bold text-roseGold">
                              {totalRow.avgSat}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                    {monthStatsTotals.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-gray-400 text-sm">
                          暂无月度数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

function BadgeRose({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold',
        'bg-gradient-to-r from-roseGold/20 to-champagne/20 text-roseGold border border-roseGold/30',
        className
      )}
    >
      {children}
    </span>
  );
}
