<template>
  <header class="menu">
    <span id="title">DEMP</span>
    <span>
      <a href="/">공고</a>
      <a href="/question">면접 질문</a>
      <button id="login">login</button>
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
.menu a {
  color: white;
  padding: 10px;
}
</style>
