import type { DeepReadonly } from 'vue';
import type { LocationQueryValue } from 'vue-router';
import type { AnnouncementDetail } from '@/types/api';
import { educationLabel } from '@/data/education';
import { announcementAudience, formatEmploymentType, formatLanguages } from './announcement';
import { formatSalary, formatTuition } from './compensation';
import { formatPosition } from './positions';
import { deadlineSummary, recruitmentLabels, recruitmentState } from './recruitment';

export const MAX_COMPARE = 4;
const MAX_ID = 2147483647;
export interface ComparisonRow { label: string; values: string[] }
type Item = DeepReadonly<Partial<AnnouncementDetail>>;

/** Selected posting IDs as the URL carries them: unique positive integers, in order, at most four. */
export function compareIdsFromQuery(value: LocationQueryValue | LocationQueryValue[] | undefined): number[] {
  const ids: number[] = [];
  for (const part of (Array.isArray(value) ? value : [value]).flatMap(text => text ? text.split(',') : [])) {
    const id = /^\d+$/.test(part) ? Number(part) : 0;
    if (id < 1 || id > MAX_ID || ids.includes(id)) continue;
    ids.push(id);
    if (ids.length === MAX_COMPARE) break;
  }
  return ids;
}

export function toggleCompareId(ids: readonly number[], id: number): number[] {
  if (ids.includes(id)) return ids.filter(selected => selected !== id);
  return ids.length < MAX_COMPARE ? [...ids, id] : [...ids];
}

/** Rows for postings side by side; a missing column shows a dash and a row that does not apply says so. */
export function comparisonRows(items: readonly (Item | null)[], now: number): ComparisonRow[] {
  const loaded = items.filter((item): item is Item => item !== null);
  const hasEmployment = loaded.some(item => item.type === 'EMP'), hasEducation = loaded.some(item => item.type === 'EDU');
  const row = (label: string, value: (item: Item) => string, only?: 'EMP' | 'EDU'): ComparisonRow => ({
    label, values: items.map(item => !item ? '—' : only && item.type !== only ? '해당 없음' : value(item)),
  });
  const career = (item: Item) => {
    const audience = announcementAudience({ announcementType: item.type ?? null, minCareer: item.minCareer ?? null, maxCareer: item.maxCareer ?? null, recruitmentAudience: item.recruitmentAudience ?? null });
    return [audience.label, audience.detail].filter(Boolean).join(' ');
  };
  const rows = [
    row('회사', item => item.company || '회사 정보 없음'),
    row('종류', item => item.type === 'EDU' ? '부트캠프·교육' : '채용'),
    row('직무', item => formatPosition(item.position)),
  ];
  if (hasEmployment) rows.push(
    row('경력 조건', career, 'EMP'),
    row('고용 형태', item => formatEmploymentType(item.employmentType), 'EMP'),
    row('급여', item => formatSalary(item), 'EMP'),
  );
  if (hasEducation) rows.push(row('교육비', item => formatTuition(item.payment), 'EDU'));
  rows.push(
    row('기술 스택', item => formatLanguages(item.language)),
    row('모집 상태', item => recruitmentLabels[recruitmentState(item, now)]),
    row('마감', item => deadlineSummary(item, now).text),
  );
  if (hasEducation) rows.push(
    row('수업 방식', item => educationLabel('deliveryMode', item.education?.deliveryMode), 'EDU'),
    row('교육 지역', item => educationLabel('region', item.education?.region), 'EDU'),
    row('교육 일정', item => `${item.education?.learningStartDate || '시작일 미확인'} ~ ${item.education?.learningEndDate || '종료일 미확인'}`, 'EDU'),
  );
  return rows;
}
