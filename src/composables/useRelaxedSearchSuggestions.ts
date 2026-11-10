import { onUnmounted, readonly, ref } from 'vue';
import type { AnnouncementFilters } from '@/types/api';
import { hasMatchingAnnouncements } from '@/api/announcements';
import { relaxationCandidates, type RelaxationCandidate } from '@/presentation/announcementStates';

/** Owns the empty-result checks: which single condition, if dropped, brings postings back. */
export function useRelaxedSearchSuggestions() {
  const suggestions = ref<RelaxationCandidate[]>([]);
  let generation = 0;
  async function check(filters: AnnouncementFilters) {
    const current = ++generation;
    suggestions.value = [];
    const candidates = relaxationCandidates(filters);
    const results = await Promise.allSettled(candidates.map(candidate => hasMatchingAnnouncements(candidate.filters)));
    if (current !== generation) return;
    suggestions.value = candidates.filter((_, index) => { const result = results[index]; return result?.status === 'fulfilled' && result.value; });
  }
  function clear() { generation++; suggestions.value = []; }
  onUnmounted(clear);
  return { relaxedSuggestions: readonly(suggestions), checkRelaxedSearches: check, clearRelaxedSearches: clear };
}
