<template>
  <nav class="question-menu" aria-label="질문 정렬">
    <router-link v-for="tab in tabs" :key="tab.orderBy" v-slot="{ href, navigate }" custom
      :to="{ path: '/question', query: { orderBy: tab.orderBy, hashtags: $route.query.hashtags } }">
      <a class="question-menus" :class="{ 'is-active': selected === tab.orderBy }" :href="href"
        :aria-current="selected === tab.orderBy ? 'page' : undefined" @click="navigate">{{ tab.label }}</a>
    </router-link>
  </nav>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
  data: () => ({ tabs: [
    { orderBy: 'createdDate', label: '전체 질문' },
    { orderBy: 'hits', label: '인기 질문' },
    { orderBy: 'recommend', label: '추천 질문' },
  ] }),
  computed: { selected(): string { return String(this.$route.query.orderBy || 'createdDate'); } },
});
</script>
