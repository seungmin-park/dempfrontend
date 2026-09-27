import type positions from '@/data/positions';

export type EntityId = number | string;
export type JobPosition = typeof positions[number];
export type Language = 'HTML' | 'CSS' | 'React' | 'JAVA' | 'JPA' | 'SPRING';
export type AnnouncementType = 'EMP' | 'EDU';
export interface Slice<T> { content: T[]; last: boolean; number: number }
export interface MemberInfo { username: string; jwt: string }
export interface Member { id: number; username: string }
export interface Company { name: string | null }
export interface AnnouncementSummary {
  company?: string | null;
  announcementType?: AnnouncementType | null;
  minCareer?: number | null;
  maxCareer?: number | null;
  payment?: number | null;
  startedDate?: string | null;
  deadLineDate?: string | null;
  id: number;
  title: string | null;
  language: Language[];
  position: JobPosition | null;
  image: string;
}
export interface AnnouncementDetailResponse {
  image: string;
  company: Company | null;
  title: string | null;
  minCareer: number;
  maxCareer: number;
  startedDate: string | null;
  deadLineDate: string | null;
  content: string | null;
  accessUrl: string | null;
  payment: number;
  language: Language[];
  position: JobPosition | null;
  announcementType: AnnouncementType | null;
}
export type AnnouncementDetail = Omit<AnnouncementDetailResponse, 'company'> & { company: string; type: AnnouncementType | null };
export interface AnnouncementScroll extends Pick<AnnouncementSummary, 'announcementType' | 'minCareer' | 'maxCareer'> { id: number; title: string | null; company: Company | null; image: string }
export interface AnnouncementFilters {
  languages?: Language[];
  recruitmentStatus?: 'OPEN' | 'UPCOMING' | 'CLOSED' | '';
  tuition?: 'FREE' | 'PAID' | '';
  announcementType: AnnouncementType | '';
  positions: JobPosition[];
  career: number;
  payment: number;
  title: string;
}
export interface AnnouncementSearchCondition extends AnnouncementFilters { page: number }
export interface AnnouncementForm {
  title: string;
  company: string;
  type: AnnouncementType | '';
  position: JobPosition | '';
  minCareer: number;
  maxCareer: number;
  startedDate: string | null;
  deadLineDate: string | null;
  content: string;
  accessUrl: string;
  payment: number;
  language: string | Language[];
  image: File | null;
}
export interface QuestionSummary { id: number; title: string | null; hits: number; recommend: number }
export interface QuestionDetail extends QuestionSummary { content: string | null; dislike: number; username: string; hashtags: string[] }
export interface QuestionForm { title: string; content: string; username: string; hashtags: string[] }
export interface QuestionSearchCondition { orderBy: string; title: string; content: string; hashtags: string[]; page: number; size: number }
export interface Answer { answerId: number; username: string; content: string | null; recommend: number; dislike: number }
export interface AnswerForm { username: string; questionId: EntityId; answerContent: string }
export interface HashtagInput { value: string; select: boolean }
