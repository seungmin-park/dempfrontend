/** API local date-times are Korea standard time, independent of the viewer timezone. */
import type { DeadlineMode } from '@/types/api';
import { formatRecruitDate } from './announcement';
export interface RecruitmentPeriod { deadlineMode?: DeadlineMode; startedDate?: string | null; deadLineDate?: string | null; recruitmentClosed?: boolean }
export type RecruitmentState = 'UPCOMING' | 'OPEN' | 'CLOSED' | 'UNKNOWN';
export const recruitmentLabels: Record<RecruitmentState, string> = { UPCOMING: '모집 예정', OPEN: '모집 중', CLOSED: '모집 마감', UNKNOWN: '일정 미확인' };
function koreaTime(value?: string | null): number { return value ? Date.parse(`${value}+09:00`) : NaN; }
export function recruitmentState(period: RecruitmentPeriod, now: number): RecruitmentState {
  if (period.recruitmentClosed) return 'CLOSED';
  const start = koreaTime(period.startedDate), end = koreaTime(period.deadLineDate);
  if (Number.isFinite(end) && now > end) return 'CLOSED';
  if (Number.isFinite(start) && now < start) return 'UPCOMING';
  const noFixedDeadline = period.deadlineMode === 'UNTIL_FILLED' || period.deadlineMode === 'ALWAYS_OPEN';
  return Number.isFinite(start) && (noFixedDeadline || Number.isFinite(end) && period.deadlineMode !== 'UNKNOWN') ? 'OPEN' : 'UNKNOWN';
}

export function formatDeadline(period: RecruitmentPeriod): string {
  if (period.deadlineMode === 'UNTIL_FILLED') return '채용 시 마감';
  if (period.deadlineMode === 'ALWAYS_OPEN') return '상시 모집';
  if (period.deadlineMode === 'UNKNOWN' || !period.deadLineDate) return '마감 미확인';
  return formatRecruitDate(period.deadLineDate);
}
