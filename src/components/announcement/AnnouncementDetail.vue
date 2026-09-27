<template>
  <article class="job-detail">
    <header class="job-detail-heading"><div class="company-logo"><CompanyImage :src="announcement.image" /></div><span class="section-label">{{ announcement.type === 'EDU' ? '교육·부트캠프' : '채용 공고' }}</span><h1>{{ announcement.title }}</h1><p>{{ announcement.company }}</p></header>
    <div class="detail-facts">
      <p>회사명 : {{ announcement.company }}</p>
      <p v-if="announcement.type === 'EDU'">교육비 : {{ announcement.payment === 0 ? '무료' : announcement.payment + ' 만원' }}</p>
      <p v-if="announcement.type === 'EMP'">연봉 : {{ announcement.payment }} 만원</p>
      <p>지원기간 : {{ formatRecruitDate(announcement.startedDate) }} ~ {{ formatRecruitDate(announcement.deadLineDate) }}</p>
      <p>포지션 : {{ announcement.position }}</p>
      <p>기술 스택 : <span aria-label="기술 스택">{{ formatLanguages(announcement.language) }}</span></p>
      <p>경력 : {{ careerText }}</p>
    </div>
    <section class="detail-announce-content"><h2>상세 내용</h2><SafeHtml :content="announcement.content ?? ''" /></section>
    <div class="apply-bar"><a :href="announcement.accessUrl ?? undefined" class="button button-primary">지원하기</a></div>
  </article>
</template>
<script lang="ts">
import type { AnnouncementDetail } from '@/types/api';
import { routeId } from '@/router/query';
import CompanyImage from '@/components/common/CompanyImage.vue';
import { defineComponent } from "vue";
import SafeHtml from "@/components/common/SafeHtml.vue";
import { getAnnouncementDetail } from "@/api/announcements";
import { formatLanguages, formatRecruitDate } from '@/presentation/announcement';

export default defineComponent({
  components: { SafeHtml, CompanyImage },
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
  data(): { announcement: Partial<AnnouncementDetail> } {
    return {
      announcement: {
        image: "https://inhatc-demp.s3.ap-northeast-2.amazonaws.com/noimg.jpg",
        company: "",
        language: [],
      },
    };
  },
  computed: {
    careerText() {
      if (this.announcement.maxCareer === 0) {
        return `${this.announcement.minCareer}년 이상`;
      }
      return `${this.announcement.minCareer}년 ~ ${this.announcement.maxCareer}년`;
    },
  },
  methods: {
    formatLanguages,
    formatRecruitDate,
    loadAnnouncementDetail() {
      getAnnouncementDetail(routeId(this.$route.params.itemId))
        .then((announcement) => {
          this.announcement = announcement;
        });
    },
    showChatUnavailable(){
      alert('지원 예정 입니다.');
    },
  },
  watch: {
    $route: {
      handler() {
        this.loadAnnouncementDetail();
      },
    },
  },
});
</script>
