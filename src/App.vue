<template>
  <a class="skip-link" href="#main-content">본문으로 이동</a>
  <demp-header />
  <main id="main-content" class="app-shell" tabindex="-1"><router-view /></main>
  <footer class="site-footer"><strong>DEMP</strong><span>개발자의 다음 기회를 함께.</span><router-link to="/admin">관리자</router-link></footer>
</template>
<script setup lang="ts">
import DempHeader from './components/layout/Header.vue';
</script>
