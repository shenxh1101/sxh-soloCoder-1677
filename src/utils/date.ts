type DateFormat = 'full' | 'date' | 'datetime' | 'month' | 'short' | 'time' | 'compact' | string;

interface DateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number;
}

/**
 * 解析日期字符串或Date对象为Date
 * @param date 日期字符串（ISO格式）、Date对象或时间戳
 * @returns Date对象，无效输入返回当前日期
 */
function parseDate(date: string | Date | number | undefined | null): Date {
  if (date === undefined || date === null || date === '') {
    return new Date();
  }
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? new Date() : date;
  }
  if (typeof date === 'number') {
    const d = new Date(date);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  const d = new Date(date);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * 补零函数
 */
function pad(n: number, len = 2): string {
  return n.toString().padStart(len, '0');
}

/**
 * 提取日期各部分
 */
function getParts(date: Date): DateParts {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
    weekday: date.getDay(),
  };
}

/**
 * 格式化日期
 * @param iso ISO日期字符串、Date对象或时间戳
 * @param format 格式化方式，可选：
 *   - 'full': 2024年6月15日 星期六
 *   - 'date': 2024年6月15日（默认）
 *   - 'datetime': 2024年6月15日 14:30
 *   - 'month': 2024年6月
 *   - 'short': 06-15
 *   - 'time': 14:30
 *   - 'compact': 20240615
 *   - 自定义字符串，支持 YYYY/MM/DD HH:mm:ss 等占位符
 * @returns 格式化后的日期字符串
 * @example
 * formatDate('2024-06-15T14:30:00') // '2024年6月15日'
 * formatDate('2024-06-15', 'short') // '06-15'
 * formatDate('2024-06-15T14:30:00', 'YYYY/MM/DD') // '2024/06/15'
 */
export function formatDate(
  iso: string | Date | number | undefined | null,
  format: DateFormat = 'date',
): string {
  const date = parseDate(iso);
  const p = getParts(date);
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

  switch (format) {
    case 'full':
      return `${p.year}年${p.month}月${p.day}日 ${weekdays[p.weekday]}`;
    case 'date':
      return `${p.year}年${p.month}月${p.day}日`;
    case 'datetime':
      return `${p.year}年${p.month}月${p.day}日 ${pad(p.hour)}:${pad(p.minute)}`;
    case 'month':
      return `${p.year}年${p.month}月`;
    case 'short':
      return `${pad(p.month)}-${pad(p.day)}`;
    case 'time':
      return `${pad(p.hour)}:${pad(p.minute)}`;
    case 'compact':
      return `${p.year}${pad(p.month)}${pad(p.day)}`;
    default: {
      const map: Record<string, string> = {
        YYYY: p.year.toString(),
        MM: pad(p.month),
        M: p.month.toString(),
        DD: pad(p.day),
        D: p.day.toString(),
        HH: pad(p.hour),
        H: p.hour.toString(),
        hh: pad(p.hour > 12 ? p.hour - 12 : p.hour),
        h: (p.hour > 12 ? p.hour - 12 : p.hour).toString(),
        mm: pad(p.minute),
        m: p.minute.toString(),
        ss: pad(p.second),
        s: p.second.toString(),
        W: weekdays[p.weekday],
      };
      return format.replace(/YYYY|MM|M|DD|D|HH|H|hh|h|mm|m|ss|s|W/g, (match) => map[match] || match);
    }
  }
}

/**
 * 格式化日期时间（便捷方法）
 * @param iso ISO日期字符串、Date对象或时间戳，默认当前时间
 * @returns 格式化后的日期时间字符串，如 2024年6月15日 14:30
 * @example
 * formatDateTime() // 当前时间格式化
 * formatDateTime('2024-06-15T14:30:00') // '2024年6月15日 14:30'
 */
export function formatDateTime(
  iso: string | Date | number | undefined | null = new Date(),
): string {
  return formatDate(iso, 'datetime');
}

/**
 * 计算两个日期之间的天数差
 * @param start 开始日期
 * @param end 结束日期，默认当前日期
 * @returns 天数差（end - start），正数表示end在start之后
 * @example
 * daysBetween('2024-06-01', '2024-06-15') // 14
 * daysBetween('2024-06-15', '2024-06-01') // -14
 */
export function daysBetween(
  start: string | Date | number,
  end: string | Date | number = new Date(),
): number {
  const s = parseDate(start);
  const e = parseDate(end);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((e.getTime() - s.getTime()) / msPerDay);
}

/**
 * 判断日期是否已过期
 * @param date 要判断的日期
 * @param compareDate 对比日期，默认当前日期
 * @returns 已过期返回true，否则返回false
 * @example
 * isExpired('2024-06-01') // true（如果当前日期在2024-06-01之后）
 * isExpired('2099-12-31') // false
 */
export function isExpired(
  date: string | Date | number,
  compareDate: string | Date | number = new Date(),
): boolean {
  return daysBetween(date, compareDate) > 0;
}

/**
 * 生成有效期截止日期
 * @param days 有效天数，默认7天
 * @param startDate 起始日期，默认当前日期
 * @returns 有效期截止的ISO日期字符串（YYYY-MM-DD）
 * @example
 * generateExpireDate() // 当前日期+7天
 * generateExpireDate(30) // 当前日期+30天
 * generateExpireDate(7, '2024-06-15') // '2024-06-22'
 */
export function generateExpireDate(
  days: number = 7,
  startDate: string | Date | number = new Date(),
): string {
  const date = parseDate(startDate);
  date.setDate(date.getDate() + days);
  const p = getParts(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/**
 * 获取年月Key，用于按月分组或存储
 * @param iso 日期，默认当前日期
 * @param separator 年月分隔符，默认'-'
 * @returns 年月字符串，如 2024-06
 * @example
 * getMonthKey() // 当前年月
 * getMonthKey('2024-06-15') // '2024-06'
 * getMonthKey('2024-06-15', '') // '202406'
 */
export function getMonthKey(
  iso: string | Date | number | undefined | null = new Date(),
  separator: string = '-',
): string {
  const date = parseDate(iso);
  const p = getParts(date);
  return `${p.year}${separator}${pad(p.month)}`;
}
