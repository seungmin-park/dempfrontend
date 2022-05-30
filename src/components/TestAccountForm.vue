<template>
  <div class="container">
    <Form as="form" @submit="AccountMethod" enctype="multipart/form-data">
      <div class="py-5 text-center">
        <h2>회원 가입</h2>
      </div>
      <div class="add-form">
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
      </div>
      <hr class="my-4">
      <div class="row">
        <div class="col">
          <button type="reset" class="w-100 btn btn-secondary btn-lg">취소</button>
        </div>
        <div class="col">
          <button type="submit" class="w-100 btn btn-secondary btn-lg">회원가입</button>
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
    };
  },
  methods: {
    AccountMethod() {
      var form = new FormData();
      form.append("username", this.username);
      form.append("password", this.password);
      axios
        .post("/api/member/save", form, {
          Headers: {
            "Content-type": "form-data",
          },
        })
        .then((res) => {
          console.log(res.data);
          this.$router.push("/login");
        });
    },
  },
};
</script>

<style>
.container {
  max-width: 560px;
}
</style>
