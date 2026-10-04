<template>
  <div class="auth-card">
    <div class="auth-heading">
      <span class="auth-brand">DEMP</span><h1>다시 만나 반가워요</h1><p>로그인하고 다음 기회를 찾아보세요.</p>
    </div>
    <ValidationForm as="form" @submit="loginMethod" enctype="multipart/form-data">
        <label for="username">아이디</label>
        <Field
          type="text"
          id="username"
          name="username"
          v-model="username"
          placeholder="아이디를 입력하세요" autocomplete="username"
          rules="required"
          class="form-control"
        />
        <ErrorMessage class="errorMessage" name="username" as="div">
          아이디를 입력해 주세요.
        </ErrorMessage>
      <label for="password">비밀번호</label>
      <Field
          type="password"
          id="password"
          name="password"
          v-model="password"
          placeholder="비밀번호를 입력하세요" autocomplete="current-password"
          rules="required"
          class="form-control"
        />
        <ErrorMessage class="errorMessage" name="password" as="div">
          비밀번호를 입력해 주세요.
        </ErrorMessage>

      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <div class="auth-actions">
        <div class="col">
          <button type="submit" :disabled="saving" class="button button-primary">로그인</button>
        </div>
        <div class="col">
          <router-link class="button button-secondary" :to="{ path: '/account' }">
            회원가입
          </router-link>
        </div>
      </div>
    </ValidationForm>
  </div>
</template>
<script lang="ts">
import { queryText } from '@/router/query';
import { defineComponent } from "vue";
import { login } from '@/api/members';
import { ValidationForm, Field, ErrorMessage } from '@/components/common/validationComponents';
import { defineRule } from "vee-validate";
import { required, url, min_value } from "@vee-validate/rules";

defineRule("required", required);
defineRule("url", url);
defineRule("min_value", min_value);
export default defineComponent({
  components: {
    ValidationForm,
    Field,
    ErrorMessage,
  },
  data() {
    return {
      saving: false, error: "",
      username: "",
      password: "",
      token: "",
      redirect: "",
    };
  },
  created(){
    if (this.$store.state.Login.token && this.$store.state.Login.username) {
      this.$router.replace({
        path: "/",
      });
    }},
  mounted() {
    this.redirect = queryText(this.$route.query.redirect);
  },
  methods: {
    loginMethod() {
      if (this.saving) return;
      this.saving = true; this.error = "";
      const form = new FormData();
      form.append("username", this.username);
      form.append("password", this.password);
      login(form)
        .then((res) => {
          this.$store.commit("Login/setToken", res.data.jwt);
          this.$store.commit("Login/setUsername", res.data.username);
          if (!this.redirect) {
            this.$router.push("/");
          } else {
            this.$router.push({path: this.redirect});
          }
        }).catch(() => {
          this.error = "로그인하지 못했습니다. 아이디와 비밀번호를 확인하고 다시 시도해 주세요.";
      }).finally(() => { this.saving = false; });
    },
  },
});
</script>
