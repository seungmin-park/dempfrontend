<template>
  <section class="page saved-page">
    <div class="page-heading"><span class="eyebrow">SAVED</span><h1>관심 공고</h1><p>저장한 공고를 다시 확인하세요. 모집이 끝난 공고도 보관됩니다.</p></div>
    <ul class="saved-list">
      <li v-for="entry in entries" :key="entry.announcementId" class="saved-card">
        <template v-if="entry.available && entry.announcement">
          <router-link :to="`/detail/${entry.announcementId}`"><h2>{{ entry.announcement.title }}</h2></router-link>
          <p>{{ entry.announcement.company }}</p>
          <p>{{ recruitmentLabels[recruitmentState(entry.announcement, recruitmentNow)] }}</p>
          <p>마감: {{ formatDeadline(entry.announcement) }}</p>
        </template>
        <template v-else><h2>이용할 수 없는 공고</h2><p>공고가 비공개로 전환되었거나 삭제되었습니다.</p></template>
        <BookmarkButton :saved="true" :busy="!!pending[entry.announcementId]" :enabled="!loading" :error="errors[entry.announcementId] || ''" @toggle="remove(entry.announcementId)" />
      </li>
    </ul>
    <p v-if="loading" role="status">관심 공고를 불러오는 중입니다.</p>
    <p v-if="error" role="alert">{{ error }} <button data-test="retry-saved" class="button button-secondary" :disabled="loading" @click="loadMore">다시 시도</button></p>
    <div v-else-if="!loading && !entries.length" role="status"><h2>저장한 공고가 없습니다</h2><router-link to="/" class="button button-primary">공고 둘러보기</router-link></div>
    <button v-if="hasNext && !error" class="button button-secondary" :disabled="loading" @click="loadMore">더보기</button>
  </section>
</template>
<script setup lang="ts">
import { useStore } from 'vuex';
import type { RootState } from '@/store/types';
import { useSavedAnnouncements } from '@/composables/useSavedAnnouncements';
import { useRecruitmentTime } from '@/composables/useRecruitmentTime';
import { recruitmentLabels, recruitmentState, formatDeadline } from '@/presentation/recruitment';
import BookmarkButton from '@/components/announcement/BookmarkButton.vue';
const store = useStore<RootState>();
const { entries, loading, error, hasNext, pending, errors, loadMore, remove } = useSavedAnnouncements(() => store.state.Login.token, () => store.state.Login.username);
const { recruitmentNow } = useRecruitmentTime();
</script>
<style scoped>
.saved-page { max-width: 980px; margin-inline: auto; }
.saved-list { list-style: none; padding: 0; display: grid; gap: 16px; }
.saved-card { border: 1px solid var(--line); padding: 24px; border-radius: 12px; background: var(--surface); }
.saved-card h2 { margin-top: 0; overflow-wrap: anywhere; }
</style>
