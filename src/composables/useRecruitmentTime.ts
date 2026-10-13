import { onMounted, onUnmounted, ref } from 'vue';

/** Re-evaluate displayed recruitment state while open and after returning to the tab. */
export function useRecruitmentTime() {
  const now = ref(Date.now());
  let timer: ReturnType<typeof setInterval> | undefined;
  const update = () => { now.value = Date.now(); };
  onMounted(() => { timer = setInterval(update, 1000); document.addEventListener('visibilitychange', update); });
  onUnmounted(() => { clearInterval(timer); document.removeEventListener('visibilitychange', update); });
  return { recruitmentNow: now };
}
