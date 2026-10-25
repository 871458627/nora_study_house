const WEEKDAY_SHORT = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

function toUTC(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function dateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isValidDateKey(key: unknown): key is string {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const parsed = toUTC(key);
  return dateKeyUTC(parsed) === key;
}

function dateKeyUTC(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export function addDays(key: string, days: number): string {
  const date = toUTC(key);
  date.setUTCDate(date.getUTCDate() + days);
  return dateKeyUTC(date);
}

/** Whole days from `from` to `to` (to - from). */
export function diffDays(to: string, from: string): number {
  const a = toUTC(to).getTime();
  const b = toUTC(from).getTime();
  return Math.round((a - b) / 86_400_000);
}

/** 0 = Monday, 6 = Sunday. */
export function weekdayIndex(key: string): number {
  return (toUTC(key).getUTCDay() + 6) % 7;
}

export function weekdayShort(key: string): string {
  return WEEKDAY_SHORT[weekdayIndex(key)];
}

export function formatMonthDay(key: string): string {
  const date = toUTC(key);
  return `${date.getUTCMonth() + 1}月${date.getUTCDate()}日`;
}

export function formatMonthDayWeek(key: string): string {
  return `${formatMonthDay(key)} ${weekdayShort(key)}`;
}

export function formatShort(key: string): string {
  const date = toUTC(key);
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

export function monthLabel(key: string): string {
  const date = toUTC(key);
  return `${date.getUTCFullYear()} 年 ${date.getUTCMonth() + 1} 月`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

export function startOfWeek(key: string): string {
  return addDays(key, -weekdayIndex(key));
}

export function rangeEndingAt(key: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => addDays(key, index - count + 1));
}

export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 6) return '夜深了';
  if (hour < 11) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

export function relativeLabel(key: string, today = todayKey()): string {
  const delta = diffDays(key, today);
  if (delta === 0) return '今天';
  if (delta === -1) return '昨天';
  if (delta === 1) return '明天';
  return formatMonthDayWeek(key);
}
