<template>
  <section v-if="tags.length" class="related-questions" aria-label="관련 면접 질문">
    <h2>이 공고의 기술로 올라온 면접 질문</h2>
    <ul><li v-for="tag in tags" :key="tag"><RouterLink :to="{ path: '/question', query: { hashtags: tag } }">{{ tag }}</RouterLink></li></ul>
  </section>
</template>
<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import type { Language } from '@/types/api';
import { getQuestionHashtags } from '@/api/questions';
import { matchingQuestionTags } from '@/presentation/questionTags';

const props = defineProps<{ languages: readonly Language[] }>();
const tags = ref<string[]>([]);
let generation = 0;
// Supplementary links: a failed lookup hides the section instead of interrupting the posting.
async function load() {
  const current = ++generation;
  try {
    const response = await getQuestionHashtags();
    if (current === generation) tags.value = matchingQuestionTags(props.languages, response.data);
  } catch { if (current === generation) tags.value = []; }
}
watch(() => props.languages, load, { immediate: true });
onUnmounted(() => { generation++; });
</script>
<style scoped>
.related-questions { padding: 24px 0; border-top: 1px solid var(--line); }
.related-questions h2 { font-size: 15px; margin: 0 0 12px; }
.related-questions ul { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; }
.related-questions a { display: inline-flex; align-items: center; min-height: 40px; padding: 0 14px; border: 1px solid var(--line); border-radius: 8px; color: var(--primary); font-size: 13px; font-weight: 600; text-decoration: none; }
.related-questions a:hover { border-color: var(--muted); }
</style>
