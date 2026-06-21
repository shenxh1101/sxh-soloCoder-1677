import { create } from 'zustand';
import { generateMockData } from '../mock/seed';
import { useLocalStorage } from '../utils/storage';
import type { MonthlyStat } from '../types';

interface ConsultantRankingItem {
  consultantId: string;
  consultantName: string;
  completedPhotos: number;
  retouchedPhotos: number;
  satisfaction: number;
  orderCount: number;
}

interface MonthlyTrendItem {
  month: string;
  totalPhotos: number;
  totalRetouched: number;
  avgSatisfaction: number;
  totalOrders: number;
}

interface SatisfactionDistribution {
  '5星': number;
  '4星': number;
  '3星': number;
  '2星': number;
  '1星': number;
}

interface StatsState {
  monthlyStats: MonthlyStat[];
  fetchStats: () => Promise<MonthlyStat[]>;
  getConsultantRanking: (month?: string) => ConsultantRankingItem[];
  getMonthlyTrend: () => MonthlyTrendItem[];
  getSatisfactionDistribution: () => SatisfactionDistribution;
}

const statsStorage = useLocalStorage<MonthlyStat[]>('monthly_stats');

const initialStats = (() => {
  const stored = statsStorage.get();
  if (stored && stored.length > 0) return stored;
  const { stats } = generateMockData();
  statsStorage.set(stats);
  return stats;
})();

export const useStatsStore = create<StatsState>((set, get) => ({
  monthlyStats: initialStats,

  fetchStats: async () => {
    const { monthlyStats } = get();
    return monthlyStats;
  },

  getConsultantRanking: (month?: string) => {
    const { monthlyStats } = get();
    let filtered = monthlyStats;
    if (month) {
      filtered = monthlyStats.filter((s) => s.month === month);
    }

    const aggregated: Record<string, ConsultantRankingItem> = {};
    for (const stat of filtered) {
      if (!aggregated[stat.consultantId]) {
        aggregated[stat.consultantId] = {
          consultantId: stat.consultantId,
          consultantName: stat.consultantName,
          completedPhotos: 0,
          retouchedPhotos: 0,
          satisfaction: 0,
          orderCount: 0,
        };
      }
      const item = aggregated[stat.consultantId];
      item.completedPhotos += stat.completedPhotos;
      item.retouchedPhotos += stat.retouchedPhotos;
      item.satisfaction += stat.satisfaction;
      item.orderCount += stat.orderCount;
    }

    const result = Object.values(aggregated).map((item) => {
      const count = filtered.filter((s) => s.consultantId === item.consultantId).length || 1;
      return {
        ...item,
        satisfaction: Math.round((item.satisfaction / count) * 10) / 10,
      };
    });

    result.sort((a, b) => {
      if (b.satisfaction !== a.satisfaction) {
        return b.satisfaction - a.satisfaction;
      }
      if (b.completedPhotos !== a.completedPhotos) {
        return b.completedPhotos - a.completedPhotos;
      }
      return b.orderCount - a.orderCount;
    });

    return result;
  },

  getMonthlyTrend: () => {
    const { monthlyStats } = get();
    const monthMap: Record<string, MonthlyTrendItem & { _satSum: number; _satCount: number }> = {};

    for (const stat of monthlyStats) {
      if (!monthMap[stat.month]) {
        monthMap[stat.month] = {
          month: stat.month,
          totalPhotos: 0,
          totalRetouched: 0,
          avgSatisfaction: 0,
          totalOrders: 0,
          _satSum: 0,
          _satCount: 0,
        };
      }
      const monthItem = monthMap[stat.month];
      monthItem.totalPhotos += stat.completedPhotos;
      monthItem.totalRetouched += stat.retouchedPhotos;
      monthItem.totalOrders += stat.orderCount;
      monthItem._satSum += stat.satisfaction;
      monthItem._satCount += 1;
    }

    const months = Object.keys(monthMap).sort();
    return months.map((m) => {
      const item = monthMap[m];
      const avg = item._satCount > 0 ? item._satSum / item._satCount : 0;
      return {
        month: item.month,
        totalPhotos: item.totalPhotos,
        totalRetouched: item.totalRetouched,
        avgSatisfaction: Math.round(avg * 10) / 10,
        totalOrders: item.totalOrders,
      };
    });
  },

  getSatisfactionDistribution: () => {
    const { monthlyStats } = get();
    const dist: SatisfactionDistribution = {
      '5星': 0,
      '4星': 0,
      '3星': 0,
      '2星': 0,
      '1星': 0,
    };

    for (const stat of monthlyStats) {
      const s = stat.satisfaction;
      if (s >= 4.5) dist['5星']++;
      else if (s >= 3.5) dist['4星']++;
      else if (s >= 2.5) dist['3星']++;
      else if (s >= 1.5) dist['2星']++;
      else dist['1星']++;
    }

    return dist;
  },
}));
