<template>
  <AsyncState :loading="loading" :error="error" @retry="loadAnnouncementDetail" />
  <article v-if="!loading && !error" class="job-detail">
    <header class="job-detail-heading"><div class="company-logo"><CompanyImage :src="announcement.image" /></div><AnnouncementAudience :announcement="announcement" /><h1>{{ announcement.title }}</h1><p>{{ announcement.company }}</p></header>
    <div class="detail-facts">
      <p>회사명 : {{ announcement.company }}</p>
      <p v-if="announcement.type === 'EDU'">교육비 : {{ announcement.payment === 0 ? '무료' : announcement.payment + ' 만원' }}</p>
      <p v-if="announcement.type === 'EMP'">연봉 : {{ announcement.payment }} 만원</p>
      <p>지원기간 : {{ formatRecruitDate(announcement.startedDate) }} ~ {{ formatRecruitDate(announcement.deadLineDate) }}</p>
      <p>포지션 : {{ formatPosition(announcement.position) }}</p>
      <p>기술 스택 : <span aria-label="기술 스택">{{ formatLanguages(announcement.language) }}</span></p>

    </div>
    <section class="detail-announce-content"><h2>상세 내용</h2><SafeHtml images :content="announcement.content ?? ''" /></section>
    <div class="apply-bar"><span v-if="applicationUrl" class="field-hint">원문 공고에서 상세 내용을 확인하고 지원하세요. 새 탭으로 열립니다.</span><a v-if="applicationUrl" :href="applicationUrl" class="button button-primary" target="_blank" rel="noopener noreferrer">지원하기</a><span v-else class="field-hint">지원 링크가 없습니다.</span></div>
  </article>
</template>
<script lang="ts">
import type { AnnouncementDetail } from '@/types/api';
import { routeId } from '@/router/query';
import AnnouncementAudience from './AnnouncementAudience.vue';
import CompanyImage from '@/components/common/CompanyImage.vue';
import { formatPosition } from '@/presentation/positions';
import AsyncState from '@/components/common/AsyncState.vue';
import { requestErrorMessage, safeApplicationUrl } from '@/presentation/requestError';
import { defineComponent } from "vue";
import SafeHtml from "@/components/common/SafeHtml.vue";
import { getAnnouncementDetail } from "@/api/announcements";
import { formatLanguages, formatRecruitDate } from '@/presentation/announcement';

export default defineComponent({
  components: { AnnouncementAudience, AsyncState, SafeHtml, CompanyImage },
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
  data() { return { announcement: {} as Partial<AnnouncementDetail>, loading: true, error: '', requestGeneration: 0 }; },
  unmounted() { this.requestGeneration++; },
  computed: {
    applicationUrl() { return safeApplicationUrl(this.announcement.accessUrl); },

  },
  methods: {
    formatPosition,
    formatLanguages,
    formatRecruitDate,
    async loadAnnouncementDetail() {
      const generation = ++this.requestGeneration;
      this.loading = true;
      this.error = '';
      try {
        const result = await getAnnouncementDetail(routeId(this.$route.params.itemId));
        if (generation === this.requestGeneration) this.announcement = result;
      } catch (error) { if (generation === this.requestGeneration) this.error = requestErrorMessage(error); }
      finally { if (generation === this.requestGeneration) this.loading = false; }
    },
  },
  watch: { '$route.params.itemId'() { this.loadAnnouncementDetail(); } },
});
</script>
