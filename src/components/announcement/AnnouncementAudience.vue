<template>
  <div class="announcement-audience">
    <span class="audience-badge" :class="`audience-${audience.tone}`" aria-label="모집 구분">{{ audience.label }}</span>
    <span v-if="audience.detail" class="audience-years">{{ audience.detail }}</span>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import type { AnnouncementSummary } from '@/types/api';
import { announcementAudience } from '@/presentation/announcement';
const props = defineProps<{ announcement: Pick<AnnouncementSummary, 'announcementType' | 'minCareer' | 'maxCareer' | 'recruitmentAudience'> }>();
const audience = computed(() => announcementAudience(props.announcement));
</script>
