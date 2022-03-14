<template>
  <demp-header></demp-header>
  <router-view></router-view>
  <!-- <span>id = 1 회원 조회</span>
  <p>
    username: {{ member.username }}, age: {{ member.age }}, password:
    {{ member.password }}
  </p>
  <form action="/" @submit.prevent="saveMember">
    <input type="text" placeholder="your username" v-model="form.username" />
    <input type="number" placeholder="your age" v-model="form.age" />
    <input
      type="password"
      placeholder="your password"
      v-model="form.password"
    />
    <button type="submit">포스트 테스트</button>
  </form> -->
</template>

<script>
import axios from "axios";
export default {
  name: "App",
  data() {
    return {
      form: {
        username: "",
        age: 0,
        password: 0,
      },
      member: {},
    };
  },
  // mounted() {
  //   this.getMember();
  // },
  methods: {
    getMember() {
      axios.get("/member").then((res) => {
        this.member.username = res.data.username;
        this.member.age = res.data.age;
        this.member.password = res.data.password;
        console.log(res.data);
      });
    },
    saveMember() {
      axios.post("/member/save", this.form).then((res) => {
        console.log(res.data);
      });
    },
  },
};
</script>

<style>
body {
  margin: 0;
}
</style>
