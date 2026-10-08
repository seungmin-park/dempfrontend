<template>
  <div ref="root" class="recruitment-datetime">
    <label :for="id">{{ label }}</label>
    <div class="datetime-input-row">
      <input :id="id" type="datetime-local" :value="modelValue?.slice(0, 16)" step="60" required :disabled="disabled"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value || null)" />
      <button ref="trigger" type="button" class="calendar-trigger" :aria-label="`${label} 달력 열기`"
        :aria-expanded="open" :aria-controls="`${id}-calendar`" :disabled="disabled" @click="toggleCalendar">
        <span aria-hidden="true">달력</span>
      </button>
    </div>
    <div v-if="open" :id="`${id}-calendar`" role="dialog" :aria-label="`${label} 날짜 선택`" class="recruitment-calendar" :data-placement="above ? 'above' : 'below'" :style="{ maxHeight: calendarMaxHeight === undefined ? undefined : `${calendarMaxHeight}px` }"
      @keydown.esc.stop.prevent="closeCalendar" @keydown="moveFocus">
      <div class="calendar-heading">
        <button type="button" aria-label="이전 달" :disabled="year === 1 && month === 0" @click="moveMonth(-1)">‹</button>
        <strong aria-live="polite">{{ year }}년 {{ month + 1 }}월</strong>
        <button type="button" aria-label="다음 달" :disabled="year === 9999 && month === 11" @click="moveMonth(1)">›</button>
      </div>
      <div class="calendar-weekdays" aria-hidden="true"><span v-for="day in weekdays" :key="day">{{ day }}</span></div>
      <div class="calendar-days" role="group" :aria-label="`${year}년 ${month + 1}월 날짜`">
        <span v-for="blank in firstWeekday" :key="`blank-${blank}`" />
        <button v-for="day in daysInMonth" :key="day" type="button" :data-day="day" :aria-label="dayLabel(day)"
          :aria-pressed="selectedDate === dateValue(day)" :aria-current="today === dateValue(day) ? 'date' : undefined"
          :tabindex="focusedDay === day ? 0 : -1" @focus="focusedDay = day" @click="selectDate(day)">{{ day }}</button>
      </div>
      <div class="calendar-footer"><span>시각은 입력한 시·분을 유지합니다.</span><button type="button" @click="closeCalendar">닫기</button></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps<{ id: string; label: string; modelValue: string | null | undefined; disabled?: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>();
const root = ref<HTMLElement>();
const trigger = ref<HTMLButtonElement>();
const open = ref(false);
const above = ref(false);
const calendarMaxHeight = ref<number>();
const year = ref(2026);
const month = ref(0);
const focusedDay = ref(1);
const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
const pad = (value: number) => String(value).padStart(2, '0');
const localDate = (value: Date) => `${String(value.getFullYear()).padStart(4, '0')}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
const today = localDate(new Date());
const selectedDate = computed(() => props.modelValue?.slice(0, 10));
const monthDate = (day: number) => {
  const date = new Date(0);
  date.setFullYear(year.value, month.value, day);
  date.setHours(12, 0, 0, 0);
  return date;
};
const firstWeekday = computed(() => monthDate(1).getDay());
const daysInMonth = computed(() => { const date = monthDate(1); date.setMonth(month.value + 1, 0); return date.getDate(); });
const dateValue = (day: number) => localDate(monthDate(day));
const dayLabel = (day: number) => `${year.value}년 ${month.value + 1}월 ${day}일`;

async function focusDate() {
  await nextTick();
  positionCalendar();
  await nextTick();
  root.value?.querySelector<HTMLButtonElement>(`[data-day="${focusedDay.value}"]`)?.focus();
}
function positionCalendar() {
  if (!open.value || !root.value) return;
  if (window.innerWidth <= 480) { above.value = false; calendarMaxHeight.value = undefined; return; }
  const anchor = root.value.getBoundingClientRect();
  const calendar = root.value.querySelector<HTMLElement>('.recruitment-calendar');
  const height = Math.max(calendar?.getBoundingClientRect().height ?? 0, (calendar?.scrollHeight ?? 0) + 2);
  const belowSpace = Math.max(0, window.innerHeight - anchor.bottom - 16);
  const aboveSpace = Math.max(0, anchor.top - 16);
  above.value = belowSpace < height && aboveSpace > belowSpace;
  calendarMaxHeight.value = above.value ? aboveSpace : belowSpace;
}
function closeCalendar() { open.value = false; trigger.value?.focus(); }
async function toggleCalendar() {
  if (open.value) { closeCalendar(); return; }
  if (props.disabled) return;
  const parts = /^(\d{4})-(\d{2})-(\d{2})/.exec(props.modelValue || today);
  year.value = Number(parts?.[1]) || new Date().getFullYear();
  month.value = Number(parts?.[2] || 1) - 1;
  focusedDay.value = Number(parts?.[3]) || 1;
  open.value = true;
  await focusDate();
}
function selectDate(day: number) {
  if (props.disabled) return;
  const time = props.modelValue?.slice(11, 16) || '00:00';
  emit('update:modelValue', `${dateValue(day)}T${time}`);
  closeCalendar();
}
async function moveMonth(delta: number) {
  const target = year.value * 12 + month.value + delta;
  if (target < 12 || target >= 10000 * 12) return;
  year.value = Math.floor(target / 12);
  month.value = target % 12;
  focusedDay.value = Math.min(focusedDay.value, daysInMonth.value);
  await focusDate();
}
async function moveFocus(event: KeyboardEvent) {
  if (!(event.target instanceof HTMLElement) || !event.target.hasAttribute('data-day')) return;
  const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
  if (event.key === 'PageUp' || event.key === 'PageDown') { event.preventDefault(); await moveMonth(event.key === 'PageUp' ? -1 : 1); return; }
  if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); focusedDay.value = event.key === 'Home' ? 1 : daysInMonth.value; await focusDate(); return; }
  const offset = offsets[event.key];
  if (offset === undefined) return;
  event.preventDefault();
  const date = monthDate(focusedDay.value + offset);
  if (date.getFullYear() < 1 || date.getFullYear() > 9999) return;
  year.value = date.getFullYear(); month.value = date.getMonth(); focusedDay.value = date.getDate();
  await focusDate();
}
function onOutsidePointer(event: PointerEvent) {
  if (open.value && event.target instanceof Node && !root.value?.contains(event.target)) open.value = false;
}
function onFocusOut(event: FocusEvent) {
  if (open.value && event.relatedTarget instanceof Node && !root.value?.contains(event.relatedTarget)) open.value = false;
}
watch(() => props.disabled, disabled => { if (disabled) open.value = false; });
onMounted(() => { document.addEventListener('pointerdown', onOutsidePointer); root.value?.addEventListener('focusout', onFocusOut); window.addEventListener('resize', positionCalendar); document.addEventListener('scroll', positionCalendar, true); });
onBeforeUnmount(() => { document.removeEventListener('pointerdown', onOutsidePointer); root.value?.removeEventListener('focusout', onFocusOut); window.removeEventListener('resize', positionCalendar); document.removeEventListener('scroll', positionCalendar, true); });
</script>

<style scoped>
.recruitment-datetime { position: relative; min-width: 0; }
.recruitment-datetime > label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px; }
.datetime-input-row { display: flex; gap: 8px; }
.datetime-input-row input { min-width: 0; width: 100%; flex: 1; }
.datetime-input-row input::-webkit-calendar-picker-indicator { display: none; }
.calendar-trigger { flex-shrink: 0; min-height: 44px; padding: 0 12px; background: var(--primary-soft); color: var(--primary); border: 1px solid var(--line); border-radius: 8px; font-weight: 600; }
.recruitment-calendar { position: absolute; top: 100%; left: 0; z-index: 12; width: min(310px, 100%); box-sizing: border-box; max-height: calc(100vh - 32px); overflow: auto; padding: 14px; margin-top: 8px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; box-shadow: 0 12px 32px #0f172a18; }
.recruitment-calendar[data-placement=above] { top: auto; bottom: 100%; margin-top: 0; margin-bottom: 8px; }
.calendar-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.calendar-heading button { width: 40px; height: 40px; font-size: 24px; }
.calendar-heading strong { font-size: 15px; }
.calendar-weekdays, .calendar-days { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; text-align: center; }
.calendar-weekdays { margin-bottom: 8px; color: var(--muted); font-size: 12px; }
.calendar-days button { min-width: 0; min-height: 34px; padding: 6px 0; font-size: 13px; border-radius: 6px; }
.recruitment-calendar button { background: transparent; border: 0; color: var(--ink); }
.recruitment-calendar button:hover { background: var(--primary-soft); color: var(--primary); }
.calendar-days button[aria-pressed=true] { background: var(--primary); color: white; font-weight: 650; }
.calendar-days button[aria-current=date] { box-shadow: inset 0 0 0 1px var(--primary); }
.calendar-footer { display: flex; justify-content: space-between; align-items: center; gap: 8px; border-top: 1px solid var(--line); margin-top: 12px; padding-top: 10px; font-size: 11px; color: var(--muted); }
.calendar-footer button { min-height: 36px; padding: 6px; font-size: 12px; }
@media (max-width: 480px) { .recruitment-calendar { position: relative; width: 100%; top: auto; } }
</style>
