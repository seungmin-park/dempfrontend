import type { EducationInfo } from '@/data/education';
import type positions from '@/data/positions';

export type EntityId = number | string;
export type JobPosition = typeof positions[number];
export type Language = 'HTML' | 'CSS' | 'React' | 'JAVA' | 'JPA' | 'SPRING';
export type SalaryStatus = 'UNDISCLOSED' | 'NEGOTIABLE' | 'DISCLOSED';
export type PublicationStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'HIDDEN';
export type RecruitmentAudience = 'NEW' | 'EXPERIENCED' | 'ANY' | 'MIXED';
export type EmploymentType = 'REGULAR' | 'CONTRACT' | 'CONVERSION_INTERNSHIP' | 'EXPERIENTIAL_INTERNSHIP';
export interface PublicationInfo { employmentType?: EmploymentType | null; recruitmentClosed?: boolean; recruitmentAudience?: RecruitmentAudience | null; cohort?: string | null; stipendAmount?: number | null; stipendNote?: string | null; publicationStatus?: PublicationStatus; sourceName?: string | null; sourceIdentifier?: string | null; applicationUrl?: string | null; sourceVerifiedAt?: string | null; sourceVerified?: boolean }
export interface PublicationRevision { actor: string; changedAt: string; status: PublicationStatus; title: string; sourceUrl: string }
export type AnnouncementType = 'EMP' | 'EDU';
export interface Slice<T> { content: T[]; last: boolean; number: number }
export interface MemberInfo { username: string; jwt: string }
export interface Member { id: number; username: string }
export interface Company { name: string | null }
export interface AnnouncementSummary extends PublicationInfo {
  education?: EducationInfo | null;
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
export interface AnnouncementDetailResponse extends PublicationInfo {
  education?: EducationInfo | null;
  image: string;
  company: Company | null;
  title: string | null;
  minCareer: number;
  maxCareer: number;
  startedDate: string | null;
  deadLineDate: string | null;
  content: string | null;
  accessUrl: string | null;
  payment: number | null;
  salaryStatus?: SalaryStatus;
  salaryMax?: number | null;
  language: Language[];
  position: JobPosition | null;
  announcementType: AnnouncementType | null;
}
export type AnnouncementDetail = Omit<AnnouncementDetailResponse, 'company'> & { company: string; type: AnnouncementType | null };
export interface AnnouncementScroll extends Pick<AnnouncementSummary, 'announcementType' | 'minCareer' | 'maxCareer' | 'recruitmentAudience' | 'employmentType'> { id: number; title: string | null; company: Company | null; image: string }
export interface AnnouncementFilters extends EducationInfo {
  duration?: string;
  startAfter?: string;
  startBefore?: string;
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
export interface AnnouncementForm extends EducationInfo, PublicationInfo {
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
  payment: number | null;
  salaryStatus?: SalaryStatus;
  salaryMax?: number | null;
  language: string | Language[];
  image: File | null;
  bodyImages?: File[];
}
export interface QuestionSummary { id: number; title: string | null; hits: number; recommend: number }
export interface QuestionDetail extends QuestionSummary { myReaction?: ReactionType; content: string | null; dislike: number; username: string; hashtags: string[] }
export interface QuestionForm { title: string; content: string; username: string; hashtags: string[] }
export interface QuestionUpdateForm extends Omit<QuestionForm, 'username'> { questionId: EntityId }
export interface QuestionSearchCondition { orderBy: string; title: string; content: string; hashtags: string[]; page: number; size: number }
export interface Answer { myReaction?: ReactionType; answerId: string; username: string; content: string | null; recommend: number; dislike: number }
export interface AnswerPage { content: Answer[]; nextCursor: string | null; hasNext: boolean }
export interface AnswerForm { username: string; questionId: EntityId; answerContent: string }
export interface HashtagInput { value: string; select: boolean }

export type ReactionType = 'NONE' | 'RECOMMEND' | 'DISLIKE';
export type ReactionChoice = Exclude<ReactionType, 'NONE'>;
export interface ReactionState { recommend: number; dislike: number; myReaction: ReactionType }
