<template>
  <fieldset class="compensation-fields field">
    <legend>{{ type === 'EDU' ? '교육비 (선택)' : '연봉 (선택)' }}</legend>
    <template v-if="type !== 'EDU'">
      <label :for="id + '-salary-status'">연봉 공개 여부</label>
      <select :id="id + '-salary-status'" :value="salaryStatus || (payment ? 'DISCLOSED' : 'UNDISCLOSED')" :disabled="disabled" @change="changeStatus">
        <option value="UNDISCLOSED">미공개</option><option value="NEGOTIABLE">협의</option><option value="DISCLOSED">금액 공개</option>
      </select>
    </template>
    <template v-if="type === 'EDU' || salaryStatus === 'DISCLOSED' || (!salaryStatus && payment)">
      <label :for="id">{{ type === 'EDU' ? '본인 부담 교육비 (만원)' : '연봉 최소·단일 금액 (만원)' }}</label>
      <input :id="id" :value="payment ?? ''" type="number" min="0" step="1" :disabled="disabled" @input="$emit('update:payment', numberValue($event))" />
      <template v-if="type !== 'EDU'"><label :for="id + '-max'">연봉 상한 (만원, 선택)</label><input :id="id + '-max'" :value="salaryMax ?? ''" type="number" min="0" step="1" :disabled="disabled" @input="$emit('update:salaryMax', numberValue($event))" /></template>
    </template>
    <p class="field-hint">{{ type === 'EDU' ? '미확인은 비워 두고, 무료로 확인한 과정만 0을 입력하세요. 국비 지원 여부는 교육 정보에서 따로 선택합니다.' : '원문에서 확인한 세전 연봉을 만원 단위로 입력하세요. 비공개·협의는 금액을 저장하지 않습니다.' }}</p>
  </fieldset>
</template>
<script setup lang="ts">
import type { SalaryStatus } from '@/types/api';
defineProps<{ id: string; type: string; payment: number | null; salaryStatus?: SalaryStatus; salaryMax?: number | null; disabled?: boolean }>();
const emit = defineEmits<{ 'update:payment': [number | null]; 'update:salaryStatus': [SalaryStatus]; 'update:salaryMax': [number | null] }>();
function numberValue(event: Event) { const value = (event.target as HTMLInputElement).value; return value === '' ? null : Number(value); }
function changeStatus(event: Event) {
  const status = (event.target as HTMLSelectElement).value as SalaryStatus;
  emit('update:salaryStatus', status);
  if (status !== 'DISCLOSED') { emit('update:payment', null); emit('update:salaryMax', null); }
}
</script>
