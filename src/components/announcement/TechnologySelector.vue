<template>
  <fieldset class="field technology-selector">
    <legend>기술 스택 <span class="technology-selection-count">{{ modelValue.length }}개 선택</span></legend>
    <p id="technology-selection-help" class="technology-help">공고에 쓰인 기술을 선택하세요. 여러 분야를 함께 선택할 수 있습니다.</p>
    <div class="technology-search">
      <input ref="searchInput" v-model="search" aria-label="관리자 기술 스택 검색" :aria-describedby="error ? 'technology-selection-help admin-technology-error' : 'technology-selection-help'" :aria-invalid="Boolean(error)" type="search" placeholder="기술 이름으로 찾기" :disabled="disabled" />
      <button v-if="search" type="button" aria-label="기술 검색어 지우기" :disabled="disabled" @click="clearSearch">지우기</button>
    </div>
    <p v-if="error" id="admin-technology-error" role="alert" class="field-error">{{ error }}</p>
    <div class="technology-summary" aria-label="선택한 기술 스택">
      <span class="technology-summary-label">선택한 기술</span>
      <div v-if="modelValue.length" class="selected-technologies">
        <button v-for="value in modelValue" :key="value" type="button" :aria-label="`${technologyLabels[value]} 선택 해제`" :disabled="disabled" @click="removeTechnology(value)">
          {{ technologyLabels[value] }}<span aria-hidden="true">×</span>
        </button>
      </div>
      <p v-else class="technology-summary-empty">아래에서 기술을 선택하면 여기에 모입니다.</p>
    </div>
    <div class="technology-groups">
      <fieldset v-for="group in groups" :key="group.label" class="technology-group">
        <legend>{{ group.label }}</legend>
        <div class="technology-options">
          <label v-for="[value, label] in group.items" :key="value" class="technology-choice" :class="{ 'is-selected': modelValue.includes(value), 'is-disabled': disabled }">
            <input type="checkbox" :value="value" :checked="modelValue.includes(value)" :disabled="disabled" @change="toggleTechnology(value, ($event.target as HTMLInputElement).checked)" />
            <span>{{ label }}</span>
          </label>
        </div>
      </fieldset>
    </div>
    <p v-if="!groups.length" role="status" class="technology-empty">일치하는 기술이 없습니다. 검색어를 바꾸거나 지워 주세요.</p>
  </fieldset>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { matchingTechnologyGroups, technologyLabels, type Technology } from '@/data/technologies';

const props = defineProps<{ modelValue: Technology[]; disabled?: boolean; error?: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: Technology[]] }>();
const search = ref('');
const searchInput = ref<HTMLInputElement>();
const groups = computed(() => matchingTechnologyGroups(search.value));
function removeTechnology(value: Technology) {
  if (!props.disabled) emit('update:modelValue', props.modelValue.filter(selected => selected !== value));
}
function toggleTechnology(value: Technology, selected: boolean) {
  if (props.disabled) return;
  if (!selected) { removeTechnology(value); return; }
  if (!props.modelValue.includes(value)) emit('update:modelValue', [...props.modelValue, value]);
}
function clearSearch() { if (!props.disabled) { search.value = ''; searchInput.value?.focus(); } }
</script>

<style scoped>
.technology-selector { border: 0; padding: 0; margin: 28px 0 0; min-width: 0; }
.technology-selector > legend { padding: 0; font-size: 15px; font-weight: 650; color: var(--ink); }
.technology-selection-count { display: inline-block; margin-left: 8px; padding: 3px 8px; border-radius: 6px; color: var(--primary); background: var(--primary-soft); font-size: 12px; font-weight: 600; vertical-align: middle; }
.technology-help { margin: 10px 0 16px; font-size: 13px; line-height: 1.6; color: var(--muted); }
.technology-search { position: relative; max-width: 420px; }
.technology-search input { width: 100%; min-height: 44px; padding-right: 72px; }
.technology-search input::-webkit-search-cancel-button { appearance: none; }
.technology-search button { position: absolute; right: 4px; top: 0; min-height: 44px; padding: 0 12px; border: 0; background: transparent; color: var(--muted); font: inherit; font-size: 12px; }
.technology-summary { display: flex; align-items: flex-start; gap: 12px; margin: 18px 0 24px; padding: 14px 0; border-block: 1px solid var(--line); }
.technology-summary-label { flex-shrink: 0; padding-top: 13px; font-size: 12px; font-weight: 600; color: var(--muted); }
.selected-technologies { display: flex; flex-wrap: wrap; gap: 6px; }
.selected-technologies button { display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 8px 12px; border: 1px solid #c7d2fe; border-radius: 8px; background: var(--primary-soft); color: var(--primary-dark); font: inherit; font-size: 13px; font-weight: 600; }
.selected-technologies button span { color: var(--primary); font-size: 18px; font-weight: 400; }
.technology-summary-empty { margin: 0; padding: 11px 0; font-size: 13px; line-height: 1.7; color: var(--meta); }
.technology-groups { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; gap: 20px; }
.technology-group { min-width: 0; margin: 0; padding: 18px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }
.technology-group > legend { float: left; width: 100%; padding: 0 0 14px; font-size: 14px; font-weight: 650; color: var(--ink); }
.technology-options { clear: both; display: flex; flex-wrap: wrap; gap: 8px; }
.technology-choice { min-height: 44px; padding: 9px 12px; gap: 7px; font-size: 13px; border-radius: 7px; }
.technology-choice input { width: 15px; height: 15px; accent-color: var(--primary); }
.technology-choice.is-selected { border-color: #a5b4fc; color: var(--primary-dark); }
.technology-empty { margin: 0; padding: 24px; border: 1px dashed var(--line); border-radius: 12px; font-size: 14px; color: var(--muted); text-align: center; }
.technology-selector button:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.technology-selector button:disabled { opacity: .6; cursor: default; }
@media (max-width: 768px) { .technology-groups { grid-template-columns: minmax(0, 1fr); gap: 14px; } }
@media (max-width: 480px) { .technology-group { padding: 16px; } .technology-summary { flex-direction: column; gap: 8px; } .technology-summary-label { padding: 0; } .technology-summary-empty { padding: 0; } }
</style>
