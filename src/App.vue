<template>
  <demp-header></demp-header>
  <body>
  <router-view></router-view>
  </body>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  name: "App",
});
</script>

<style>
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

button {
  cursor: pointer;
}
img {
  cursor: pointer;
}
</style>
