import type { PublicationStatus } from '@/types/api';
export const publicationLabels: Record<PublicationStatus,string> = { DRAFT: '초안', REVIEW: '검토 중', PUBLISHED: '공개', HIDDEN: '비공개' };
