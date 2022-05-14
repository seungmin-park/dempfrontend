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
      <div
        id="g_id_onload"
        data-client_id="YOUR_CLIENT_ID"
        data-callback="handleCredentialResponse"
      ></div>
      <div class="g_id_signin" data-type="standard"></div>
    </span>
  </header>
</template>

<script>
export default {
  name: "demp-header",
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
