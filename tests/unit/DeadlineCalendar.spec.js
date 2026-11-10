import { deadlineCalendar } from '@/presentation/deadlineCalendar';
import { matchingQuestionTags } from '@/presentation/questionTags';

const now = Date.parse('2026-11-11T00:00:00Z');
const posting = { id: 71, title: '백엔드 채용', company: 'DEMP', detailUrl: 'https://demp.test/detail/71', deadlineMode: 'FIXED', startedDate: '2026-11-01T09:00:00', deadLineDate: '2026-11-11T18:00:00' };
const unfold = text => text.replace(/\r\n /g, '');

test('정확한 마감 시각을 한국 시각에서 UTC로 바꿔 마감 1시간 전부터 마감까지의 일정과 하루 전 알림을 만든다', () => {
  const file = deadlineCalendar(posting, now);
  expect(typeof file).toBe('string');
  expect(file.endsWith('\r\n')).toBe(true);
  expect(unfold(file).split('\r\n').filter(Boolean)).toEqual([
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DEMP//Announcement deadline//KO', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', 'UID:demp-announcement-71-deadline', 'DTSTAMP:20261111T000000Z',
    'DTSTART:20261111T080000Z', 'DTEND:20261111T090000Z',
    'SUMMARY:[마감] DEMP · 백엔드 채용',
    'DESCRIPTION:지원 전 원문에서 최신 조건을 확인하세요.\\nhttps://demp.test/detail/71',
    'URL:https://demp.test/detail/71',
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:[마감] DEMP · 백엔드 채용', 'TRIGGER:-P1D', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ]);
});

test('제목의 특수문자는 일정 형식에 맞게 이스케이프하고 긴 줄은 글자를 쪼개지 않고 75바이트 이하로 접는다', () => {
  const title = '백엔드, 플랫폼; 인프라\\운영\n'.repeat(4);
  const file = deadlineCalendar({ ...posting, title }, now);
  expect(typeof file).toBe('string');
  const encoder = new TextEncoder();
  for (const line of file.split('\r\n')) expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
  expect(file).not.toContain('�');
  const summary = unfold(file).split('\r\n').find(line => line.startsWith('SUMMARY:'));
  expect(summary).toBe(`SUMMARY:[마감] DEMP · ${'백엔드\\, 플랫폼\\; 인프라\\\\운영\\n'.repeat(4)}`);
});

test('정확한 마감 시각이 없거나 이미 마감된 공고는 일정 파일을 만들지 않는다', () => {
  expect(deadlineCalendar({ ...posting, deadlineMode: 'UNTIL_FILLED', deadLineDate: null }, now)).toBeNull();
  expect(deadlineCalendar({ ...posting, deadlineMode: 'UNKNOWN' }, now)).toBeNull();
  expect(deadlineCalendar({ ...posting, recruitmentClosed: true }, now)).toBeNull();
  expect(deadlineCalendar({ ...posting, deadLineDate: '2026-11-10T18:00:00' }, now)).toBeNull();
  expect(deadlineCalendar({ ...posting, deadlineMode: undefined }, now)).toEqual(expect.stringContaining('DTEND:20261111T090000Z'));
});

test('공고 기술과 같은 이름의 질문 태그만 서버 표기 그대로 고른다', () => {
  expect(matchingQuestionTags(['KOTLIN', 'SPRING', 'JAVA'], ['kotlin', 'Spring', 'React', 'spring boot'])).toEqual(['kotlin', 'Spring']);
  expect(matchingQuestionTags(['SPRING_BOOT'], ['Spring Boot', 'spring'])).toEqual(['Spring Boot']);
  expect(matchingQuestionTags(['JAVA'], { unexpected: true })).toEqual([]);
  expect(matchingQuestionTags([], ['Java'])).toEqual([]);
});
