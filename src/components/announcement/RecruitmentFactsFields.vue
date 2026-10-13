<template>
  <fieldset class="recruitment-facts">
    <legend>직무별 조건·근무 정보</legend>
    <p class="field-hint">여러 직무는 한 공고에 함께 기록하세요. 각 직무의 필수·우대·조직 사용 기술을 구분하고, “또는” 같은 원문 조건을 유지하세요.</p>
    <div class="field"><label for="admin-work-period">근무 기간 (선택)</label><input id="admin-work-period" :value="workPeriod || ''" maxlength="1000" :disabled="disabled" @input="$emit('update:workPeriod', ($event.target as HTMLInputElement).value)" placeholder="예: 10월부터 약 5개월" /></div>
    <div class="field"><label for="admin-conversion-note">전환·계약 조건 (선택)</label><input id="admin-conversion-note" :value="conversionNote || ''" maxlength="1000" :disabled="disabled" @input="$emit('update:conversionNote', ($event.target as HTMLInputElement).value)" placeholder="예: 정규직 전환 및 계약 연장 불가" /></div>
    <fieldset v-for="(role, index) in roles" :key="index" class="role-fields">
      <legend>직무 {{ index + 1 }}</legend>
      <div class="field"><label :for="`role-${index}-title`">직무 이름</label><input :id="`role-${index}-title`" :aria-label="`직무 ${index + 1} 이름`" :value="role.title" maxlength="255" required :disabled="disabled" @input="update(index, 'title', ($event.target as HTMLInputElement).value)" /></div>
      <div class="field"><label :for="`role-${index}-position`">분야</label><select :id="`role-${index}-position`" :aria-label="`직무 ${index + 1} 분야`" :value="role.position || ''" :disabled="disabled" @change="update(index, 'position', ($event.target as HTMLSelectElement).value)"><option value="">미확인</option><option v-for="position in positions" :key="position" :value="position">{{ formatPosition(position) }}</option></select></div>
      <div v-for="field in roleTextFields" :key="field.key" class="field"><label :for="`role-${index}-${field.key}`">{{ field.label }}</label><textarea :id="`role-${index}-${field.key}`" :aria-label="`직무 ${index + 1} ${field.label}`" :value="role[field.key] || ''" :maxlength="field.key === 'location' ? 255 : 2000" :disabled="disabled" rows="2" @input="update(index, field.key, ($event.target as HTMLTextAreaElement).value)" /></div>
      <button type="button" class="button button-secondary" :disabled="disabled" :aria-label="`직무 ${index + 1} 삭제`" @click="$emit('update:roles', roles.filter((_, i) => i !== index))">직무 삭제</button>
    </fieldset>
    <button type="button" class="button button-secondary" aria-label="직무 추가" :disabled="disabled || roles.length >= 30" @click="$emit('update:roles', [...roles, { title: '', position: '' }])">직무 추가</button>
  </fieldset>
</template>
<script setup lang="ts">
import type { RecruitmentRole } from '@/types/api';
import positions from '@/data/positions';
import { formatPosition } from '@/presentation/positions';
const props = defineProps<{ roles: RecruitmentRole[]; workPeriod?: string | null | undefined; conversionNote?: string | null | undefined; disabled?: boolean }>();
const emit = defineEmits<{ 'update:roles': [RecruitmentRole[]]; 'update:workPeriod': [string]; 'update:conversionNote': [string] }>();
const roleTextFields = [{ key: 'location', label: '근무지' }, { key: 'qualifications', label: '경력·학력 조건' }, { key: 'requiredSkills', label: '필수 요건' }, { key: 'preferredSkills', label: '우대 요건' }, { key: 'usedTechnologies', label: '조직 사용 기술' }] as const;
function update(index: number, key: keyof RecruitmentRole, value: string) {
  emit('update:roles', props.roles.map((role, i) => i === index ? { ...role, [key]: value } : role));
}
</script>
<style scoped>
.recruitment-facts { border: 0; padding: 0; margin: 24px 0; min-width: 0; }
.role-fields { min-width: 0; border: 1px solid var(--line); border-radius: 8px; padding: 16px; margin: 16px 0; }
textarea { width: 100%; resize: vertical; }
</style>
