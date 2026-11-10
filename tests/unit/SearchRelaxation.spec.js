import { relaxationCandidates } from '@/presentation/announcementStates';

const base = { announcementType: '', positions: [], languages: [], career: 0, payment: 0, title: '', orderBy: 'DEADLINE', recruitmentStatus: 'ACTIVE', tuition: '' };

test('결과를 되살릴 후보는 조건 묶음 하나만 뺀 검색 조건이고 나머지 선택은 그대로다', () => {
  const filters = { ...base, title: 'Kotlin', positions: ['BACKEND', 'FRONTEND'], languages: ['KOTLIN'], career: 3, recruitmentStatus: 'OPEN' };
  const candidates = relaxationCandidates(filters);
  expect(candidates.map(item => [item.key, item.label])).toEqual([
    ['title', '검색어 “Kotlin” 빼고 보기'],
    ['languages', '기술 스택(Kotlin) 빼고 보기'],
    ['positions', '직무(백엔드, 프론트엔드) 빼고 보기'],
    ['career', '경력 3년 조건 빼고 보기'],
    ['status', '모집 상태(모집 중) 빼고 보기'],
  ]);
  expect(candidates.map(item => item.filters)).toEqual([
    { ...filters, title: '' }, { ...filters, languages: [] }, { ...filters, positions: [] },
    { ...filters, career: 0 }, { ...filters, recruitmentStatus: '' },
  ]);
});

test('기본 모집 상태에서는 마감 공고를 포함하는 것을 마지막 후보로 둔다', () => {
  const filters = { ...base, languages: ['JAVA'] };
  expect(relaxationCandidates(filters).map(item => [item.key, item.label, item.filters.recruitmentStatus])).toEqual([
    ['languages', '기술 스택(Java) 빼고 보기', 'ACTIVE'],
    ['status', '마감된 공고까지 보기', ''],
  ]);
});

test('교육 과정은 경력 대신 교육비와 상세 조건을 하나씩 후보로 만든다', () => {
  const filters = { ...base, announcementType: 'EDU', tuition: 'FREE', deliveryMode: 'ONLINE', region: 'SEOUL', duration: 'SHORT', startAfter: '2026-12-01' };
  const candidates = relaxationCandidates(filters);
  expect(candidates.map(item => item.label)).toEqual([
    '교육비(무료) 빼고 보기', '수업 방식(온라인) 빼고 보기', '교육 지역(서울) 빼고 보기', '교육 기간 조건 빼고 보기', '개강일 조건 빼고 보기', '마감된 공고까지 보기',
  ]);
  expect(candidates[1].filters).toEqual({ ...filters, deliveryMode: undefined });
  expect(candidates[4].filters).toEqual({ ...filters, startAfter: undefined, startBefore: undefined });
});

test('사용자가 고른 조건이 없으면 후보를 만들지 않는다', () => {
  expect(relaxationCandidates(base)).toEqual([]);
  expect(relaxationCandidates({ ...base, recruitmentStatus: '' })).toEqual([]);
});
