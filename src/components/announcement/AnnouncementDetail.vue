<template>
  <AsyncState :loading="loading" :error="error" @retry="loadAnnouncementDetail" />
  <article v-if="!loading && !error" class="job-detail">
    <header class="job-detail-heading"><div class="company-logo"><CompanyImage :src="announcement.image" /></div><AnnouncementAudience :announcement="announcement" /><h1>{{ announcement.title }}</h1><p>{{ announcement.company }}</p><p v-if="typeof announcement.hits === 'number'" class="job-view-count" aria-label="공고 조회수">조회 {{ announcement.hits.toLocaleString() }}</p></header>
    <p aria-label="현재 모집 상태" aria-live="polite">{{ recruitmentLabels[currentRecruitmentState] }}</p>
    <div class="detail-facts">
      <p>회사명 : {{ announcement.company }}</p>
      <p v-if="announcement.type === 'EDU'">{{ formatTuition(announcement.payment) }}</p>
      <p v-if="announcement.type === 'EMP'">{{ formatSalary(announcement) }}</p>
      <p>지원기간 : {{ formatRecruitDate(announcement.startedDate) }} ~ {{ formatDeadline(announcement) }}</p>
      <p>포지션 : {{ formatPosition(announcement.position) }}</p>
      <p>기술 스택 : <span aria-label="기술 스택">{{ formatLanguages(announcement.language) }}</span></p>

    </div>
    <section v-if="announcement.type === 'EDU'" class="education-detail"><h2>교육과정 한눈에 보기</h2><dl><div><dt>기수</dt><dd>{{ announcement.cohort || '기수 미확인' }}</dd></div><div><dt>훈련 지원금</dt><dd>{{ announcement.stipendAmount == null ? '지원금 미확인' : `${announcement.stipendAmount.toLocaleString()}만원` }}<span v-if="announcement.stipendNote"> · {{ announcement.stipendNote }}</span></dd></div><div v-for="field in educationFields" :key="field.key"><dt>{{ field.label }}</dt><dd>{{ educationLabel(field.key, announcement.education?.[field.key]) }}</dd></div><div><dt>교육 일정</dt><dd>{{ announcement.education?.learningStartDate || '시작일 미확인' }} ~ {{ announcement.education?.learningEndDate || '종료일 미확인' }}<span v-if="announcement.education?.durationDays"> · {{ announcement.education.durationDays }}일</span></dd></div></dl><p class="field-hint">지원 조건과 정확한 수업 시간·본인 부담금은 원문에서 최종 확인하세요.</p></section>
    <section v-if="announcement.type === 'EMP' && (announcement.workPeriod || announcement.conversionNote || announcement.roles?.length)" aria-label="직무별 모집 조건" class="recruitment-role-details">
      <h2>직무별 모집 조건</h2><p v-if="announcement.workPeriod">근무 기간: {{ announcement.workPeriod }}</p><p v-if="announcement.conversionNote">전환·계약 조건: {{ announcement.conversionNote }}</p>
      <section v-for="(role, index) in announcement.roles" :key="index"><h3>{{ role.title }}</h3><p v-if="role.position">{{ formatPosition(role.position) }}</p><p v-if="role.location">근무지: {{ role.location }}</p><p v-if="role.qualifications">경력·학력 조건: {{ role.qualifications }}</p><p v-if="role.requiredSkills">필수 요건: {{ role.requiredSkills }}</p><p v-if="role.preferredSkills">우대 요건: {{ role.preferredSkills }}</p><p v-if="role.usedTechnologies">조직 사용 기술: {{ role.usedTechnologies }}</p></section>
    </section>
    <section v-if="referenceUrls.length" aria-label="보조 출처"><h2>참고 자료</h2><ul><li v-for="url in referenceUrls" :key="url"><a :href="url" target="_blank" rel="noopener noreferrer">{{ url }}</a></li></ul></section>
    <section class="detail-announce-content"><h2>상세 내용</h2><SafeHtml images :content="announcement.content ?? ''" /></section>
    <div class="apply-bar"><span v-if="applicationUrl" class="field-hint">{{ currentRecruitmentState === 'CLOSED' ? '모집이 종료되었습니다. 원문에서 최신 상태를 확인하세요.' : currentRecruitmentState === 'OPEN' ? '원문 공고에서 상세 내용을 확인하고 지원하세요. 새 탭으로 열립니다.' : '모집 시작 전이거나 일정 확인이 필요합니다. 원문을 확인하세요.' }}</span><a v-if="applicationUrl" :href="applicationUrl" class="button button-primary" target="_blank" rel="noopener noreferrer">{{ currentRecruitmentState === 'OPEN' ? '지원하기' : '원문 확인' }}</a><span v-else class="field-hint">지원 링크가 없습니다.</span></div>
    <AnnouncementReportForm :key="String($route.params.itemId)" :id="String($route.params.itemId)" />
  </article>
