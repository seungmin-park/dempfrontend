<template>
  <span class="member-badge" :aria-label="`회원 ${username}`"><span class="member-avatar"><AppIcon name="user" :size="16" /></span><span>{{ username }}</span></span>
</template>
<script setup lang="ts">
import AppIcon from './AppIcon.vue';
defineProps<{ username: string }>();
</script>
