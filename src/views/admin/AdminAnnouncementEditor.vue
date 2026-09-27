<template>
  <AsyncState :loading="loading" :error="loadError" @retry="load" />
  <template v-if="!loading && !loadError">
    <div class="admin-section-heading"><div><h2>{{ editing ? '공고 내용·수정' : '새 공고 등록' }}</h2><p>채용 공고와 교육·부트캠프를 관리하세요.</p></div><router-link class="button button-secondary" to="/admin/announcements">목록</router-link></div>
    <form class="write-form" @submit.prevent="save">
      <div class="form-grid">
        <div v-for="field in textFields" :key="field.key" class="field"><label :for="`admin-${field.key}`">{{ field.label }}</label><input :id="`admin-${field.key}`" v-model="form[field.key]" :type="field.type" required :disabled="saving" :aria-invalid="Boolean(errors[field.key])" /><p v-if="errors[field.key]" class="field-error">{{ errors[field.key] }}</p></div>
        <div class="field"><label for="admin-type">공고 종류</label><select id="admin-type" v-model="form.type" required :disabled="saving"><option value="EMP">채용</option><option value="EDU">교육·부트캠프</option></select></div>
        <div class="field"><label for="admin-position">분야</label><select id="admin-position" v-model="form.position" required :disabled="saving"><option value="">분야 선택</option><option v-for="position in positions" :key="position" :value="position">{{ formatPosition(position) }}</option></select><p v-if="errors.position" class="field-error">{{ errors.position }}</p></div>
        <div v-for="field in dateFields" :key="field.key" class="field"><label :for="`admin-${field.key}`">{{ field.label }}</label><input :id="`admin-${field.key}`" v-model="form[field.key]" type="datetime-local" step="1" required :disabled="saving" /><p v-if="errors[field.key]" class="field-error">{{ errors[field.key] }}</p></div>
        <div v-for="field in numberFields" :key="field.key" class="field"><label :for="`admin-${field.key}`">{{ field.key === 'payment' ? (form.type === 'EDU' ? '교육비 (만원, 무료는 0)' : '연봉 (만원)') : field.label }}</label><input :id="`admin-${field.key}`" v-model.number="form[field.key]" type="number" min="0" step="1" required :disabled="saving" /><p v-if="errors[field.key]" class="field-error">{{ errors[field.key] }}</p></div>
        <fieldset class="field"><legend>기술 스택</legend><div class="radio-options"><label v-for="language in languages" :key="language"><input v-model="selectedLanguages" type="checkbox" :value="language" :disabled="saving" />{{ formatLanguages([language]) }}</label></div><p v-if="errors.language" class="field-error">{{ errors.language }}</p></fieldset>
        <div class="field"><label for="admin-image">공고 이미지 (선택)</label><CompanyImage v-if="imageUrl" :src="imageUrl" :alt="form.company" class="admin-image-preview" /><input id="admin-image" type="file" accept="image/jpeg,image/png" :disabled="saving" @change="selectImage" /><p class="field-hint">{{ editing ? '선택하지 않으면 기존 이미지를 유지합니다.' : 'JPEG 또는 PNG 이미지를 선택하세요.' }}</p><p v-if="errors.image" class="field-error">{{ errors.image }}</p></div>
      </div>
      <div class="field"><AnnouncementBodyEditor :key="String($route.params.id || 'new')" id="admin-content" v-model="form.content" v-model:body-images="bodyImages" :type="form.type" :cover-bytes="form.image?.size || 0" :disabled="saving" /><p v-if="errors.content" class="field-error">{{ errors.content }}</p></div>
      <p v-if="error" role="alert" class="form-error">{{ error }}</p>
      <div class="form-actions"><router-link class="button button-secondary" to="/admin/announcements">취소</router-link><button class="button button-primary" :disabled="saving">{{ saving ? '저장 중…' : editing ? '변경 저장' : '등록하기' }}</button></div>
    </form>
  </template>
</template>
<script lang="ts">
import { announcementAttachmentError } from '@/content/announcementAttachments';
import { hasTextContent } from '@/content/sanitizeHtml';
import { defineComponent } from 'vue';
import type { AnnouncementForm, Language } from '@/types/api';
import { fetchAdminAnnouncement, saveAdminAnnouncement } from '@/api/admin';

