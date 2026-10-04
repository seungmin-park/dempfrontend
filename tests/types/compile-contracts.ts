import type { useContentReaction } from '@/composables/useContentReaction';
import type ContentReactions from '@/components/common/ContentReactions.vue';

declare const control: ReturnType<typeof useContentReaction>;
declare const view: InstanceType<typeof ContentReactions>;
control.select('RECOMMEND');
control.select('DISLIKE');
view.$emit('select', 'RECOMMEND');
// @ts-expect-error The UI sends a choice; the state owner decides cancellation.
control.select('NONE');
// @ts-expect-error The rendered component exposes the same choice contract.
view.$emit('select', 'NONE');
// @ts-expect-error The view must not overwrite confirmed counts.
control.state.value.recommend = 9;
// @ts-expect-error The view must not replace confirmed state.
control.state.value = { recommend: 9, dislike: 0, myReaction: 'NONE' };
// @ts-expect-error Request progress is owned by the composable.
control.saving.value = false;
// @ts-expect-error Error state is owned by the composable.
control.error.value = '';

declare const results: string[];
// @ts-expect-error An indexed value can be absent; the caller must check it.
const first: string = results[0];
const optional: { retry?: boolean } = {};
// @ts-expect-error Absence and an explicit undefined value are different.
optional.retry = undefined;
// @ts-expect-error A partial return path must be made explicit.
function incompleteReturn(found: boolean) { if (found) return 'found'; }
function fallthrough(value: number) {
  switch (value) {
    // @ts-expect-error Accidental case fallthrough is forbidden.
    case 1: value++;
    // eslint-disable-next-line no-fallthrough -- Intentional negative TypeScript compiler contract.
    case 2: return value;
    default: return 0;
  }
}
void [first, optional, incompleteReturn, fallthrough];
