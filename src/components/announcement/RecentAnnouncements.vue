<template>
  <section v-if="username && recentAnnouncements.length" class="recent-announcements" aria-label="최근 본 공고">
    <div class="recent-heading">
      <h3>최근 본 공고</h3>
      <span>이 기기에만 저장됩니다.</span>
      <button type="button" aria-label="최근 본 공고 기록 지우기" @click="clearRecentAnnouncements">지우기</button>
    </div>
    <ul><li v-for="item in recentAnnouncements.slice(0, 5)" :key="item.id"><RouterLink :to="`/detail/${item.id}`">{{ item.title }}{{ item.company ? ` · ${item.company}` : '' }}</RouterLink></li></ul>
  </section>
</template>
<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useRecentAnnouncements } from '@/composables/useRecentAnnouncements';
const props = defineProps<{ username: string }>();
const { recentAnnouncements, clearRecentAnnouncements } = useRecentAnnouncements(() => props.username);
</script>
<style scoped>
.recent-announcements { margin: 0 0 20px; }
.recent-heading { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; margin-bottom: 10px; }
.recent-heading h3 { margin: 0; font-size: 14px; }
.recent-heading span { color: var(--meta); font-size: 12px; }
.recent-heading button { margin-left: auto; min-height: 44px; border: 0; background: transparent; color: var(--muted); font-size: 12px; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.recent-announcements ul { display: flex; gap: 8px; margin: 0; padding: 0 0 4px; list-style: none; overflow-x: auto; }
.recent-announcements li { flex: 0 0 auto; max-width: 260px; }
.recent-announcements a { display: flex; align-items: center; min-height: 44px; padding: 0 14px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); color: var(--ink); font-size: 13px; text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.recent-announcements a:hover { border-color: var(--muted); }
</style>
