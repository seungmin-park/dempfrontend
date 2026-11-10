import { deadlineSummary } from '@/presentation/recruitment';

const now = Date.parse('2026-11-11T09:00:00+09:00');
const open = deadLineDate => ({ deadlineMode: 'FIXED', startedDate: '2026-11-01T00:00:00', deadLineDate });

test('오늘 마감인 모집 중 공고는 날짜 대신 오늘과 마감 시각을 강조해 보여준다', () => {
  expect(deadlineSummary(open('2026-11-11T18:00:00'), now)).toEqual({ text: '오늘 18:00 마감', urgent: true });
});

test('내일 마감은 초 단위가 있으면 그대로 보여준다', () => {
  expect(deadlineSummary(open('2026-11-12T23:59:59'), now)).toEqual({ text: '내일 23:59:59 마감', urgent: true });
});

test('사흘 이내 마감은 날짜와 남은 날을 함께 보여주고 강조한다', () => {
  expect(deadlineSummary(open('2026-11-14T18:00:00'), now)).toEqual({ text: '2026.11.14 18:00 마감 · 3일 남음', urgent: true });
});

test('여유 있는 마감은 남은 날을 보여주되 강조하지 않는다', () => {
  expect(deadlineSummary(open('2026-11-25T18:00:00'), now)).toEqual({ text: '2026.11.25 18:00 마감 · 14일 남음', urgent: false });
});

test('남은 날은 보는 사람의 시간대가 아니라 한국 날짜 기준으로 센다', () => {
  const lateNight = Date.parse('2026-11-11T23:30:00+09:00');
  expect(deadlineSummary(open('2026-11-12T00:30:00'), lateNight)).toEqual({ text: '내일 00:30 마감', urgent: true });
  expect(deadlineSummary(open('2026-11-11T23:59:00'), lateNight)).toEqual({ text: '오늘 23:59 마감', urgent: true });
});

test('마감 방식이 없는 예전 공고도 정확한 마감 시각이 있으면 남은 시간을 보여준다', () => {
  expect(deadlineSummary({ startedDate: '2026-11-01T00:00:00', deadLineDate: '2026-11-11T18:00:00' }, now)).toEqual({ text: '오늘 18:00 마감', urgent: true });
});

test('정확한 마감 시각이 없는 공고는 남은 시간을 만들지 않는다', () => {
  for (const [deadlineMode, text] of [['UNTIL_FILLED', '채용 시 마감'], ['ALWAYS_OPEN', '상시 모집'], ['UNKNOWN', '마감 미확인']]) {
    expect(deadlineSummary({ deadlineMode, startedDate: '2026-11-01T00:00:00', deadLineDate: null }, now)).toEqual({ text, urgent: false });
  }
});

test('마감됐거나 아직 시작 전인 공고는 날짜만 보여준다', () => {
  expect(deadlineSummary(open('2026-11-10T18:00:00'), now)).toEqual({ text: '2026.11.10 18:00 마감', urgent: false });
  expect(deadlineSummary({ ...open('2026-11-11T18:00:00'), recruitmentClosed: true }, now)).toEqual({ text: '2026.11.11 18:00 마감', urgent: false });
  expect(deadlineSummary({ ...open('2026-11-20T18:00:00'), startedDate: '2026-11-12T09:00:00' }, now)).toEqual({ text: '2026.11.20 18:00 마감', urgent: false });
});
