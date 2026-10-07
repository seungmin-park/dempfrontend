import { onScopeDispose, readonly, ref, watch } from 'vue';
import { fetchAdminIdentity } from '@/api/admin';

export function useAdminAccess(getToken: () => string, getUsername: () => string) {
  const isAdmin = ref(false);
  let requestGeneration = 0;

  watch([getToken, getUsername], async ([token, username]) => {
    const generation = ++requestGeneration;
    isAdmin.value = false;
    if (!token || !username) return;
    try {
      const identity = await fetchAdminIdentity();
      if (generation === requestGeneration) {
        isAdmin.value = identity?.username === username && identity.id != null;
      }
    } catch {
      if (generation === requestGeneration) isAdmin.value = false;
    }
  }, { immediate: true });

  onScopeDispose(() => { requestGeneration++; });
  return { isAdmin: readonly(isAdmin) };
}
