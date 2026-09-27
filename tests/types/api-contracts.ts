import { login } from '@/api/members';
import { toAnnouncementDetail } from '@/api/announcements';
import type { AnnouncementDetailResponse, QuestionDetail, Answer } from '@/types/api';

// DTOs permit the nulls produced by legacy rows, while new input remains explicit.
const legacyAnnouncement = {
  image: '', company: null, title: null, minCareer: 0, maxCareer: 0,
  startedDate: null, deadLineDate: null, content: null, accessUrl: null,
  payment: 0, language: [], position: null, announcementType: null,
} satisfies AnnouncementDetailResponse;
const display = toAnnouncementDetail(legacyAnnouncement);
const company: string = display.company;

const invalidLogin: Awaited<ReturnType<typeof login>>['data'] = {
  username: 'member',
  // @ts-expect-error The server JWT contract is a string; a numeric token must fail checking.
  jwt: 123,
};
void [company, invalidLogin];

const legacyQuestion: QuestionDetail = { id: 1, title: null, content: null, hits: 0, recommend: 0, dislike: 0, username: 'member', hashtags: [] };
const legacyAnswer: Answer = { answerId: 1, content: null, recommend: 0, dislike: 0, username: 'member' };
void [legacyQuestion, legacyAnswer];
