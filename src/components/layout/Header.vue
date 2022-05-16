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
      <button id="login" @click="redirectGithubLogin">LOGIN WITH GITHUB</button>
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

#login {
  border: none;
  height: 30px;
}
</style>
