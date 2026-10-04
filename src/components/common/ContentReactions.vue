<template>
  <div class="content-reactions" :aria-busy="saving">
    <button type="button" :disabled="saving" :aria-label="`추천 ${recommend}`" :aria-pressed="myReaction === 'RECOMMEND'" :title="myReaction === 'RECOMMEND' ? '추천 취소' : '추천'" @click="$emit('select', 'RECOMMEND')"><AppIcon name="thumbsUp" :size="17" /><span>{{ recommend }}</span></button>
    <button type="button" :disabled="saving" :aria-label="`비추천 ${dislike}`" :aria-pressed="myReaction === 'DISLIKE'" :title="myReaction === 'DISLIKE' ? '비추천 취소' : '비추천'" @click="$emit('select', 'DISLIKE')"><AppIcon name="thumbsDown" :size="17" /><span>{{ dislike }}</span></button>
    <span v-if="saving" class="reaction-note" role="status">저장 중…</span>
  </div>
</template>
<script setup lang="ts">
import AppIcon from './AppIcon.vue';
import type { ReactionChoice, ReactionType } from '@/types/api';
defineProps<{ recommend: number; dislike: number; myReaction?: ReactionType; saving?: boolean }>();
defineEmits<{ select: [reaction: ReactionChoice] }>();
</script>
<style scoped>
.content-reactions button[aria-pressed="true"] { color: var(--primary, #5145e9); border-color: currentColor; background: #eeedff; }
.content-reactions button:disabled { cursor: wait; }
</style>
