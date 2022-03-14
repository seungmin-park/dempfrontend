<template>
  <div>
    <div class="search-condition">
      <button v-on:click="emp">채용</button>
      <button v-on:click="edu">교육</button>
    </div>
    <announcement v-bind:typeName="index"></announcement>
  </div>
</template>

<script>
import announcement from "./announcement.vue";

export default {
  name: "MainFrame",
  data() {
    return {
      index: "emp",
    };
  },
  methods: {
    emp() {
      this.index = "emp";
    },
    edu() {
      this.index = "edu";
    },
  },
  components: {
    announcement: announcement,
  },
};
</script>

<style scoped>
.search-condition {
  padding: 25px;
}
</style>
