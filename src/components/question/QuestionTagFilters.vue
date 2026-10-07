<template>
  <div v-if="tags.length" class="active-filters" aria-label="선택한 해시태그">
    <span class="field-hint">선택한 태그</span>
    <span v-for="tag in tags" :key="tag" class="filter-chip">#{{ tag }}<button type="button" :aria-label="`${tag} 태그 조건 해제`" @click="setTags(tags.filter(value => value !== tag))"><AppIcon name="close" :size="14" /></button></span>
    <button type="button" class="reset-filters" aria-label="태그 조건 모두 해제" @click="setTags([])">전체 해제</button>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { queryTags } from '@/router/query';
import AppIcon from '@/components/common/AppIcon.vue';
const route = useRoute(), router = useRouter();
const tags = computed(() => queryTags(route.query.hashtags));
function setTags(values: string[]) { router.push({ path: '/question', query: { ...route.query, hashtags: values.length ? values : undefined } }); }
</script>
