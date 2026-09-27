<template>
  <div class="question-menu">
    <router-link
      class="question-menus"
      :to="{ path: '/question', query: { orderBy: 'createdDate',hashtags:$route.query.hashtags } }"
    >
      전체 질문
    </router-link>
    <router-link
      class="question-menus"
      :to="{ path: '/question', query: { orderBy: 'hits',hashtags:$route.query.hashtags } }"
    >
      인기 질문
    </router-link>
    <router-link
      class="question-menus"
      :to="{ path: '/question', query: { orderBy: 'recommend',hashtags:$route.query.hashtags } }"
    >
      추천 질문
    </router-link>
  </div>
</template>
<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({});
</script>
