/** API local date-times are Korea standard time, independent of the viewer timezone. */
import type { DeadlineMode } from '@/types/api';
import { formatRecruitDate } from './announcement';
export interface RecruitmentPeriod { deadlineMode?: DeadlineMode; startedDate?: string | null; deadLineDate?: string | null; recruitmentClosed?: boolean }
export type RecruitmentState = 'UPCOMING' | 'OPEN' | 'CLOSED' | 'UNKNOWN';
export const recruitmentLabels: Record<RecruitmentState, string> = { UPCOMING: '모집 예정', OPEN: '모집 중', CLOSED: '모집 마감', UNKNOWN: '일정 미확인' };
export function koreaTime(value?: string | null): number { return value ? Date.parse(`${value}+09:00`) : NaN; }
export function recruitmentState(period: RecruitmentPeriod, now: number): RecruitmentState {
  if (period.recruitmentClosed) return 'CLOSED';
  const start = koreaTime(period.startedDate), end = koreaTime(period.deadLineDate);
  if (Number.isFinite(end) && now > end) return 'CLOSED';
  if (Number.isFinite(start) && now < start) return 'UPCOMING';
  const noFixedDeadline = period.deadlineMode === 'UNTIL_FILLED' || period.deadlineMode === 'ALWAYS_OPEN';
  return Number.isFinite(start) && (noFixedDeadline || Number.isFinite(end) && period.deadlineMode !== 'UNKNOWN') ? 'OPEN' : 'UNKNOWN';
}

export interface DeadlineSummary { text: string; urgent: boolean }
const DAY = 24 * 60 * 60 * 1000;
const KOREA_OFFSET = 9 * 60 * 60 * 1000;
function koreaDay(time: number): number { return Math.floor((time + KOREA_OFFSET) / DAY); }

/** Remaining time is only shown for an open posting with an exact deadline; no deadline is invented. */
export function deadlineSummary(period: RecruitmentPeriod, now: number): DeadlineSummary {
  const dated = `${formatDeadline(period)}${period.deadLineDate ? ' 마감' : ''}`;
  const end = koreaTime(period.deadLineDate);
  const exact = period.deadlineMode === undefined || period.deadlineMode === 'FIXED';
  if (!exact || !Number.isFinite(end) || recruitmentState(period, now) !== 'OPEN') return { text: dated, urgent: false };
  const days = koreaDay(end) - koreaDay(now);
  const time = formatRecruitDate(period.deadLineDate).split(' ')[1];
  if (days === 0) return { text: `오늘 ${time} 마감`, urgent: true };
  if (days === 1) return { text: `내일 ${time} 마감`, urgent: true };
  return { text: `${dated} · ${days}일 남음`, urgent: days <= 3 };
}

export function formatDeadline(period: RecruitmentPeriod): string {
  if (period.deadlineMode === 'UNTIL_FILLED') return '채용 시 마감';
  if (period.deadlineMode === 'ALWAYS_OPEN') return '상시 모집';
  if (period.deadlineMode === 'UNKNOWN' || !period.deadLineDate) return '마감 미확인';
  return formatRecruitDate(period.deadLineDate);
}