import { requestErrorMessage, mutationErrorMessage } from '@/presentation/requestError';
import { formatPosition } from '@/presentation/positions';
import { formatLanguages } from '@/presentation/announcement';
import positions from '@/data/positions';
import AnnouncementBodyEditor from '@/components/announcement/AnnouncementBodyEditor.vue';
import AsyncState from '@/components/common/AsyncState.vue';
import CompanyImage from '@/components/common/CompanyImage.vue';
function blankForm(): AnnouncementForm { return { title: '', company: '', type: 'EMP', position: '', minCareer: 0, maxCareer: 0, payment: 0, accessUrl: '', startedDate: null, deadLineDate: null, content: '', language: [], image: null }; }
export default defineComponent({
  components: { AnnouncementBodyEditor, AsyncState, CompanyImage },
  data: () => ({ form: blankForm(), selectedLanguages: [] as Language[], bodyImages: [] as File[], imageUrl: '', loading: false, saving: false, loadError: '', error: '', errors: {} as Record<string,string>, generation: 0, positions,
    languages: ['JAVA','SPRING','JPA','HTML','CSS','React'] as Language[],
    textFields: [{ key: 'title', label: '제목', type: 'text' }, { key: 'company', label: '회사·교육기관', type: 'text' }, { key: 'accessUrl', label: '원문 공고 URL', type: 'url' }] as const,
    dateFields: [{ key: 'startedDate', label: '모집 시작' }, { key: 'deadLineDate', label: '모집 마감' }] as const,
    numberFields: [{ key: 'minCareer', label: '최소 경력 (년)' }, { key: 'maxCareer', label: '최대 경력 (년, 무관은 0)' }, { key: 'payment', label: '금액 (만원)' }] as const,
  }),
  computed: { editing(): boolean { return Boolean(this.$route.params.id); } },
  mounted() { this.load(); }, beforeUnmount() { this.generation++; },
  watch: { '$route.params.id': 'load' },
  methods: {
    formatPosition, formatLanguages,
    async load() {
      const current = ++this.generation; this.form = blankForm(); this.errors = {}; this.error = ''; this.loadError = ''; this.selectedLanguages = []; this.bodyImages = []; this.imageUrl = '';
      if (!this.editing) { this.loading = false; return; }
      this.loading = true;
      try {
        const result = await fetchAdminAnnouncement(String(this.$route.params.id));
        if (current !== this.generation) return;
        this.form = { ...blankForm(), ...result, title: result.title || '', company: result.company?.name || '', type: result.announcementType || 'EMP', position: result.position || '', content: result.content || '', accessUrl: result.accessUrl || '', image: null };
        this.selectedLanguages = result.language || []; this.imageUrl = result.image;
      } catch (reason) { if (current === this.generation) this.loadError = requestErrorMessage(reason); }
      finally { if (current === this.generation) this.loading = false; }
    },
    selectImage(event: Event) { this.form.image = (event.target as HTMLInputElement).files?.[0] || null; },
    validate(): boolean {
      const errors: Record<string,string> = {};
      for (const field of ['title','company','content'] as const) if (!this.form[field].trim()) errors[field] = '필수 항목을 입력해 주세요.';
      try { if (!['http:','https:'].includes(new URL(this.form.accessUrl).protocol)) throw new Error(); } catch { errors.accessUrl = 'http 또는 https 주소를 입력해 주세요.'; }
      if (!hasTextContent(this.form.content)) errors.content = '본문 내용을 입력해 주세요.';
      if (!this.form.position) errors.position = '분야를 선택해 주세요.';
      if (!this.selectedLanguages.length) errors.language = '기술 스택을 하나 이상 선택해 주세요.';
      if (!this.form.startedDate) errors.startedDate = '모집 시작을 입력해 주세요.';
      if (!this.form.deadLineDate || (this.form.startedDate && this.form.deadLineDate < this.form.startedDate)) errors.deadLineDate = '마감은 모집 시작보다 빠를 수 없습니다.';
      for (const field of ['minCareer','maxCareer','payment'] as const) if (!Number.isInteger(this.form[field]) || this.form[field] < 0) errors[field] = '0 이상의 정수를 입력해 주세요.';
      if (this.form.maxCareer && this.form.minCareer > this.form.maxCareer) errors.maxCareer = '최대 경력은 최소 경력보다 작을 수 없습니다.';
      const attachmentsError = announcementAttachmentError(this.form.image, this.bodyImages);
      if (attachmentsError) errors.image = attachmentsError;
      this.errors = errors; return Object.keys(errors).length === 0;
    },
    async save() {
      if (this.saving || !this.validate()) return;
      const current = this.generation, id = this.editing ? String(this.$route.params.id) : undefined;
      this.saving = true; this.error = '';
      try {
        const result = await saveAdminAnnouncement(id, { ...this.form, language: this.selectedLanguages, bodyImages: this.bodyImages });
        if (current === this.generation) this.$router.push({ path: '/admin/announcements', query: result.cleanupPending ? { cleanup: 'pending' } : {} });
      } catch (reason) { if (current === this.generation) this.error = mutationErrorMessage(reason); }
      finally { this.saving = false; }
    },
  },
});
</script>
