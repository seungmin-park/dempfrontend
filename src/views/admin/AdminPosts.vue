<template><AdminCollection :kind="kind" /></template>
<script setup lang="ts">
import AdminCollection from '@/components/admin/AdminCollection.vue';
import type { PostKind } from '@/api/admin';
defineProps<{ kind: PostKind }>();
</script>
