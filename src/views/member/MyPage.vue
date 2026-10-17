<template>
  <section class="page account-page">
    <div class="page-heading"><h1>마이페이지</h1><p>저장한 공고를 다시 보고 계정 정보를 관리하세요.</p></div>
    <nav class="account-section-nav" aria-label="마이페이지 메뉴">
      <router-link :to="{ path: '/mypage', query: { tab: 'saved' } }" :aria-current="selectedTab === 'saved' ? 'page' : undefined">관심 공고</router-link>
      <router-link to="/mypage" :aria-current="selectedTab === 'settings' ? 'page' : undefined">계정 설정</router-link>
    </nav>
    <section v-if="passwordChanged" class="account-panel" role="status"><h2>비밀번호를 변경했습니다.</h2><p>모든 기기의 기존 로그인이 만료됐습니다. 새 비밀번호로 다시 로그인해 주세요.</p><router-link class="button button-primary" :to="{ path: '/login', query: { redirect: '/mypage' } }">다시 로그인</router-link></section>
    <SavedAnnouncements v-else-if="selectedTab === 'saved'" embedded />
    <p v-else-if="loading" role="status">회원 정보를 불러오는 중입니다.</p>
    <div v-else-if="loadError" role="alert"><p>{{ loadError }}</p><button class="button" data-test="retry-profile" @click="load">다시 시도</button></div>
    <div v-else-if="profile" class="account-grid">
      <section class="account-panel"><h2>회원 정보</h2><dl class="account-facts"><div><dt>아이디</dt><dd>{{ profile.username }}</dd></div><div><dt>회원 구분</dt><dd>{{ profile.admin ? '관리자' : '일반 회원' }}</dd></div></dl>
        <form data-test="nickname-form" @submit.prevent="saveNickname"><label for="nickname">닉네임</label><input id="nickname" v-model="nickname" maxlength="30" autocomplete="nickname" placeholder="사용할 닉네임을 입력하세요" :disabled="busy" aria-describedby="nickname-help nickname-result" @input="storeDraft"><p id="nickname-help" class="field-help">1~30자. 로그인 아이디는 변경되지 않습니다.</p><p id="nickname-result" :role="nicknameError ? 'alert' : 'status'">{{ nicknameError || nicknameMessage }}</p><button class="button button-primary" :disabled="busy">닉네임 저장</button></form>
      </section>
      <section class="account-panel"><h2>비밀번호 변경</h2><p>변경 후 모든 기기에서 다시 로그인해야 합니다.</p>
        <form data-test="password-form" @submit.prevent="savePassword"><label for="current-password">현재 비밀번호</label><input id="current-password" v-model="currentPassword" type="password" autocomplete="current-password" :disabled="busy"><label for="new-password">새 비밀번호</label><input id="new-password" v-model="newPassword" type="password" autocomplete="new-password" :disabled="busy" aria-describedby="password-help"><p id="password-help" class="field-help">8자 이상, UTF-8 기준 72바이트 이하 (한글은 보통 1자당 3바이트)</p><label for="confirm-password">새 비밀번호 확인</label><input id="confirm-password" v-model="confirmPassword" type="password" autocomplete="new-password" :disabled="busy"><p v-if="passwordError" role="alert">{{ passwordError }}</p><button class="button button-primary" :disabled="busy">비밀번호 변경</button></form>
      </section>
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import type { RootState } from '@/store/types';
import { useMemberAccount } from '@/composables/useMemberAccount';
import SavedAnnouncements from './SavedAnnouncements.vue';
const route = useRoute();
const selectedTab = computed(() => route.query.tab === 'saved' ? 'saved' : 'settings');
const store = useStore<RootState>();
const { profile, loading, loadError, nickname, nicknameError, nicknameMessage, currentPassword, newPassword,
  confirmPassword, passwordError, passwordChanged, busy, load, saveNickname, savePassword, storeDraft }
  = useMemberAccount(() => store.state.Login.token, () => store.state.Login.username, () => store.commit('Login/logout'));
</script>
<style scoped>
.account-page { max-width: 980px; margin-inline: auto; }
.account-page .page-heading { margin-bottom: 24px; }
.account-section-nav { display: flex; flex-wrap: wrap; gap: 24px; margin-bottom: 28px; border-bottom: 1px solid var(--line); }
.account-section-nav a { display: inline-flex; align-items: center; min-height: 48px; border-bottom: 3px solid transparent; color: var(--muted); font-weight: 650; }
.account-section-nav a[aria-current="page"] { color: var(--primary); border-bottom-color: var(--primary); }
.account-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
.account-panel { min-width: 0; padding: 28px; border: 1px solid var(--border, #e1e5ea); border-radius: 16px; background: var(--surface, #fff); }
.account-panel h2 { margin-top: 0; }
.account-panel form { display: grid; gap: 12px; }
.account-panel label { font-weight: 600; }
.account-panel input { box-sizing: border-box; width: 100%; min-height: 44px; padding: 10px 12px; border: 1px solid #b8c1cc; border-radius: 8px; font: inherit; }
.account-panel .button { min-height: 44px; justify-self: start; }
.account-facts { display: grid; gap: 16px; margin: 24px 0; }
.account-facts div { display: grid; gap: 5px; }
.account-facts dt, .field-help { color: #586579; font-size: .875rem; }
.account-facts dd { margin: 0; overflow-wrap: anywhere; }
.field-help { margin: 0; }
@media (max-width: 700px) { .account-grid { grid-template-columns: 1fr; } .account-panel { padding: 20px; } }
</style>
