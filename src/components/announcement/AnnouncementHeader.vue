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
      <details v-if="filters.announcementType === 'EDU'" class="education-filter-panel">
        <summary><AppIcon name="filter" :size="16" />교육 상세 조건 <span v-if="educationCount">{{ educationCount }}</span></summary>
        <p class="field-hint">참여할 수 있는 수업 방식과 일정부터 골라보세요. 선택한 조건을 모두 충족하는 과정을 찾습니다.</p>
        <div class="education-filter-grid">
          <label v-for="field in educationFields" :key="field.key">{{ field.label }}<select :aria-label="field.label" v-model="filters[field.key]" @change="commit"><option :value="undefined">전체</option><option v-for="(label,value) in field.options" :key="value" :value="value">{{ label }}</option></select></label>
          <label>교육 기간<select aria-label="교육 기간" v-model="filters.duration" @change="commit"><option :value="undefined">전체</option><option v-for="(label,value) in durations" :key="value" :value="value">{{ label }}</option></select></label>
          <label>개강일 이후<input aria-label="개강일 이후" type="date" v-model="filters.startAfter" @change="commit" /></label>
          <label>개강일 이전<input aria-label="개강일 이전" type="date" v-model="filters.startBefore" @change="commit" /></label>
        </div>
        <p v-if="filters.startAfter && filters.startBefore && filters.startAfter > filters.startBefore" class="field-error">개강일 범위가 거꾸로 선택되어 결과가 없습니다. 날짜를 조정해 주세요.</p>
      </details>
    </div>
    <div class="active-filters"><span v-for="chip in chips" :key="chip.key" class="filter-chip">{{ chip.label }}<button type="button" :aria-label="`${chip.label} 조건 해제`" @click="removeChip(chip.key)"><AppIcon name="close" :size="14" /></button></span><button type="button" class="reset-filters" aria-label="전체 조건 초기화" @click="reset"><AppIcon name="refresh" :size="14" />초기화</button></div>
  </section>
</template>
<script lang="ts">
import { educationFields, educationLabel, durations } from '@/data/education';
import { defineComponent } from 'vue';
import AppIcon from '@/components/common/AppIcon.vue';
import positions from '@/data/positions';
import { languages, filtersFromQuery, filtersToQuery } from '@/router/announcementFilters';
import { formatLanguages } from '@/presentation/announcement';
import { formatPosition } from '@/presentation/positions';
export default defineComponent({
  components: { AppIcon },
  data() { return { filters: filtersFromQuery(this.$route.query), positions, languages, educationFields, durations, mobileOpen: false }; },
  computed: {
    educationCount() { return educationFields.filter(field => this.filters[field.key]).length + ['duration','startAfter','startBefore'].filter(key => this.filters[key as 'duration' | 'startAfter' | 'startBefore']).length; },
    chips() {
      const chips = this.filters.positions.map(item => ({ key: `position:${item}`, label: formatPosition(item) }));
      for (const item of this.filters.languages ?? []) chips.push({ key: `language:${item}`, label: formatLanguages([item]) });
      if (this.filters.recruitmentStatus) chips.push({ key: 'status', label: { OPEN: '모집 중', UPCOMING: '모집 예정', CLOSED: '모집 마감' }[this.filters.recruitmentStatus] });
      if (this.filters.tuition) chips.push({ key: 'tuition', label: this.filters.tuition === 'FREE' ? '무료' : '유료' });
      if (this.filters.career) chips.push({ key: 'career', label: `경력 ${this.filters.career}년` });
      if (this.filters.announcementType === 'EDU') {
        for (const field of educationFields) if (this.filters[field.key]) chips.push({ key: field.key, label: educationLabel(field.key, this.filters[field.key]) });
        if (this.filters.duration) chips.push({ key: 'duration', label: durations[this.filters.duration as keyof typeof durations] });
        if (this.filters.startAfter) chips.push({ key: 'startAfter', label: this.filters.startAfter + ' 이후 개강' });
        if (this.filters.startBefore) chips.push({ key: 'startBefore', label: this.filters.startBefore + ' 이전 개강' });
      }
      if (this.filters.title) chips.push({ key: 'title', label: this.filters.title });
      return chips;
    },
  },
  methods: {
    formatLanguages, formatPosition,
    commit() { return this.$router.push({ path: '/', query: filtersToQuery(this.filters) }); },
    changeMode() { this.filters.career = 0; this.filters.payment = 0; this.filters.tuition = ''; for (const field of educationFields) delete this.filters[field.key]; delete this.filters.duration; delete this.filters.startAfter; delete this.filters.startBefore; this.commit(); },
    reset() { this.filters = filtersFromQuery({ type: this.filters.announcementType }); this.commit(); },
    removeChip(key: string) {
      if (key.startsWith('position:')) this.filters.positions = this.filters.positions.filter(item => item !== key.slice(9));
      else if (key.startsWith('language:')) this.filters.languages = (this.filters.languages ?? []).filter(item => item !== key.slice(9));
      else if (key === 'status') this.filters.recruitmentStatus = '';
      else if (key === 'tuition') this.filters.tuition = '';
      else if (key === 'career') this.filters.career = 0;
      else if (key === 'payment') this.filters.payment = 0;
      else if (educationFields.some(field => field.key === key)) delete this.filters[key as typeof educationFields[number]['key']];
      else if (key === 'duration' || key === 'startAfter' || key === 'startBefore') delete this.filters[key];
      else if (key === 'title') this.filters.title = '';
      this.commit();
    },
  },
  watch: { '$route.query': { handler() { this.filters = filtersFromQuery(this.$route.query); } } },
});
</script>
