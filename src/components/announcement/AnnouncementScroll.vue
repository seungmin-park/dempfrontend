<template>
  <div class="anncoucement-scroll">
    <div class="anncoucement-scroll-header">
      <button @click="returnToResults" class="anncoucement-scroll-history" aria-label="검색 결과로 돌아가기">←</button>
      <span>전체 공고</span>
    </div>

    <AsyncState :loading="loading" :error="error" @retry="getScroll" />
    <div v-if="!loading && !error">
    <div role="link" tabindex="0" @keydown.enter="openDetail(item.id)" @click="openDetail(item.id)"
      class="anncoucement-scroll-items"
      v-for="item in announcement"
      :key="item.id"
    >
      <div class="anncoucement-scroll-items-img">
        <CompanyImage :src="item.image" />
      </div>
      <div class="anncoucement-scroll-items-description">
        <AnnouncementAudience :announcement="item" />
        <p class="item-title">{{ item.company?.name ?? '' }}</p>
        <p class="item-company">{{ item.title }}</p>
      </div>
    </div>
    </div>
  </div>
</template>
<script lang="ts">
import type { AnnouncementScroll } from '@/types/api';
import AnnouncementAudience from './AnnouncementAudience.vue';
import CompanyImage from '@/components/common/CompanyImage.vue';
import AsyncState from '@/components/common/AsyncState.vue';
import { requestErrorMessage } from '@/presentation/requestError';
import { defineComponent } from "vue";
import { getAnnouncementScroll } from '@/api/announcements';
export default defineComponent({
  name: "announcement-scroll",
  components: { AnnouncementAudience, CompanyImage, AsyncState },
  mounted() {
    {
      this.getScroll();
    }
  },
  data() {
    return {
      loading: true, error: '',
      announcement: [] as AnnouncementScroll[],
    };
  },
  methods: {
    async getScroll() {
      this.loading = true; this.error = '';
      try { this.announcement = (await getAnnouncementScroll()).data; }
      catch (error) { this.error = requestErrorMessage(error); }
      finally { this.loading = false; }
    },
    /** Going back to the same list entry keeps its loaded pages and position; other entries open the list anew. */
    returnToResults() {
      const results = { path: '/', query: this.$route?.query ?? {} };
      const previous: unknown = window.history.state?.back;
      if (previous === this.$router.resolve(results).fullPath) this.$router.back();
      else this.$router.push(results);
    },
    openDetail(id: number) {
      const query = this.$route?.query;
      this.$router.push({ name: 'detail', params: { itemId: id }, ...(query && Object.keys(query).length ? { query } : {}) });
    },
  },
});
</script>
