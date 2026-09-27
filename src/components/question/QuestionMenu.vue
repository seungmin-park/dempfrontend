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

<style>
.question-menu {
  padding: 0% 20px 0px 20px;
  height: 100vh;
  border-right: 1px solid rgba(0, 0, 0, 0.3);
}

.question-menus {
  display: block;
  margin: 0%;
  padding: 10px 0px 10px 0px;
  text-decoration: none;
  color: black;
}
</style>
