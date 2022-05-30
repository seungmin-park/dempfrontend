<template>
  <footer>
    <div class="footer-menu">
      <div class="footer-menu-page">
        <a
          class="pageNum"
          :href="`/?page=${pageNum}`"
          v-for="pageNum in totalPage"
          :key="pageNum"
        >
          {{ pageNum }}
        </a>
      </div>
      <div class="footer-menu-annoucemnet-write">
        <router-link :to="{ path: '/addAnnounce' }" v-if="$store.state.Login.token != ``">글쓰기</router-link>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  mounted() {
    {
      this.emitter.on("totalPage", (e) => {
        this.totalPage = e;
      });
    }
  },
  data() {
    return {
      totalPage: 0,
    };
  },
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

.footer-menu-page {
  margin-right: 40%;
}

.pageNum {
  font-size: 25px;
  padding-right: 15px;
}
.footer-menu-annoucemnet-write {
  float: right;
}
</style>
