<template>
  <router-view></router-view>
  <button @click="saveMember">포스트 테스트</button>
</template>

<script>
import axios from "axios";
export default {
  name: "App",
  data() {},
  mounted() {
    this.getMember();
  },
  methods: {
    getMember() {
      axios.get("/member").then((res) => {
        console.log(res.data);
      });
    },
    saveMember() {
      axios
        .post("members/save", { username: "member1", age: 10, password: 11111 })
        .then((res) => {
          console.log(res.data);
        })
        .catch((error) => {
          console.log(error);
        });
    },
  },
};
</script>
