<template>
  <div class="bookmark-control" @click.stop @keydown.enter.stop>
    <button type="button" class="button button-secondary bookmark-button" :aria-label="saved ? '관심 공고 해제' : '관심 공고 저장'" :aria-pressed="saved" :disabled="busy || !enabled" @click="$emit('toggle')">{{ busy ? '저장 중…' : !enabled ? '저장 상태 확인 중…' : saved ? '♥ 저장됨' : '♡ 관심 공고' }}</button>
    <p v-if="error" role="alert">{{ error }}</p>
  </div>
</template>
<script setup lang="ts">
defineProps<{ saved: boolean; busy: boolean; enabled: boolean; error: string }>();
defineEmits<{ toggle: [] }>();
</script>
<style scoped>
.bookmark-button { min-height: 44px; }
.bookmark-button[aria-pressed="true"] { color: var(--accent, #4f46e5); border-color: currentColor; }
.bookmark-control p { margin: 8px 0 0; font-size: 13px; }
</style>
