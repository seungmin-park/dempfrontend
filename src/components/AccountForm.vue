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
        <p v-if="checkedUsername" style="color: #0A7DC6">
          사용 가능한 아이디 입니다.
        </p>
          <button @click="validUsername" class="w-100 btn btn-secondary btn-lg">아이디 중복 검사</button>
        <label for="password">비밀번호</label>
        <Field
          type="password"
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
        <label for="password">비밀번호 재확인</label>
        <Field
            type="password"
            id="checkedPassword"
            name="checkedPassword"
            v-model="checkedPassword"
            placeholder="password"
            :rules="`required|equal:${password}`"
            class="form-control"
        />
        <ErrorMessage class="errorMessage" name="checkedPassword" as="div">
          비밀번호가 일치하지 않습니다.
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
defineRule("equal",(value,[password]) => {
  console.log(value)
  if (value != password){
    return "비밀번호가 일치하지 않습니다.";
  }
  return true;
})
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
      checkedPassword: "",
      token: "",
      checkedUsername:false
    };
  },
  created(){
    if (this.$store.state.Login.token != "") {
      this.$router.replace({
        path: "/",
      });
    }},
  methods: {
    AccountMethod() {
      if (!this.checkedUsername){
        alert("아이디 중복 검사를 실시해 주시기 바랍니다.");
        return;
      }
      var form = new FormData();
      form.append("username", this.username);
      form.append("password", this.password);
      axios
        .post("/api/member/save", form, {
          Headers: {
            "Content-type": "form-data",
          },
        })
        .then(() => {
          this.$router.push("/login");
        });
    },
    validUsername(){
      axios.get("/api/member/validUsername",{
        params:{
          username: this.username
        }
      })
          .then((res) =>{
            this.checkedUsername = res.data;
            if (!this.checkedUsername){
              alert("사용 불가능한 아이디 입니다.");
            }
          })
    }
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