</template>
<script lang="ts">
import { useRecruitmentTime } from '@/composables/useRecruitmentTime';
import { recruitmentState, recruitmentLabels, formatDeadline } from '@/presentation/recruitment';
import AnnouncementReportForm from './AnnouncementReportForm.vue';
import { educationFields, educationLabel } from '@/data/education';
import { formatSalary, formatTuition } from '@/presentation/compensation';
import type { AnnouncementDetail } from '@/types/api';
import { routeId } from '@/router/query';
import AnnouncementAudience from './AnnouncementAudience.vue';
import CompanyImage from '@/components/common/CompanyImage.vue';
import { formatPosition } from '@/presentation/positions';
import AsyncState from '@/components/common/AsyncState.vue';
import { requestErrorMessage, safeApplicationUrl } from '@/presentation/requestError';
import { defineComponent } from "vue";
import SafeHtml from "@/components/common/SafeHtml.vue";
import { viewAnnouncement } from "@/api/announcements";
import { formatLanguages, formatRecruitDate } from '@/presentation/announcement';

export default defineComponent({
  setup() { return { ...useRecruitmentTime(), recruitmentLabels }; },
  components: { AnnouncementReportForm, AnnouncementAudience, AsyncState, SafeHtml, CompanyImage },
  created(){
    if (this.$store.state.Login.token == "") {
      this.$router.replace({
        path: "/login",
        query: { redirect: this.$router.currentRoute.value.fullPath },
      });
  }},
  mounted() {
    {
      this.loadAnnouncementDetail();
    }
  },
  data() { return { educationFields, announcement: {} as Partial<AnnouncementDetail>, loading: true, error: '', requestGeneration: 0 }; },
  unmounted() { this.requestGeneration++; },
  computed: {
    referenceUrls() { return (this.announcement.referenceUrls || []).map(safeApplicationUrl).filter(Boolean); },
    currentRecruitmentState() { return recruitmentState(this.announcement, this.recruitmentNow); },
    applicationUrl() { return safeApplicationUrl(this.currentRecruitmentState === 'OPEN' ? this.announcement.applicationUrl || this.announcement.accessUrl : this.announcement.accessUrl); },

  },
  methods: {
    educationLabel, formatSalary, formatTuition, formatPosition, formatDeadline,
    formatLanguages,
    formatRecruitDate,
    async loadAnnouncementDetail() {
      const generation = ++this.requestGeneration;
      this.loading = true;
      this.error = '';
      try {
        const result = await viewAnnouncement(routeId(this.$route.params.itemId));
        if (generation === this.requestGeneration) this.announcement = result;
      } catch (error) { if (generation === this.requestGeneration) this.error = requestErrorMessage(error); }
      finally { if (generation === this.requestGeneration) this.loading = false; }
    },
  },
  watch: { '$route.params.itemId'() { this.loadAnnouncementDetail(); } },
});
</script>
