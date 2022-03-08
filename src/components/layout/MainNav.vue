<template>
  <button v-on:click="increaseNum">채용</button>
  <button v-on:click="decreaseNum">교육</button>
</template>

<script>
export default {
  name: "main-navigation",

  data() {
    return {
      username: "test",
    };
  },
  props: {
    value: {
      name: "title",
      type: String,
      required: true,
    },
  },
  methods: {
    increaseNum() {
      this.$router.push("/emp");
    },
    decreaseNum() {
      this.$router.push("/boot-camp");
    },
  },
};
</script>

<style>
#boardSeach {
  border: none;
  border-bottom: 1px solid gray;
}
</style>
