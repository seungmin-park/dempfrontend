import { onBeforeUnmount, readonly, ref, watch } from 'vue';
import { setReaction, type ReactionTarget } from '@/api/reactions';
import type { EntityId, ReactionChoice, ReactionState, ReactionType } from '@/types/api';
interface ReactionProps { target: ReactionTarget; targetId: EntityId; recommend: number; dislike: number; myReaction?: ReactionType }
export function useContentReaction(props: ReactionProps) {
  const state = ref<ReactionState>({ recommend: props.recommend, dislike: props.dislike, myReaction: props.myReaction ?? 'NONE' });
  const saving = ref(false);
  const error = ref('');
  let generation = 0;
  watch(() => [props.target, props.targetId], () => {
    generation++;
    saving.value = false; error.value = '';
    state.value = { recommend: props.recommend, dislike: props.dislike, myReaction: props.myReaction ?? 'NONE' };
  });
  watch(() => [props.recommend, props.dislike, props.myReaction], () => {
    if (!saving.value) state.value = { recommend: props.recommend, dislike: props.dislike, myReaction: props.myReaction ?? 'NONE' };
  });
  onBeforeUnmount(() => { generation++; });
  async function select(reaction: ReactionChoice) {
    if (saving.value) return;
    const request = generation;
    const next = state.value.myReaction === reaction ? 'NONE' : reaction;
    saving.value = true; error.value = '';
    try {
      const response = await setReaction(props.target, props.targetId, next);
      if (request === generation) state.value = response.data;
    } catch {
      if (request === generation) error.value = '반응을 저장하지 못했습니다. 다시 눌러 재시도해 주세요.';
    } finally { if (request === generation) saving.value = false; }
  }
  return { state: readonly(state), saving: readonly(saving), error: readonly(error), select };
}
