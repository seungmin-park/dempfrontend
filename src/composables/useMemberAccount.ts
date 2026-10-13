import { computed, onScopeDispose, ref, watch } from 'vue';
import { getMyProfile, updateMyNickname, changeMyPassword, type MemberProfile } from '@/api/members';
import { getLoginRateLimit } from '@/api/members';
import { requestErrorMessage } from '@/presentation/requestError';

export function useMemberAccount(getToken: () => string, getUsername: () => string, logout: () => void) {
  const profile = ref<MemberProfile | null>(null), loading = ref(false), loadError = ref('');
  const nickname = ref(''), nicknameError = ref(''), nicknameMessage = ref(''), savingNickname = ref(false);
  const currentPassword = ref(''), newPassword = ref(''), confirmPassword = ref('');
  const passwordError = ref(''), savingPassword = ref(false), passwordChanged = ref(false);
  const busy = computed(() => savingNickname.value || savingPassword.value);
  let generation = 0;
  const draftKey = () => `demp:nickname-draft:${getUsername()}`;
  function readDraft() { try { return sessionStorage.getItem(draftKey()); } catch { return null; } }
  function storeDraft() { try { if (getUsername()) sessionStorage.setItem(draftKey(), nickname.value); } catch { /* Storage can be disabled. In-memory input remains. */ } }
  function clearDraft() { try { sessionStorage.removeItem(draftKey()); } catch { /* Optional draft storage. */ } }
  function clearPasswords() { currentPassword.value = ''; newPassword.value = ''; confirmPassword.value = ''; }
  async function load() {
    const request = ++generation;
    loading.value = true; loadError.value = '';
    try {
      const { data } = await getMyProfile();
      if (request !== generation) return;
      profile.value = data; nickname.value = readDraft() ?? data.nickname ?? '';
    } catch (error) { if (request === generation) loadError.value = requestErrorMessage(error); }
    finally { if (request === generation) loading.value = false; }
  }
  async function saveNickname() {
    if (busy.value) return;
    nicknameError.value = ''; nicknameMessage.value = '';
    if (!nickname.value.trim() || nickname.value.trim().length > 30) { nicknameError.value = '닉네임을 1~30자로 입력해 주세요.'; return; }
    storeDraft();
    const request = generation;
    savingNickname.value = true;
    try {
      const { data } = await updateMyNickname(nickname.value.trim());
      if (request !== generation) return;
      profile.value = data; nickname.value = data.nickname ?? ''; clearDraft(); nicknameMessage.value = '닉네임을 저장했습니다.';
    } catch { if (request === generation) nicknameError.value = '닉네임을 저장하지 못했습니다. 입력은 유지되니 다시 시도해 주세요.'; }
    finally { if (request === generation) savingNickname.value = false; }
  }
  async function savePassword() {
    if (busy.value) return;
    passwordError.value = '';
    if (!currentPassword.value) { passwordError.value = '현재 비밀번호를 입력해 주세요.'; return; }
    if (newPassword.value.length < 8 || !newPassword.value.trim() || new TextEncoder().encode(newPassword.value).length > 72) {
      passwordError.value = '새 비밀번호는 8자 이상, UTF-8 기준 72바이트 이하로 입력해 주세요.'; return;
    }
    if (newPassword.value !== confirmPassword.value) { passwordError.value = '새 비밀번호와 확인이 일치하지 않습니다.'; return; }
    const request = generation;
    savingPassword.value = true;
    try {
      await changeMyPassword(currentPassword.value, newPassword.value);
      if (request !== generation) return;
      passwordChanged.value = true; clearPasswords(); clearDraft(); logout();
    } catch (error) {
      if (request !== generation) return;
      const limit = getLoginRateLimit(error);
      passwordError.value = limit ? '확인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.'
        : '현재 비밀번호와 새 비밀번호 조건을 확인해 주세요. 연결 오류라면 다시 시도해 주세요.';
    } finally { if (request === generation) savingPassword.value = false; }
  }
  watch([getToken, getUsername], ([token]) => {
    generation++; profile.value = null; clearPasswords(); savingNickname.value = false; savingPassword.value = false;
    if (token) { passwordChanged.value = false; void load(); }
  }, { immediate: true });
  onScopeDispose(() => { generation++; clearPasswords(); });
  return { profile, loading, loadError, nickname, nicknameError, nicknameMessage, currentPassword, newPassword,
    confirmPassword, passwordError, passwordChanged, busy, load, saveNickname, savePassword, storeDraft };
}
