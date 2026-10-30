<template>
  <header class="site-header"><div class="header-inner">
    <router-link class="brand" to="/" aria-label="DEMP 홈"><span class="brand-mark" aria-hidden="true">D<span></span></span>DEMP</router-link>
    <nav class="primary-nav" aria-label="주요 메뉴"><router-link to="/">공고</router-link><router-link :to="{ path: '/question', query: { orderBy: 'createdDate' } }">면접 질문</router-link></nav>
    <div class="header-account"><template v-if="$store.state.Login.token"><router-link v-if="isAdmin" class="admin-entry button button-quiet" to="/admin">관리자</router-link><router-link to="/mypage" class="account-link" aria-label="마이페이지"><MemberBadge :username="$store.state.Login.username" /><span>마이페이지</span></router-link><button id="logout" class="button button-quiet" @click="logout">로그아웃</button></template><button v-else id="login" class="button button-primary" @click="redirectLogin">로그인</button></div>
  </div></header>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import MemberBadge from '@/components/common/MemberBadge.vue';
import { getGithubLoginUrl } from '@/api/auth';
export default defineComponent({
  name: "demp-header",
  components: { MemberBadge },
  props: { isAdmin: { type: Boolean, default: false } },
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

<style scoped>
.account-link { display: inline-flex; align-items: center; flex-wrap: wrap; gap: 6px; min-height: 44px; text-decoration: none; color: inherit; }
.account-link span { font-size: .8rem; }
@media (max-width: 700px) {
  .header-inner { flex-wrap: wrap; gap: 8px 16px; padding: 12px 16px; justify-content: center; }
  .primary-nav { margin-left: auto; align-self: auto; gap: 16px; }
  .primary-nav a { min-width: 40px; min-height: 44px; white-space: nowrap; justify-content: center; }
  .header-account { flex: 0 0 100%; justify-content: flex-end; gap: 12px; }
  .header-account .button, .account-link { white-space: nowrap; min-height: 44px; flex-shrink: 0; }
}
</style>
