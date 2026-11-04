import { hasTextContent } from '@/content/sanitizeHtml';

/**
 * Mirrors the backend request limits (demp QuestionLimits / AnswerLimits). Content limits apply to the
 * HTML that is sent to the server, so Markdown formatting counts toward them.
 */
export const QUESTION_TITLE_MAX_LENGTH = 255;
export const QUESTION_CONTENT_MAX_LENGTH = 50_000;
export const HASHTAG_MAX_COUNT = 10;
export const HASHTAG_MAX_LENGTH = 30;
export const ANSWER_CONTENT_MAX_LENGTH = 20_000;

const count = (value: number) => value.toLocaleString('ko-KR');

export function questionInputProblem(title: string, contentHtml: string): string {
  if (title.length > QUESTION_TITLE_MAX_LENGTH) return `제목은 ${QUESTION_TITLE_MAX_LENGTH}자 이하로 입력해 주세요.`;
  if (!hasTextContent(contentHtml)) return '본문을 입력해 주세요.';
  if (contentHtml.length > QUESTION_CONTENT_MAX_LENGTH) {
    return `본문이 너무 깁니다. 서식을 포함해 ${count(QUESTION_CONTENT_MAX_LENGTH)}자 이하로 줄여 주세요. (현재 ${count(contentHtml.length)}자)`;
  }
  return '';
}

export function answerInputProblem(contentHtml: string): string {
  if (!hasTextContent(contentHtml)) return '답변 내용을 입력해 주세요.';
  if (contentHtml.length > ANSWER_CONTENT_MAX_LENGTH) {
    return `답변이 너무 깁니다. 서식을 포함해 ${count(ANSWER_CONTENT_MAX_LENGTH)}자 이하로 줄여 주세요. (현재 ${count(contentHtml.length)}자)`;
  }
  return '';
}

export function hashtagProblem(value: string, currentCount: number): string {
  if (value.length > HASHTAG_MAX_LENGTH) return `태그는 ${HASHTAG_MAX_LENGTH}자 이하로 입력해 주세요.`;
  if (currentCount >= HASHTAG_MAX_COUNT) return `태그는 ${HASHTAG_MAX_COUNT}개까지 추가할 수 있습니다.`;
  return '';
}
