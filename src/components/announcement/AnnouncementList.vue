<template>
  <div class="results-heading"><h2>공고 목록 <span>{{ notices.length }}</span></h2><span>최신 등록순</span></div>
  <div class="job-grid" :aria-busy="loading">
    <article v-for="notice in notices" :key="notice.id" class="item job-card" tabindex="0" role="link" :aria-label="notice.title ?? '공고 상세'" @click="openAnnouncementDetail(notice.id)" @keydown.enter="openAnnouncementDetail(notice.id)">
      <div class="item-image-box"><CompanyImage :src="notice.image" /></div>
      <div class="job-card-content"><span class="job-position">{{ formatPosition(notice.position) }}</span><p v-if="notice.company" class="job-company">{{ notice.company }}</p><h2 class="notice-title">{{ notice.title }}</h2><p class="job-stack" aria-label="기술 스택">{{ formatLanguages(notice.language) }}</p><div class="job-card-facts"><span v-if="notice.announcementType === 'EDU' && notice.payment != null">{{ notice.payment === 0 ? '무료 교육' : '교육비 ' + notice.payment.toLocaleString('ko-KR') + '만원' }}</span><span v-else-if="notice.minCareer != null">{{ notice.minCareer === 0 ? '신입 가능' : notice.minCareer + '년 이상' }}</span><span v-if="notice.deadLineDate">{{ formatRecruitDate(notice.deadLineDate).slice(0,10) }} 마감</span></div></div>
    </article>
  </div>
  <div ref="listEnd" data-test="list-end" aria-hidden="true" class="list-end"></div>
  <div class="list-status"><button v-if="!last && !error" :disabled="loading" @click="loadNextPage" class="button button-secondary">{{ loading ? '불러오는 중…' : '더보기' }}</button><p v-if="error" role="alert" class="form-error">{{ error }} <button class="button button-secondary" data-test="retry" @click="loadNextPage">재시도</button></p><p v-if="last" class="end-message">더 이상 채용/교육 공고 내용이 존재하지 않습니다.</p></div>
</template>
<script lang="ts">
import type { AnnouncementSummary, AnnouncementFilters, JobPosition } from '@/types/api';
import { defineComponent } from "vue";
import { markRaw } from "vue";
import { getAnnouncements } from "@/api/announcements";
import { filtersFromQuery } from '@/router/announcementFilters';
import { formatPosition } from '@/presentation/positions';
import { formatRecruitDate } from '@/presentation/announcement';
import { formatLanguages } from '@/presentation/announcement';
import CompanyImage from '@/components/common/CompanyImage.vue';
export default defineComponent({
  name: "demp-announcement",
  components: { CompanyImage },
  mounted() {
    this.announcementSearchCondition = { ...filtersFromQuery(this.$route?.query), page: 0 };
    this.emitter.on("announcementSearchCondition", this.onSearchCondition);
    if (typeof IntersectionObserver !== "undefined") {
      this.pageObserver = markRaw(new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting) && !this.error) this.loadNextPage();
      }, { rootMargin: "200px" }));
      this.pageObserver.observe(this.$refs.listEnd as Element);
    }
    this.loadNextPage();
  },
  unmounted() {
    this.requestGeneration++;
    this.pageObserver?.disconnect();
    this.emitter.off("announcementSearchCondition", this.onSearchCondition);
  },
  data() {
    return {
      notices: [] as AnnouncementSummary[],
      announcementSearchCondition: {
        announcementType: "" as AnnouncementFilters["announcementType"],
        positions: [] as JobPosition[],
        // languages: [],
        career: 0,
        payment: 0,
        title: "",
        page:0,
      },
      last:false,
      loading:false,
      error:null as string | null,
      requestGeneration:0,
      pageObserver:null as IntersectionObserver | null,
    };
  },

  methods: {
    formatLanguages, formatPosition, formatRecruitDate,
    onSearchCondition(condition: AnnouncementFilters) {
      this.announcementSearchCondition = { ...condition, page: 0 };
      this.notices = [];
      this.last = false;
      this.error = null;
      this.requestGeneration++;
      this.loading = false;
      this.loadNextPage();
    },
    async loadNextPage(){
      if (this.last || this.loading) return;
      const generation = ++this.requestGeneration;
      this.loading = true;
      this.error = null;
      try {
        const result = await getAnnouncements({ ...this.announcementSearchCondition });
        if (generation !== this.requestGeneration) return;
        if (result.data.content.length) {
          const visibleIds = new Set(this.notices.map(notice => notice.id));
          this.notices.push(...result.data.content.filter(notice => {
            if (visibleIds.has(notice.id)) return false;
            visibleIds.add(notice.id);
            return true;
          }));
          this.announcementSearchCondition.page ++;
        }
        this.last = result.data.last || result.data.content.length === 0;
      }
      catch {
        if (generation === this.requestGeneration) this.error = "공고를 불러오지 못했습니다.";
      } finally {
        if (generation === this.requestGeneration) {
          this.loading = false;
          await this.$nextTick();
          if (generation === this.requestGeneration && !this.last && !this.error && this.pageObserver) {
            this.pageObserver.unobserve(this.$refs.listEnd as Element);
            this.pageObserver.observe(this.$refs.listEnd as Element);
          }
        }
      }
    },
    openAnnouncementDetail(id: number){
      if (this.$store.state.Login.token != ""){
        this.$router.push(`/detail/${id}`);
      }else {
        alert("로그인이 필요한 서비스 입니다.");
      }
    },
  },
  watch: {
    '$route.query': { handler() { this.onSearchCondition(filtersFromQuery(this.$route.query)); } },
  },
});
</script>
