/** API local date-times are Korea standard time, independent of the viewer timezone. */
export interface RecruitmentPeriod { startedDate?: string | null; deadLineDate?: string | null; recruitmentClosed?: boolean }
export type RecruitmentState = 'UPCOMING' | 'OPEN' | 'CLOSED' | 'UNKNOWN';
export const recruitmentLabels: Record<RecruitmentState, string> = { UPCOMING: '모집 예정', OPEN: '모집 중', CLOSED: '모집 마감', UNKNOWN: '일정 미확인' };
function koreaTime(value?: string | null): number { return value ? Date.parse(`${value}+09:00`) : NaN; }
export function recruitmentState(period: RecruitmentPeriod, now: number): RecruitmentState {
  if (period.recruitmentClosed) return 'CLOSED';
  const start = koreaTime(period.startedDate), end = koreaTime(period.deadLineDate);
  if (Number.isFinite(end) && now > end) return 'CLOSED';
  if (Number.isFinite(start) && now < start) return 'UPCOMING';
  return Number.isFinite(start) && Number.isFinite(end) ? 'OPEN' : 'UNKNOWN';
}
