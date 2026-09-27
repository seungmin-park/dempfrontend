import { apiClient } from './client';
import type { EntityId, ReactionState, ReactionType } from '@/types/api';
export type ReactionTarget = 'question' | 'answer';
export function setReaction(target: ReactionTarget, id: EntityId, reaction: ReactionType) {
  return apiClient.put<ReactionState>(`/api/${target}/${id}/reaction`, { reaction });
}
