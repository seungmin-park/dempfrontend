<template>
  <section class="discovery-filters" aria-label="공고 검색 조건">
    <div class="discovery-modes" role="group" aria-label="공고 종류">
      <label :class="{ active: !filters.announcementType }"><input type="radio" name="announcement-mode" value="" v-model="filters.announcementType" @change="changeMode" />전체</label>
      <label :class="{ active: filters.announcementType === 'EMP' }"><input id="emp" type="radio" name="announcement-mode" value="EMP" v-model="filters.announcementType" @change="changeMode" /><AppIcon name="briefcase" :size="17" />채용</label>
      <label :class="{ active: filters.announcementType === 'EDU' }"><input id="edu" type="radio" name="announcement-mode" value="EDU" v-model="filters.announcementType" @change="changeMode" /><AppIcon name="book" :size="17" />부트캠프</label>
    </div>
    <form class="discovery-search" @submit.prevent="commit"><AppIcon name="search" :size="20" /><input aria-label="공고 검색어" v-model="filters.title" :placeholder="filters.announcementType === 'EDU' ? '과정명, 교육기관으로 검색' : '공고명, 회사명으로 검색'" /><button class="button button-primary" type="submit">검색</button><button type="button" class="button button-secondary mobile-filter-toggle" aria-label="필터 열기" :aria-expanded="mobileOpen" aria-controls="filter-options" @click="mobileOpen = !mobileOpen"><AppIcon name="filter" :size="18" />필터</button></form>
    <div id="filter-options" class="filter-options" :class="{ 'is-open': mobileOpen }">
      <details class="filter-group"><summary>직무·분야 <span v-if="filters.positions.length">{{ filters.positions.length }}</span><AppIcon name="chevron" :size="15" /></summary><div class="filter-popover position-options"><label v-for="position in positions" :key="position"><input type="checkbox" :value="position" v-model="filters.positions" @change="commit" />{{ formatPosition(position) }}</label></div></details>
      <details class="filter-group"><summary>기술 스택 <span v-if="filters.languages?.length">{{ filters.languages.length }}</span><AppIcon name="chevron" :size="15" /></summary><div class="filter-popover"><label v-for="language in languages" :key="language"><input type="checkbox" :value="language" v-model="filters.languages" @change="commit" />{{ formatLanguages([language]) }}</label></div></details>
      <select aria-label="모집 상태" v-model="filters.recruitmentStatus" @change="commit"><option value="">모집 상태 전체</option><option value="OPEN">모집 중</option><option value="UPCOMING">모집 예정</option><option value="CLOSED">모집 마감</option></select>
      <select v-if="filters.announcementType === 'EDU'" aria-label="교육비" v-model="filters.tuition" @change="commit"><option value="">교육비 전체</option><option value="FREE">무료</option><option value="PAID">유료</option></select>
      <template v-else><select aria-label="내 경력" v-model.number="filters.career" @change="commit"><option :value="0">경력 전체</option><option v-for="year in 15" :key="year" :value="year">내 경력 {{ year }}년</option></select></template>
    </div>
    <div class="active-filters"><span v-for="chip in chips" :key="chip.key" class="filter-chip">{{ chip.label }}<button type="button" :aria-label="`${chip.label} 조건 해제`" @click="removeChip(chip.key)"><AppIcon name="close" :size="14" /></button></span><button type="button" class="reset-filters" aria-label="전체 조건 초기화" @click="reset"><AppIcon name="refresh" :size="14" />초기화</button></div>
  </section>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import AppIcon from '@/components/common/AppIcon.vue';
import positions from '@/data/positions';
import { languages, filtersFromQuery, filtersToQuery } from '@/router/announcementFilters';
import { formatLanguages } from '@/presentation/announcement';
import { formatPosition } from '@/presentation/positions';
export default defineComponent({
  components: { AppIcon },
  data() { return { filters: filtersFromQuery(this.$route.query), positions, languages, mobileOpen: false }; },
  computed: {
    chips() {
      const chips = this.filters.positions.map(item => ({ key: `position:${item}`, label: formatPosition(item) }));
      for (const item of this.filters.languages ?? []) chips.push({ key: `language:${item}`, label: formatLanguages([item]) });
      if (this.filters.recruitmentStatus) chips.push({ key: 'status', label: { OPEN: '모집 중', UPCOMING: '모집 예정', CLOSED: '모집 마감' }[this.filters.recruitmentStatus] });
      if (this.filters.tuition) chips.push({ key: 'tuition', label: this.filters.tuition === 'FREE' ? '무료' : '유료' });
      if (this.filters.career) chips.push({ key: 'career', label: `경력 ${this.filters.career}년` });
      if (this.filters.title) chips.push({ key: 'title', label: this.filters.title });
      return chips;
    },
  },
  methods: {
    formatLanguages, formatPosition,
    commit() { return this.$router.push({ path: '/', query: filtersToQuery(this.filters) }); },
    changeMode() { this.filters.career = 0; this.filters.payment = 0; this.filters.tuition = ''; this.commit(); },
    reset() { this.filters = filtersFromQuery({ type: this.filters.announcementType }); this.commit(); },
    removeChip(key: string) {
      if (key.startsWith('position:')) this.filters.positions = this.filters.positions.filter(item => item !== key.slice(9));
      else if (key.startsWith('language:')) this.filters.languages = this.filters.languages?.filter(item => item !== key.slice(9));
      else if (key === 'status') this.filters.recruitmentStatus = '';
      else if (key === 'tuition') this.filters.tuition = '';
      else if (key === 'career') this.filters.career = 0;
      else if (key === 'payment') this.filters.payment = 0;
      else if (key === 'title') this.filters.title = '';
      this.commit();
    },
  },
  watch: { '$route.query': { handler() { this.filters = filtersFromQuery(this.$route.query); } } },
});
</script>
