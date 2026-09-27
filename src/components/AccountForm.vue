<template>
  <div class="auth-card">
    <ValidationForm as="form" @submit="registerAccount" enctype="multipart/form-data">
      <div class="auth-heading">
        <span class="auth-brand">DEMP</span><h1>함께 시작해요</h1><p>개발자의 커리어와 배움이 연결되는 곳.</p>
      </div>
      <div class="add-form">
          <label for="username">아이디</label>
        <Field
            type="text"
            id="username"
            name="username"
            v-model="username"
            placeholder="사용할 아이디" autocomplete="username"
            rules="required"
            class="form-control"
        />
        <ErrorMessage class="errorMessage" name="username" as="div">
          아이디를 입력해 주세요.
        </ErrorMessage>
        <p v-if="checkedUsername" style="color: #0A7DC6">
          사용 가능한 아이디 입니다.
        </p>
          <button type="button" @click="validUsername" class="button button-secondary">아이디 중복 검사</button>
        <label for="password">비밀번호</label>
        <Field
          type="password"
          id="password"
          name="password"
          v-model="password"
          placeholder="비밀번호" autocomplete="new-password"
          :rules="validateRegistrationPassword"
          class="form-control"
        />
        <ErrorMessage class="errorMessage" name="password" as="div" role="alert" />
        <label for="checkedPassword">비밀번호 재확인</label>
        <Field
            type="password"
            id="checkedPassword"
            name="checkedPassword"
            v-model="checkedPassword"
            placeholder="비밀번호" autocomplete="new-password"
            rules="required|equal"
            class="form-control"
        />
        <ErrorMessage class="errorMessage" name="checkedPassword" as="div">
          비밀번호가 일치하지 않습니다.
        </ErrorMessage>
      </div>

      <div class="auth-actions">
        <div class="col">
          <button type="reset" class="button button-secondary">취소</button>
        </div>
        <div class="col">
          <button type="submit" class="button button-primary">회원가입</button>
        </div>
      </div>
    </ValidationForm>
  </div>
</template>
<script lang="ts">
import { validateRegistrationPassword } from '@/validation/registrationPassword';
import { defineComponent } from "vue";
import { register, checkUsername } from '@/api/members';
import { Form as ValidationForm, Field, ErrorMessage } from "vee-validate";
import { defineRule } from "vee-validate";
import { required, url, min_value } from "@vee-validate/rules";

defineRule("required", required);
defineRule("url", url);
defineRule("min_value", min_value);
defineRule("equal",(value, _params, context) => {
  if (value !== context.form.password){
    return "비밀번호가 일치하지 않습니다.";
  }
  return true;
})
export default defineComponent({
  components: {
    ValidationForm,
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
    validateRegistrationPassword,
    registerAccount() {
      if (!this.checkedUsername){
        alert("아이디 중복 검사를 실시해 주시기 바랍니다.");
        return;
      }
      const form = new FormData();
      form.append("username", this.username);
      form.append("password", this.password);
      register(form)
        .then(() => {
          this.$router.push("/login");
        });
    },
    validUsername(){
      checkUsername(this.username)
          .then((res) =>{
            this.checkedUsername = res.data;
            if (!this.checkedUsername){
              alert("사용 불가능한 아이디 입니다.");
            }
          })
    }
  },
});
</script>
