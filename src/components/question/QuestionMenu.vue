<template>
  <div class="question-menu">
    <router-link
      class="question-menus"
      :to="{ path: '/question', query: { orderBy: 'createdDate' } }"
    >
      전체 질문
    </router-link>
    <router-link
      class="question-menus"
      :to="{ path: '/question', query: { orderBy: 'hits' } }"
    >
      인기 질문
    </router-link>
    <router-link
      class="question-menus"
      :to="{ path: '/question', query: { orderBy: 'recomend' } }"
    >
      추천 질문
    </router-link>
  </div>
</template>

<script>
export default {};
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
