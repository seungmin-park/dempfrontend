<template>
  <div>
    <div class="search-condition">
      <button v-on:click="emp">채용</button>
      <button v-on:click="edu">교육</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {};
  },
  methods: {
    emp() {
      this.emitter.emit("emp", "emp");
    },
    edu() {
      this.emitter.emit("edu", "edu");
    },
  },
};
</script>

<style scoped>
.search-condition {
  padding: 25px;
}
</style>
