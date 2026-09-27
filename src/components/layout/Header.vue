<template>
  <header class="site-header"><div class="header-inner">
    <router-link class="brand" to="/" aria-label="DEMP 홈"><span class="brand-mark" aria-hidden="true">D<span></span></span>DEMP</router-link>
    <nav class="primary-nav" aria-label="주요 메뉴"><router-link to="/">공고</router-link><router-link :to="{ path: '/question', query: { orderBy: 'createdDate' } }">면접 질문</router-link></nav>
    <div class="header-account"><template v-if="$store.state.Login.token"><MemberBadge :username="$store.state.Login.username" /><button id="logout" class="button button-quiet" @click="logout">로그아웃</button></template><button v-else id="login" class="button button-primary" @click="redirectLogin">로그인</button></div>
  </div></header>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import MemberBadge from '@/components/common/MemberBadge.vue';
import { getGithubLoginUrl } from '@/api/auth';
export default defineComponent({
  name: "demp-header",
  components: { MemberBadge },
  methods: {
    redirectGithubLogin() {
      getGithubLoginUrl().then((res) => {
        window.location.href = res.data;
      });
    },
    redirectLogin() {
      this.$router.push({path:"/login",
        query: { redirect: this.$router.currentRoute.value.fullPath}});
    },
    logout(){
      this.$store.commit("Login/logout");
      this.$router.push("/");
    },
  },
});
</script>
