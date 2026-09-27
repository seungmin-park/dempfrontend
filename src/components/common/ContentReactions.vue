<template>
  <div class="content-reactions">
    <button type="button" disabled :aria-label="`추천 ${recommend}`" title="반응 저장 기능 준비 중"><AppIcon name="thumbsUp" :size="17" /><span>{{ recommend }}</span></button>
    <button type="button" disabled :aria-label="`비추천 ${dislike}`" title="반응 저장 기능 준비 중"><AppIcon name="thumbsDown" :size="17" /><span>{{ dislike }}</span></button>
    <span class="reaction-note">반응 저장 기능 준비 중</span>
  </div>
</template>
<script setup lang="ts">
import AppIcon from './AppIcon.vue';
defineProps<{ recommend: number; dislike: number }>();
</script>
