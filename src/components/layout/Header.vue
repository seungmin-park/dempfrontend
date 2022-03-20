<template>
  <header class="menu">
    <span id="title">DEMP</span>
    <span>
      <a href="/">공고</a>
      <a href="/question">면접 질문</a>
      <button id="login">LOGIN WITH GITHUB</button>
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
