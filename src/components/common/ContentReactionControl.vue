<template>
  <div class="reaction-control">
    <ContentReactions :recommend="state.recommend" :dislike="state.dislike" :my-reaction="state.myReaction" :saving="saving" @select="select" />
    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
  </div>
</template>
<script setup lang="ts">
import ContentReactions from './ContentReactions.vue';
import { useContentReaction } from '@/composables/useContentReaction';
import type { ReactionTarget } from '@/api/reactions';
import type { EntityId, ReactionType } from '@/types/api';
const props = defineProps<{ target: ReactionTarget; targetId: EntityId; recommend: number; dislike: number; myReaction?: ReactionType }>();
const { state, saving, error, select } = useContentReaction(props);
</script>
