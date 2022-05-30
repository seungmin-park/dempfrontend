<template>
  <div class="container">
    <div class="py-5 text-center">
      <h2>로그인</h2>
    </div>
    <Form as="form" @submit="loginMethod" enctype="multipart/form-data">
        <label for="username">아이디</label>
        <Field
          type="text"
          id="username"
          name="username"
          v-model="username"
          placeholder="username"
          rules="required"
          class="form-control"
        />
        <ErrorMessage class="errorMessage" name="username" as="div">
          아이디를 입력해 주세요.
        </ErrorMessage>
      <label for="password">비밀번호</label>
      <Field
          type="text"
          id="password"
          name="password"
          v-model="password"
          placeholder="password"
          rules="required"
          class="form-control"
        />
        <ErrorMessage class="errorMessage" name="password" as="div">
          비밀번호를 입력해 주세요.
        </ErrorMessage>
      <div class="row">
        <div class="col">
          <button type="submit" class="w-100 btn btn-secondary btn-lg">로그인</button>
        </div>
        <div class="col">
          <router-link class="w-100 btn btn-secondary btn-lg" :to="{ path: '/account' }">
            회원가입
          </router-link>
        </div>
      </div>
    </Form>
  </div>
</template>

<script>
import axios from "axios";
import { Form, Field, ErrorMessage } from "vee-validate";
import { defineRule } from "vee-validate";
import { required, url, min_value } from "@vee-validate/rules";

defineRule("required", required);
defineRule("url", url);
defineRule("min_value", min_value);
export default {
  components: {
    Form,
    Field,
    ErrorMessage,
  },
  data() {
    return {
      username: "",
      password: "",
      token: "",
      redirect: "",
    };
  },
  mounted() {
    if (this.$route.query){
      this.redirect = this.$route.query.redirect;
    }
  },
  methods: {
    loginMethod() {
      var form = new FormData();
      form.append("username", this.username);
      form.append("password", this.password);
      axios
        .post("/api/member/login", form, {
          Headers: {
            "Content-type": "form-data",
          },
        })
        .then((res) => {
          this.$store.commit("Login/setToken", res.data.jwt);
          this.$store.commit("Login/setUsername", res.data.username);
          if (this.redirect == "") {
            this.$router.push("/");
          } else {
            this.$router.push({path: this.redirect});
          }
        });
    },
  },
};
</script>

<style>
.container {
  max-width: 560px;
}
.errorMessage {
  display: flex;
  color: red;
}
</style>
