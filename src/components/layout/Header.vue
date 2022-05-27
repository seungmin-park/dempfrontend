<template>
  <header class="menu">
    <span id="title"><a href="/">DEMP</a></span>
    <span>
      <a href="/">공고</a>
      <router-link
        :to="{
          path: '/question',
          query: { orderBy: 'createdDate', hashtags: '' },
        }"
      >
        면접 질문
      </router-link>
      <!-- <button id="login" @click="redirectGithubLogin">LOGIN WITH GITHUB</button> -->
      <button v-if="this.$store.state.Login.token == ``" id="login" @click="redirectLogin">로그인</button>
      <button v-else id="logout" @click="logout">로그아웃</button>
    </span>
  </header>
</template>

<script>
import axios from "axios";
export default {
  name: "demp-header",
  methods: {
    redirectGithubLogin() {
      axios.get("/api/auth/github").then((res) => {
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
};
</script>

<style>
.menu {
  display: flex;
  background: #95cacf;
  padding: 15px;
  justify-content: space-between;
}

#title {
  color: white;
  font-weight: 600;
}

.menu a {
  color: white;
  padding: 10px;
  text-decoration: none;
  font-weight: 600;
}

#login, #logout{
  border: none;
  height: 30px;
}
</style>
