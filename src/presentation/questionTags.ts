import type { Language } from '@/types/api';
import { technologyLabels } from '@/data/technologies';

/** Question tags (server spelling) that name one of the posting's technologies. */
export function matchingQuestionTags(languages: readonly Language[], hashtags: unknown): string[] {
  if (!Array.isArray(hashtags)) return [];
  const wanted = new Set(languages.map(language => (technologyLabels[language] ?? language).toLowerCase()));
  return hashtags.filter((tag): tag is string => typeof tag === 'string' && wanted.has(tag.trim().toLowerCase()));
}
