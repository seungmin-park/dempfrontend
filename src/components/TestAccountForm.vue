<template>
  <div>
    <Form as="form" @submit="AccountMethod" enctype="multipart/form-data">
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
          password
        </ErrorMessage>
      </div>
      <button type="reset">취소</button>
      <button type="submit">회원가입</button>
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

<style></style>
