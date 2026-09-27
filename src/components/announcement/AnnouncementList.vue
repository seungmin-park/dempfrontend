<template>
  <div class="results-heading"><h2>공고 목록 <span>{{ notices.length }}</span></h2><span>최신 등록순</span></div>
  <div class="job-grid" :aria-busy="loading">
    <article v-for="notice in notices" :key="notice.id" class="item job-card" tabindex="0" role="link" :aria-label="notice.title ?? '공고 상세'" @click="openAnnouncementDetail(notice.id)" @keydown.enter="openAnnouncementDetail(notice.id)">
      <div class="item-image-box"><CompanyImage :src="notice.image" /></div>
      <div class="job-card-content"><AnnouncementAudience :announcement="notice" /><span class="job-position">{{ formatPosition(notice.position) }}</span><p v-if="notice.company" class="job-company">{{ notice.company }}</p><h2 class="notice-title">{{ notice.title }}</h2><p class="job-stack" aria-label="기술 스택">{{ formatLanguages(notice.language) }}</p><div class="job-card-facts"><span v-if="notice.announcementType === 'EDU' && notice.payment != null">{{ notice.payment === 0 ? '무료 교육' : '교육비 ' + notice.payment.toLocaleString('ko-KR') + '만원' }}</span><span v-if="notice.deadLineDate">{{ formatRecruitDate(notice.deadLineDate).slice(0,10) }} 마감</span></div></div>
    </article>
  </div>
  <div ref="listEnd" data-test="list-end" aria-hidden="true" class="list-end"></div>
  <div class="list-status">
    <p v-if="loading" role="status" aria-live="polite" class="list-loading">{{ notices.length ? '다음 공고를 불러오고 있습니다…' : '공고를 불러오고 있습니다…' }}</p>
    <button v-if="!last && !error" :disabled="loading" data-test="load-more" @click="loadNextPage" class="button button-secondary">{{ loading ? '불러오는 중…' : '더보기' }}</button>
    <div v-if="error" role="alert" class="list-error">
      <AppIcon name="refresh" :size="30" /><h2>{{ error }}</h2>
      <p>{{ notices.length ? '지금까지 불러온 공고는 그대로 볼 수 있습니다.' : '일시적인 서버 오류이거나 네트워크 연결이 원활하지 않을 수 있습니다.' }}<br />잠시 후 다시 시도해 주세요.</p>
      <button class="button button-secondary" data-test="retry" @click="loadNextPage">재시도</button>
    </div>
    <p v-if="last && notices.length && !loading && !error" class="end-message" role="status">현재 조건의 공고를 모두 확인했습니다.</p>
    <div v-if="last && !notices.length && !loading && !error" class="empty-state" role="status" aria-live="polite">
      <AppIcon :name="emptyState.action === 'reset' ? 'search' : 'briefcase'" :size="32" />
      <h2>{{ emptyState.title }}</h2><p>{{ emptyState.description }}</p>
      <button v-if="emptyState.action === 'reset'" class="button button-secondary" data-test="empty-reset" @click="resetSearch">검색·필터 해제</button>
      <button v-else-if="emptyState.action === 'browse'" class="button button-secondary" data-test="empty-browse" @click="$router.push({ path: '/', query: {} })">전체 공고 보기</button>
    </div>
  </div>
</template>
<script lang="ts">
import type { AnnouncementSummary, AnnouncementFilters, JobPosition } from '@/types/api';
import { defineComponent } from "vue";
import { markRaw } from "vue";
import { getAnnouncements } from "@/api/announcements";
import { announcementEmptyState } from '@/presentation/announcementStates';
import AppIcon from '@/components/common/AppIcon.vue';
import { filtersFromQuery } from '@/router/announcementFilters';
import { formatPosition } from '@/presentation/positions';
import { formatRecruitDate } from '@/presentation/announcement';
import { formatLanguages } from '@/presentation/announcement';
import AnnouncementAudience from './AnnouncementAudience.vue';
import CompanyImage from '@/components/common/CompanyImage.vue';
export default defineComponent({
  name: "demp-announcement",
  components: { AppIcon, AnnouncementAudience, CompanyImage },
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
      } as AnnouncementFilters & { page: number },
      last:false,
      loading:false,
      error:null as string | null,
      requestGeneration:0,
      pageObserver:null as IntersectionObserver | null,
    };
  },

  computed: { emptyState() { return announcementEmptyState(this.announcementSearchCondition); } },
  methods: {
    resetSearch() {
      const type = this.announcementSearchCondition.announcementType;
      this.$router.push({ path: '/', query: type ? { type } : {} });
    },
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
        if (generation === this.requestGeneration) this.error = this.notices.length ? "다음 공고를 불러오지 못했습니다." : "공고를 불러오지 못했습니다.";
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
        const query = this.$route?.query;
        this.$router.push(query && Object.keys(query).length ? { path: `/detail/${id}`, query } : `/detail/${id}`);
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
