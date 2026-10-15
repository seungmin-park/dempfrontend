<template>
  <p v-if="bookmarks.loadError.value" role="alert">{{ bookmarks.loadError.value }} <button class="button button-secondary" @click="bookmarks.load">저장 상태 다시 확인</button></p>
  <p v-if="bookmarks.resumeMessage.value" role="status">{{ bookmarks.resumeMessage.value }}</p>
  <p v-if="bookmarks.resumeError.value" role="alert">{{ bookmarks.resumeError.value }} <button class="button button-secondary" :disabled="bookmarks.resumeSaving.value" @click="bookmarks.resumeSave">저장 다시 시도</button></p>
  <slot :saved="bookmarks.saved" :busy="bookmarks.busy" :enabled="bookmarks.enabled" :error="bookmarks.error" :toggle="bookmarks.toggle" />
</template>
<script setup lang="ts">
import { useAnnouncementBookmarks } from '@/composables/useAnnouncementBookmarks';
const props = defineProps<{ ids: number[]; token: string; username?: string; intentId?: string }>();
const emit = defineEmits<{ login: [id: number]; consumeIntent: [] }>();
const bookmarks = useAnnouncementBookmarks(props, id => emit('login', id), () => emit('consumeIntent'));
</script>
