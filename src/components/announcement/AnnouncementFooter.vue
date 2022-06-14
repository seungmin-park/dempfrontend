<template>
  <footer>
    <div class="footer-menu">
      <div class="footer-menu-announcement-write">
        <router-link :to="{ path: '/addAnnounce' }" v-if="$store.state.Login.token != ``">글쓰기</router-link>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
};
</script>

<style>
footer {
  display: inline-block;
  width: 83%;
}

.footer-menu {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.footer-menu-announcement-write {
  float: right;
}
</style>
