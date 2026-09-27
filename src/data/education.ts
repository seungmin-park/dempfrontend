export const educationFields = [
  { key: 'deliveryMode', label: '수업 방식', options: { ONLINE: '온라인', OFFLINE: '오프라인', HYBRID: '온·오프라인 혼합' } },
  { key: 'region', label: '교육 지역', options: { SEOUL: '서울', BUSAN: '부산', DAEGU: '대구', INCHEON: '인천', GWANGJU: '광주', DAEJEON: '대전', ULSAN: '울산', SEJONG: '세종', GYEONGGI: '경기', GANGWON: '강원', CHUNGBUK: '충북', CHUNGNAM: '충남', JEONBUK: '전북', JEONNAM: '전남', GYEONGBUK: '경북', GYEONGNAM: '경남', JEJU: '제주', OVERSEAS: '해외' } },
  { key: 'commitment', label: '참여 시간', options: { FULL_TIME: '풀타임', PART_TIME: '파트타임', SELF_PACED: '자율 학습' } },
  { key: 'fundingType', label: '교육비 지원', options: { CARD_REQUIRED: '내일배움카드 필요', GOVERNMENT: '기타 국비 지원', SPONSORED: '기관·기업 지원', SELF_FUNDED: '자비 부담' } },
  { key: 'selectionProcess', label: '선발 방식', options: { CODING: '코딩 평가 포함', NO_CODING: '코딩 평가 없음', NONE: '선발 절차 없음' } },
  { key: 'learningLevel', label: '학습 수준', options: { BEGINNER: '입문자 대상', BASIC_REQUIRED: '기초 경험 필요', ADVANCED: '심화 과정', ALL_LEVELS: '수준 무관' } },
] as const;
export type EducationKey = typeof educationFields[number]['key'];
export interface EducationInfo extends Partial<Record<EducationKey, string | null>> {
  cohort?: string | null;
  stipendAmount?: number | null;
  stipendNote?: string | null;
  learningStartDate?: string | null;
  learningEndDate?: string | null;
  durationDays?: number | null;
}
export const durations = { SHORT: '30일 이하', MEDIUM: '31~90일', LONG: '91~180일', EXTENDED: '181일 이상' };
export function educationLabel(key: EducationKey, value?: string | null): string {
  const field = educationFields.find(field => field.key === key)!;
  return value ? (field.options as Record<string,string>)[value] || '정보 없음' : '정보 없음';
}
export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10) === value;
}
export function educationError(info: EducationInfo): string {
  if (info.stipendAmount != null && (!Number.isInteger(info.stipendAmount) || info.stipendAmount < 0)) return '지원금은 0 이상의 정수로 입력해 주세요.';
  if ((info.learningStartDate && !validDate(info.learningStartDate)) || (info.learningEndDate && !validDate(info.learningEndDate))) return '교육 날짜를 확인해 주세요.';
  if (info.learningEndDate && (!info.learningStartDate || info.learningEndDate < info.learningStartDate)) return '교육 종료일은 시작일 이후여야 합니다.';
  return '';
}
