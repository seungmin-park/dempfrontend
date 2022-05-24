<template>
  <div>
    <Form as="form" @submit="loginMethod" enctype="multipart/form-data">
      <div class="add-form">
        <Field
          type="text"
          id="username"
          name="username"
          v-model="username"
          placeholder="username"
          rules="required"
        />
        <ErrorMessage class="errorMessage" name="username" as="div">
          아이디를 입력해 주세요.
        </ErrorMessage>

        <Field
          type="text"
          id="password"
          name="password"
          v-model="password"
          placeholder="password"
          rules="required"
        />
        <ErrorMessage class="errorMessage" name="password" as="div">
          비밀번호를 입력해 주세요.
        </ErrorMessage>
      </div>
      <button type="submit">로그인</button>
    </Form>
    <router-link class="question-menus" :to="{ path: '/account' }">
      회원가입
    </router-link>
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
          this.$store.commit("setToken", res.data.jwt);
          this.$store.commit("setUsername", res.data.username);
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

<style scoped></style>
