<template>
  <AsyncState :loading="loading" :error="loadError" @retry="load" />
  <template v-if="!loading && !loadError">
    <div class="admin-section-heading"><div><h2>{{ editing ? '공고 내용·수정' : '새 공고 등록' }}</h2><p>채용 공고와 교육·부트캠프를 관리하세요.</p></div><router-link class="button button-secondary" to="/admin/announcements">목록</router-link></div>
    <form class="write-form" @submit.prevent="save">
      <div class="form-grid">
        <div class="field"><label><input type="checkbox" v-model="form.recruitmentClosed" :disabled="saving" /> 모집 종료 (수동 마감)</label><p class="field-hint">공개 상태는 유지하고 모집 중 검색에서 제외합니다.</p></div>
        <div class="field"><label for="admin-publication">게시 상태</label><select id="admin-publication" aria-label="게시 상태" v-model="form.publicationStatus" :disabled="saving"><option v-for="(label, value) in publicationLabels" :key="value" :value="value">{{ label }}</option></select><p class="field-hint">공개 상태만 서비스에 표시됩니다. 모집 마감과 게시 상태는 별개입니다.</p></div>
        <div class="field"><label for="admin-source">출처 이름</label><input id="admin-source" aria-label="출처 이름" v-model="form.sourceName" maxlength="255" :disabled="saving" placeholder="예: 회사 채용 홈페이지" /></div>
        <div class="field"><label for="admin-source-id">원문 식별값 (선택)</label><input id="admin-source-id" v-model="form.sourceIdentifier" maxlength="255" :disabled="saving" placeholder="원문 사이트의 공고 번호" /></div>
        <div class="field"><label for="admin-apply-url">지원 URL (선택)</label><input id="admin-apply-url" aria-label="지원 URL (선택)" type="url" v-model="form.applicationUrl" :disabled="saving" /><p class="field-hint">비워 두면 원문 공고로 이동합니다.</p><p v-if="errors.applicationUrl" class="field-error">{{ errors.applicationUrl }}</p></div>
        <div class="field"><label><input type="checkbox" v-model="form.sourceVerified" :disabled="saving" /> 원문 내용을 직접 확인했습니다</label><p class="field-hint">저장할 때 확인 시각을 기록합니다. 원문 주소를 바꾸면 다시 확인하세요.</p></div>
        <div v-for="field in textFields" :key="field.key" class="field"><label :for="`admin-${field.key}`">{{ field.label }}</label><input :id="`admin-${field.key}`" v-model="form[field.key]" :type="field.type" required :disabled="saving" :aria-invalid="Boolean(errors[field.key])" /><p v-if="errors[field.key]" class="field-error">{{ errors[field.key] }}</p></div>
        <div class="field"><label for="admin-type">공고 종류</label><select id="admin-type" v-model="form.type" @change="changeType" required :disabled="saving"><option value="EMP">채용</option><option value="EDU">교육·부트캠프</option></select></div>
        <div class="field"><label for="admin-position">분야</label><select id="admin-position" v-model="form.position" required :disabled="saving"><option value="">분야 선택</option><option v-for="position in positions" :key="position" :value="position">{{ formatPosition(position) }}</option></select><p v-if="errors.position" class="field-error">{{ errors.position }}</p></div>
        <div v-for="field in dateFields" :key="field.key" class="field"><label :for="`admin-${field.key}`">{{ field.label }}</label><input :id="`admin-${field.key}`" :value="form[field.key]?.slice(0, 16)" @input="changeDate(field.key, $event)" type="datetime-local" step="60" required :disabled="saving" /><p v-if="errors[field.key]" class="field-error">{{ errors[field.key] }}</p></div>
        <div v-if="form.type === 'EMP'" class="field"><label for="admin-audience">모집 대상</label><select id="admin-audience" aria-label="모집 대상" v-model="form.recruitmentAudience" :disabled="saving" @change="changeAudience"><option :value="null">미확인 (기존 경력 범위 사용)</option><option value="NEW">신입</option><option value="EXPERIENCED">경력</option><option value="ANY">경력 무관</option><option value="MIXED">신입·경력</option></select></div>
        <div v-if="form.type === 'EMP'" class="field"><label for="admin-employment">고용 형태</label><select id="admin-employment" aria-label="고용 형태" v-model="form.employmentType" :disabled="saving"><option :value="null">미확인</option><option v-for="(label, value) in employmentTypeLabels" :key="value" :value="value">{{ label }}</option></select></div>
        <div v-for="field in numberFields" :key="field.key" class="field"><label :for="`admin-${field.key}`">{{ field.label }}</label><input :id="`admin-${field.key}`" v-model.number="form[field.key]" type="number" min="0" step="1" required :disabled="saving" /><p v-if="errors[field.key]" class="field-error">{{ errors[field.key] }}</p></div>
        <CompensationFields id="admin-payment" :type="form.type" v-model:payment="form.payment" v-model:salary-status="form.salaryStatus" v-model:salary-max="form.salaryMax" :disabled="saving" /><p v-if="errors.payment" class="field-error">{{ errors.payment }}</p>
        <fieldset class="field"><legend>기술 스택</legend><div class="technology-options"><label v-for="language in languages" :key="language" class="technology-choice" :class="{ 'is-selected': selectedLanguages.includes(language), 'is-disabled': saving }"><input v-model="selectedLanguages" type="checkbox" :value="language" :disabled="saving" /><span>{{ formatLanguages([language]) }}</span></label></div><p v-if="errors.language" class="field-error">{{ errors.language }}</p></fieldset>
        <div class="field"><label for="admin-image">공고 이미지 (선택)</label><CompanyImage v-if="imageUrl" :src="imageUrl" :alt="form.company" class="admin-image-preview" /><input id="admin-image" type="file" accept="image/jpeg,image/png" :disabled="saving" @change="selectImage" /><p class="field-hint">{{ editing ? '선택하지 않으면 기존 이미지를 유지합니다.' : 'JPEG 또는 PNG 이미지를 선택하세요.' }}</p><p v-if="errors.image" class="field-error">{{ errors.image }}</p></div>
      </div>
      <EducationFields v-if="form.type === 'EDU'" id="admin-education-" :model-value="form" @update:model-value="Object.assign(form, $event)" :disabled="saving" />
      <div class="field"><AnnouncementBodyEditor :key="String($route.params.id || 'new')" id="admin-content" v-model="form.content" @update:body-images="bodyImages = $event" :type="form.type" :cover-bytes="form.image?.size || 0" :disabled="saving" /><p v-if="errors.content" class="field-error">{{ errors.content }}</p></div>
      <p v-if="error" role="alert" class="form-error">{{ error }}</p>
      <div class="form-actions"><router-link class="button button-secondary" to="/admin/announcements">취소</router-link><button class="button button-primary" :disabled="saving">{{ saving ? '저장 중…' : editing ? '변경 저장' : '등록하기' }}</button></div>
    </form>
    <section v-if="editing" class="publication-history" aria-labelledby="publication-history-title">
      <header class="publication-history-heading"><h3 id="publication-history-title">변경 이력</h3><button type="button" class="button button-secondary" @click="loadHistory">이력 보기</button></header>
      <p v-if="historyError" role="alert" class="field-error">{{ historyError }}</p>
      <ol v-if="history.length" class="publication-history-list" aria-label="공고 변경 이력">
        <li v-for="(entry, index) in history" :key="index">
          <div class="history-meta"><time :datetime="entry.changedAt">{{ formatRecruitDate(entry.changedAt) }}</time><span class="history-actor">{{ entry.actor }}</span><span class="history-status">{{ publicationLabels[entry.status] }}</span></div>
          <p class="history-title">{{ entry.title }}</p>
        </li>
      </ol>
      <p v-if="historyLoaded && !history.length" class="field-hint">기록된 변경 이력이 없습니다. 이전에 등록된 공고는 다음 저장부터 기록됩니다.</p>
    </section>
  </template>
