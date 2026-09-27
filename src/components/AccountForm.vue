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

      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <div class="auth-actions">
        <div class="col">
          <button type="reset" class="button button-secondary">취소</button>
        </div>
        <div class="col">
          <button type="submit" :disabled="saving" class="button button-primary">회원가입</button>
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
      saving: false, error: "", usernameCheckGeneration: 0,
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
      if (this.saving) return;
      this.error = "";
      if (!this.checkedUsername){
        this.error = "아이디 중복 검사를 먼저 진행해 주세요.";
        return;
      }
      this.saving = true;
      const form = new FormData();
      form.append("username", this.username);
      form.append("password", this.password);
      register(form)
        .then(() => {
          this.$router.push("/login");
        }).catch(() => { this.error = "가입하지 못했습니다. 입력한 내용을 확인하고 다시 시도해 주세요."; }).finally(() => { this.saving = false; });
    },
    validUsername(){
      const generation = ++this.usernameCheckGeneration;
      this.error = '';
      this.checkedUsername = false;
      checkUsername(this.username).then(res => {
        if (generation !== this.usernameCheckGeneration) return;
        this.checkedUsername = res.data;
        if (!res.data) this.error = '이미 사용 중인 아이디입니다.';
      }).catch(() => { if (generation === this.usernameCheckGeneration) this.error = '아이디를 확인하지 못했습니다. 다시 시도해 주세요.'; });
    },
  },
  watch: { username() { this.checkedUsername = false; this.usernameCheckGeneration++; } },
});
</script>
