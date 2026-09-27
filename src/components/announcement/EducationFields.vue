<template>
  <fieldset class="education-fields">
    <legend>교육과정 정보 <span class="field-hint">선택 입력</span></legend>
    <p class="field-hint">원문에서 확인한 조건만 입력하세요. 미확인은 비워 두고, 모집 기간과 실제 교육 일정을 구분해 주세요.</p>
    <div class="form-grid">
      <div class="field" v-for="field in educationFields" :key="field.key"><label :for="id + field.key">{{ field.label }}</label><select :id="id + field.key" :aria-label="field.label" :value="modelValue[field.key] || ''" :disabled="disabled" @change="update(field.key, $event)"><option value="">미확인</option><option v-for="(label,value) in field.options" :key="value" :value="value">{{ label }}</option></select></div>
      <div class="field"><label :for="id + 'start'">교육 시작일</label><input :id="id + 'start'" aria-label="교육 시작일" type="date" :value="modelValue.learningStartDate || ''" :disabled="disabled" @input="update('learningStartDate', $event)" /></div>
      <div class="field"><label :for="id + 'end'">교육 종료일</label><input :id="id + 'end'" aria-label="교육 종료일" type="date" :value="modelValue.learningEndDate || ''" :disabled="disabled" @input="update('learningEndDate', $event)" /></div>
    </div>
    <p class="field-hint">국비·기관 지원과 본인 부담 교육비는 별개입니다. 구체적인 요일·시간, 대상 자격, 지원 조건은 본문에 적어주세요.</p>
    <p v-if="educationError(modelValue)" class="field-error">{{ educationError(modelValue) }}</p>
  </fieldset>
</template>
<script setup lang="ts">
import { educationFields, educationError, type EducationInfo } from '@/data/education';
const props = defineProps<{ modelValue: EducationInfo; id: string; disabled?: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [EducationInfo] }>();
function update(key: keyof EducationInfo, event: Event) { emit('update:modelValue', { ...props.modelValue, [key]: (event.target as HTMLInputElement).value || null }); }
</script>