</template>
<script lang="ts">
import { publicationLabels } from '@/presentation/publication';
import type { PublicationRevision } from '@/types/api';
import EducationFields from '@/components/announcement/EducationFields.vue';
import { educationError } from '@/data/education';
import CompensationFields from '@/components/announcement/CompensationFields.vue';
import { compensationError } from '@/presentation/compensation';
import { announcementAttachmentError } from '@/content/announcementAttachments';
import { hasTextContent } from '@/content/sanitizeHtml';
import { defineComponent } from 'vue';
import type { AnnouncementForm, Language } from '@/types/api';
import { fetchAdminAnnouncement, saveAdminAnnouncement, fetchPublicationHistory } from '@/api/admin';

import { requestErrorMessage, mutationErrorMessage } from '@/presentation/requestError';
import { formatPosition } from '@/presentation/positions';
import { employmentTypeLabels, formatLanguages, formatRecruitDate } from '@/presentation/announcement';
import positions from '@/data/positions';
import AnnouncementBodyEditor from '@/components/announcement/AnnouncementBodyEditor.vue';
import AsyncState from '@/components/common/AsyncState.vue';
import CompanyImage from '@/components/common/CompanyImage.vue';
function blankForm(): AnnouncementForm { return { employmentType: null, recruitmentClosed: false, recruitmentAudience: null, cohort: '', stipendAmount: null, stipendNote: '', publicationStatus: 'DRAFT', sourceName: '', sourceIdentifier: '', applicationUrl: '', sourceVerified: false, title: '', company: '', type: 'EMP', position: '', minCareer: 0, maxCareer: 0, payment: null, salaryMax: null, accessUrl: '', startedDate: null, deadLineDate: null, content: '', language: [], image: null }; }
export default defineComponent({
  components: { EducationFields, CompensationFields, AnnouncementBodyEditor, AsyncState, CompanyImage },
  data: () => ({ employmentTypeLabels, publicationLabels, history: [] as PublicationRevision[], historyError: '', historyLoaded: false, form: blankForm(), selectedLanguages: [] as Language[], bodyImages: [] as File[], imageUrl: '', loading: false, saving: false, loadError: '', error: '', errors: {} as Record<string,string>, generation: 0, positions,
    languages: ['JAVA','SPRING','JPA','HTML','CSS','React'] as Language[],
    textFields: [{ key: 'title', label: '제목', type: 'text' }, { key: 'company', label: '회사·교육기관', type: 'text' }, { key: 'accessUrl', label: '원문 공고 URL', type: 'url' }] as const,
    dateFields: [{ key: 'startedDate', label: '모집 시작' }, { key: 'deadLineDate', label: '모집 마감' }] as const,
    numberFields: [{ key: 'minCareer', label: '최소 경력 (년)' }, { key: 'maxCareer', label: '최대 경력 (년, 무관은 0)' }] as const,
  }),
  computed: { editing(): boolean { return Boolean(this.$route.params.id); } },
  mounted() { this.load(); }, beforeUnmount() { this.generation++; },
  watch: { '$route.params.id': 'load', 'form.accessUrl'() { this.form.sourceVerified = false; } },
  methods: {
    formatPosition, formatLanguages, formatRecruitDate,
    changeDate(field: 'startedDate' | 'deadLineDate', event: Event) { this.form[field] = (event.target as HTMLInputElement).value || null; },
    async loadHistory() {
      const current = this.generation; this.historyError = '';
      try { const history = await fetchPublicationHistory(String(this.$route.params.id)); if (current === this.generation) { this.history = history; this.historyLoaded = true; } }
      catch (reason) { if (current === this.generation) this.historyError = requestErrorMessage(reason); }
    },
    changeAudience() { if (this.form.recruitmentAudience === 'NEW' || this.form.recruitmentAudience === 'ANY') { this.form.minCareer = 0; this.form.maxCareer = 0; } },
    changeType() { this.form.employmentType = null; this.form.recruitmentAudience = null; this.form.cohort = ''; this.form.stipendAmount = null; this.form.stipendNote = '';  this.form.payment = null; delete this.form.salaryStatus; this.form.salaryMax = null; },
    async load() {
      const current = ++this.generation; this.form = blankForm(); this.history = []; this.historyLoaded = false; this.historyError = ''; this.errors = {}; this.error = ''; this.loadError = ''; this.selectedLanguages = []; this.bodyImages = []; this.imageUrl = '';
      if (!this.editing) { this.loading = false; return; }
      this.loading = true;
      try {
        const result = await fetchAdminAnnouncement(String(this.$route.params.id));
        if (current !== this.generation) return;
        this.form = { ...blankForm(), ...result, ...result.education, title: result.title || '', company: result.company?.name || '', type: result.announcementType || 'EMP', position: result.position || '', content: result.content || '', accessUrl: result.accessUrl || '', image: null };
        await this.$nextTick(); if (current !== this.generation) return; this.form.sourceVerified = Boolean(result.sourceVerifiedAt);
        this.selectedLanguages = result.language || []; this.imageUrl = result.image;
      } catch (reason) { if (current === this.generation) this.loadError = requestErrorMessage(reason); }
      finally { if (current === this.generation) this.loading = false; }
    },
    selectImage(event: Event) { this.form.image = (event.target as HTMLInputElement).files?.[0] || null; },
    validate(): boolean {
      const errors: Record<string,string> = {};
      for (const field of ['title','company','content'] as const) if (!this.form[field].trim()) errors[field] = '필수 항목을 입력해 주세요.';
      try { if (!['http:','https:'].includes(new URL(this.form.accessUrl).protocol)) throw new Error(); } catch { errors.accessUrl = 'http 또는 https 주소를 입력해 주세요.'; }
      if (this.form.applicationUrl) { try { if (!['http:','https:'].includes(new URL(this.form.applicationUrl).protocol)) throw new Error(); } catch { errors.applicationUrl = 'http 또는 https 주소를 입력해 주세요.'; } }
      if (!hasTextContent(this.form.content)) errors.content = '본문 내용을 입력해 주세요.';
      if (!this.form.position) errors.position = '분야를 선택해 주세요.';
      if (!this.selectedLanguages.length) errors.language = '기술 스택을 하나 이상 선택해 주세요.';
      if (!this.form.startedDate) errors.startedDate = '모집 시작을 입력해 주세요.';
      if (!this.form.deadLineDate || (this.form.startedDate && this.form.deadLineDate < this.form.startedDate)) errors.deadLineDate = '마감은 모집 시작보다 빠를 수 없습니다.';
      for (const field of ['minCareer','maxCareer'] as const) if (!Number.isInteger(this.form[field]) || this.form[field] < 0) errors[field] = '0 이상의 정수를 입력해 주세요.';
      if (this.form.maxCareer && this.form.minCareer > this.form.maxCareer) errors.maxCareer = '최대 경력은 최소 경력보다 작을 수 없습니다.';
      if (this.form.type === 'EDU' && educationError(this.form)) errors.education = educationError(this.form);
      const amountError = compensationError(this.form);
      if (amountError) errors.payment = amountError;
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
