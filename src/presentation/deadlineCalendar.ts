import { koreaTime, type RecruitmentPeriod } from './recruitment';

export interface DeadlineCalendarInput extends RecruitmentPeriod { id: number | string; title: string; company: string; detailUrl: string }
const HOUR = 60 * 60 * 1000;
const encoder = new TextEncoder();

function utc(time: number): string { return new Date(time).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
function text(value: string): string { return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
/** RFC 5545 folds content lines at 75 octets; continuation lines start with one space. */
function fold(line: string): string {
  const parts: string[] = [];
  let current = '', size = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    if (size + bytes > (parts.length ? 74 : 75)) { parts.push(current); current = ''; size = 0; }
    current += char; size += bytes;
  }
  return [...parts, current].join('\r\n ');
}

/** An iCalendar file for a posting's exact deadline; postings without one get no file instead of an invented date. */
export function deadlineCalendar(input: DeadlineCalendarInput, now: number): string | null {
  const end = koreaTime(input.deadLineDate);
  const exact = input.deadlineMode === undefined || input.deadlineMode === 'FIXED';
  if (!exact || input.recruitmentClosed || !Number.isFinite(end) || now >= end) return null;
  const summary = text(`[마감] ${input.company} · ${input.title}`);
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DEMP//Announcement deadline//KO', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', `UID:demp-announcement-${input.id}-deadline`, `DTSTAMP:${utc(now)}`,
    `DTSTART:${utc(end - HOUR)}`, `DTEND:${utc(end)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${text(`지원 전 원문에서 최신 조건을 확인하세요.\n${input.detailUrl}`)}`,
    `URL:${input.detailUrl}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${summary}`, 'TRIGGER:-P1D', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].map(fold).join('\r\n') + '\r\n';
}
