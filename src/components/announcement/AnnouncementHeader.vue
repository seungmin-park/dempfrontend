<template>
  <section class="discovery-filters" aria-label="공고 검색 조건">
    <div class="discovery-modes" role="group" aria-label="공고 종류">
      <label :class="{ active: !filters.announcementType }"><input type="radio" name="announcement-mode" value="" v-model="filters.announcementType" @change="changeMode" />전체</label>
      <label :class="{ active: filters.announcementType === 'EMP' }"><input id="emp" type="radio" name="announcement-mode" value="EMP" v-model="filters.announcementType" @change="changeMode" /><AppIcon name="briefcase" :size="17" />채용</label>
      <label :class="{ active: filters.announcementType === 'EDU' }"><input id="edu" type="radio" name="announcement-mode" value="EDU" v-model="filters.announcementType" @change="changeMode" /><AppIcon name="book" :size="17" />부트캠프</label>
    </div>
    <form class="discovery-search" @submit.prevent="submitSearch"><AppIcon name="search" :size="20" /><input aria-label="공고 검색어" v-model="searchTitle" :placeholder="filters.announcementType === 'EDU' ? '과정명, 교육기관으로 검색' : '공고명, 회사명으로 검색'" /><button class="button button-primary" type="submit">검색</button><button type="button" class="button button-secondary mobile-filter-toggle" aria-label="필터 열기" :aria-expanded="mobileOpen" aria-controls="filter-options" @click="toggleMobileFilters"><AppIcon name="filter" :size="18" />필터</button></form>
    <div ref="filterControls" id="filter-options" class="filter-options" :class="{ 'is-open': mobileOpen }">
      <div class="filter-group" :class="{ 'is-open': openFilter === 'positions' }">
        <button id="positions-filter-button" type="button" class="filter-trigger" :class="{ 'is-active': filters.positions.length }" aria-label="직무·분야" aria-describedby="positions-filter-value" aria-controls="positions-filter-panel" :aria-expanded="openFilter === 'positions'" @click="toggleFilter('positions')"><span>직무·분야</span><span id="positions-filter-value" class="filter-value">{{ filters.positions.length ? `${filters.positions.length}개 선택` : '전체' }}</span><AppIcon name="chevron" :size="15" /></button>
        <div v-if="openFilter === 'positions'" id="positions-filter-panel" class="filter-popover position-options">
          <div class="filter-panel-heading"><strong>직무 선택</strong><button type="button" aria-label="직무·분야 닫기" @click="closeFilter(true)"><AppIcon name="close" :size="16" /></button></div>
          <input aria-label="직무 검색" placeholder="직무 이름으로 찾기" v-model="positionSearch" />
          <fieldset class="filter-choice-list"><legend class="sr-only">직무 선택</legend><label v-for="position in matchingPositions" :key="position" :class="{ 'is-selected': filters.positions.includes(position) }"><input type="checkbox" :value="position" v-model="filters.positions" @change="commit" /><span>{{ formatPosition(position) }}</span></label></fieldset>
          <p v-if="!matchingPositions.length" role="status" class="filter-empty">일치하는 직무가 없습니다. 검색어를 바꿔 주세요.</p>
          <p class="filter-hint">선택한 직무 중 하나에 해당하는 공고를 찾습니다.</p>
        </div>
      </div>
      <div class="filter-group" :class="{ 'is-open': openFilter === 'languages' }">
        <button id="languages-filter-button" type="button" class="filter-trigger" :class="{ 'is-active': filters.languages?.length }" aria-label="기술 스택" aria-describedby="languages-filter-value" aria-controls="languages-filter-panel" :aria-expanded="openFilter === 'languages'" @click="toggleFilter('languages')"><span>기술 스택</span><span id="languages-filter-value" class="filter-value">{{ filters.languages?.length ? `${filters.languages.length}개 선택` : '전체' }}</span><AppIcon name="chevron" :size="15" /></button>
        <div v-if="openFilter === 'languages'" id="languages-filter-panel" class="filter-popover">
          <div class="filter-panel-heading"><strong>기술 스택 선택</strong><button type="button" aria-label="기술 스택 닫기" @click="closeFilter(true)"><AppIcon name="close" :size="16" /></button></div>
          <input aria-label="기술 스택 검색" placeholder="기술 이름으로 찾기" v-model="languageSearch" />
          <div class="technology-filter-groups"><fieldset v-for="group in matchingTechnologyGroups" :key="group.label" class="filter-choice-list"><legend>{{ group.label }}</legend><label v-for="[value,label] in group.items" :key="value" :class="{ 'is-selected': filters.languages?.includes(value) }"><input type="checkbox" :value="value" v-model="filters.languages" @change="commit" /><span>{{ label }}</span></label></fieldset></div>
          <p v-if="!matchingTechnologyGroups.length" role="status" class="filter-empty">일치하는 기술이 없습니다. 검색어를 바꿔 주세요.</p>
          <p class="filter-hint">선택한 기술 중 하나를 사용하는 공고를 찾습니다.</p>
        </div>
      </div>
      <div class="filter-group" :class="{ 'is-open': openFilter === 'status' }">
        <button id="status-filter-button" type="button" class="filter-trigger" :class="{ 'is-active': filters.recruitmentStatus }" aria-label="모집 상태" aria-describedby="status-filter-value" aria-controls="status-filter-panel" :aria-expanded="openFilter === 'status'" @click="toggleFilter('status')"><span>모집 상태</span><span id="status-filter-value" class="filter-value">{{ recruitmentStatuses[filters.recruitmentStatus || ''] }}</span><AppIcon name="chevron" :size="15" /></button>
        <div v-if="openFilter === 'status'" id="status-filter-panel" class="filter-popover">
          <fieldset class="filter-choice-list"><legend class="sr-only">모집 상태 선택</legend><label v-for="(label,value) in recruitmentStatuses" :key="value" :class="{ 'is-selected': filters.recruitmentStatus === value }"><input type="radio" name="recruitment-status" :value="value" v-model="filters.recruitmentStatus" @change="selectStatus" /><span>{{ label }}</span></label></fieldset>
        </div>
      </div>
      <select v-if="filters.announcementType === 'EDU'" aria-label="교육비" v-model="filters.tuition" @focus="closeFilter()" @change="commit"><option value="">교육비 전체</option><option value="FREE">무료</option><option value="PAID">유료</option></select>
      <div v-else class="filter-group" :class="{ 'is-open': openFilter === 'career' }">
        <button id="career-filter-button" type="button" class="filter-trigger" :class="{ 'is-active': filters.career }" aria-label="내 경력" aria-describedby="career-filter-value" aria-controls="career-filter-panel" :aria-expanded="openFilter === 'career'" @click="toggleFilter('career')"><span>내 경력</span><span id="career-filter-value" class="filter-value">{{ filters.career ? `${filters.career}년` : '조건 없음' }}</span><AppIcon name="chevron" :size="15" /></button>
        <div v-if="openFilter === 'career'" id="career-filter-panel" class="filter-popover">
          <div class="filter-panel-heading"><strong>내 경력으로 찾기</strong><button type="button" aria-label="내 경력 닫기" @click="closeFilter(true)"><AppIcon name="close" :size="16" /></button></div>
          <p id="career-filter-hint" class="filter-hint">입력한 연차를 지원 대상으로 포함하는 공고를 찾습니다.</p>
          <form class="career-form" novalidate @submit.prevent="applyCareer">
            <label for="career-years">경력 연차</label>
            <div class="career-input-row"><input id="career-years" aria-label="경력 연차" inputmode="numeric" v-model="careerDraft" :aria-invalid="Boolean(careerError)" :aria-describedby="careerError ? 'career-filter-hint career-filter-error' : 'career-filter-hint'" placeholder="예: 7" /><span>년</span><button type="submit" class="button button-primary">적용</button></div>
            <p v-if="careerError" id="career-filter-error" role="alert" class="field-error">{{ careerError }}</p>
          </form>
          <div class="career-quick-values" role="group" aria-label="빠른 경력 선택"><button v-for="year in [1,3,5,10]" :key="year" type="button" :aria-label="`경력 ${year}년 적용`" :class="{ 'is-selected': filters.career === year }" @click="selectCareer(year)">{{ year }}년</button></div>
          <button type="button" class="career-clear" aria-label="경력 조건 해제" @click="selectCareer(0)">경력 조건 없이 보기</button>
        </div>
      </div>
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
import { matchingTechnologyGroups } from '@/data/technologies';
import { languages, filtersFromQuery, filtersToQuery } from '@/router/announcementFilters';
import { formatLanguages } from '@/presentation/announcement';
import { formatPosition } from '@/presentation/positions';
type FilterKey = 'positions' | 'languages' | 'status' | 'career';
const recruitmentStatuses = { '': '전체', OPEN: '모집 중', UPCOMING: '모집 예정', CLOSED: '모집 마감' };
export default defineComponent({
  components: { AppIcon },
  data() {
    const filters = filtersFromQuery(this.$route.query);
    return { filters, searchTitle: filters.title, positions, languages, educationFields, durations, recruitmentStatuses, mobileOpen: false, openFilter: null as FilterKey | null, positionSearch: '', languageSearch: '', careerDraft: '', careerError: '' };
  },
  mounted() { document.addEventListener('click', this.onOutsideClick); document.addEventListener('keydown', this.onEscape); },
  beforeUnmount() { document.removeEventListener('click', this.onOutsideClick); document.removeEventListener('keydown', this.onEscape); },
  computed: {
    matchingPositions() { const term = this.positionSearch.trim().toLowerCase(); return this.positions.filter(value => `${formatPosition(value)} ${value}`.toLowerCase().includes(term)); },
    matchingTechnologyGroups() { return matchingTechnologyGroups(this.languageSearch); },
    educationCount() { return educationFields.filter(field => this.filters[field.key]).length + ['duration','startAfter','startBefore'].filter(key => this.filters[key as 'duration' | 'startAfter' | 'startBefore']).length; },
    chips() {
      const chips = this.filters.positions.map(item => ({ key: `position:${item}`, label: formatPosition(item) }));
      for (const item of this.filters.languages ?? []) chips.push({ key: `language:${item}`, label: formatLanguages([item]) });
      if (this.filters.recruitmentStatus) chips.push({ key: 'status', label: recruitmentStatuses[this.filters.recruitmentStatus] });
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
    toggleFilter(key: FilterKey) {
      const previous = this.openFilter;
      this.closeFilter();
      if (previous !== key) this.openFilter = key;
    },
    closeFilter(restoreFocus = false) {
      const key = this.openFilter;
      this.openFilter = null;
      this.careerDraft = this.filters.career ? String(this.filters.career) : '';
      this.careerError = '';
      if (restoreFocus && key) (this.$el as HTMLElement).querySelector<HTMLButtonElement>(`#${key}-filter-button`)?.focus();
    },
    toggleMobileFilters() { this.mobileOpen = !this.mobileOpen; if (!this.mobileOpen) this.closeFilter(); },
    onOutsideClick(event: MouseEvent) { if (event.target instanceof Node && !(this.$refs.filterControls as HTMLElement | undefined)?.contains(event.target)) this.closeFilter(); },
    onEscape(event: KeyboardEvent) { if (event.key === 'Escape' && this.openFilter) { event.preventDefault(); this.closeFilter(true); } },
    selectStatus() { this.commit(); this.closeFilter(true); },
    applyCareer() {
      const value = this.careerDraft.trim();
      const year = Number(value);
      if (!/^\d+$/.test(value) || !Number.isSafeInteger(year) || year < 1 || year > 2147483647) {
        this.careerError = '1 이상의 정수 연차를 입력해 주세요.';
        return;
      }
      this.selectCareer(year);
    },
    selectCareer(year: number) { this.filters.career = year; this.commit(); this.closeFilter(true); },
    commit() { return this.$router.push({ path: '/', query: filtersToQuery(this.filters) }); },
    submitSearch() { return this.$router.push({ path: '/', query: filtersToQuery({ ...this.filters, title: this.searchTitle }) }); },
    changeMode() { this.closeFilter(); this.filters.career = 0; this.filters.payment = 0; this.filters.tuition = ''; for (const field of educationFields) delete this.filters[field.key]; delete this.filters.duration; delete this.filters.startAfter; delete this.filters.startBefore; this.commit(); },
    reset() { this.closeFilter(); this.searchTitle = ''; this.filters = filtersFromQuery({ type: this.filters.announcementType }); this.commit(); },
    removeChip(key: string) {
      if (key.startsWith('position:')) this.filters.positions = this.filters.positions.filter(item => item !== key.slice(9));
      else if (key.startsWith('language:')) this.filters.languages = (this.filters.languages ?? []).filter(item => item !== key.slice(9));
      else if (key === 'status') this.filters.recruitmentStatus = '';
      else if (key === 'tuition') this.filters.tuition = '';
      else if (key === 'career') this.filters.career = 0;
      else if (key === 'payment') this.filters.payment = 0;
      else if (educationFields.some(field => field.key === key)) delete this.filters[key as typeof educationFields[number]['key']];
      else if (key === 'duration' || key === 'startAfter' || key === 'startBefore') delete this.filters[key];
      else if (key === 'title') { this.filters.title = ''; this.searchTitle = ''; }
      this.commit();
    },
  },
  watch: { '$route.query': { handler() { const next = filtersFromQuery(this.$route.query); if (next.title !== this.filters.title) this.searchTitle = next.title; this.filters = next; } } },
});
</script>
<style scoped>
.filter-group { position: relative; min-width: 138px; flex: 1; }
.filter-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--surface);
  color: var(--muted);
  text-align: left;
  font-size: 14px;
  line-height: 1.4;
}
.filter-trigger > span:first-child { white-space: nowrap; }
.filter-value { margin-left: auto; color: var(--meta); font-size: 12px; white-space: nowrap; }
.filter-trigger.is-active, .filter-trigger[aria-expanded="true"] { border-color: #a5b4fc; color: var(--primary); }
.filter-trigger.is-active .filter-value { color: var(--primary); }
.filter-trigger[aria-expanded="true"] > svg { transform: rotate(180deg); }
.filter-popover {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 20;
  display: block;
  width: 300px;
  min-width: 0;
  max-height: none;
  overflow: visible;
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: 0 8px 28px #0f172a15;
}
.position-options { width: 360px; }
#status-filter-panel { left: auto; right: 0; width: 240px; }
#career-filter-panel { left: auto; right: 0; width: 320px; }
.filter-panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; font-size: 14px; }
.filter-panel-heading button { display: grid; place-items: center; width: 32px; height: 32px; padding: 0; border: 0; border-radius: 6px; background: transparent; color: var(--meta); }
.filter-panel-heading button:hover { background: var(--primary-soft); }
.filter-popover > input { height: 40px; padding: 8px 12px; font-size: 13px; }
.filter-choice-list { display: grid; gap: 4px; max-height: 240px; overflow: auto; overscroll-behavior: contain; margin-top: 12px; padding: 4px; }
.position-options .filter-choice-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.filter-choice-list label { display: flex; align-items: center; min-height: 40px; padding: 8px; gap: 10px; border-radius: 6px; cursor: pointer; font-size: 13px; white-space: normal; line-height: 1.4; }
.filter-choice-list label:hover { background: var(--primary-soft); }
.filter-choice-list input { flex-shrink: 0; margin: 0; }
.filter-choice-list .is-selected { background: var(--primary-soft); color: var(--primary-dark); }
.technology-filter-groups { max-height: 280px; overflow: auto; overscroll-behavior: contain; margin-top: 12px; }
.technology-filter-groups .filter-choice-list { max-height: none; overflow: visible; margin-top: 0; }
.technology-filter-groups legend { padding: 12px 8px 4px; color: var(--meta); font-size: 12px; font-weight: 600; }
#status-filter-panel .filter-choice-list { margin-top: 0; }
.filter-hint, .filter-empty { margin-top: 12px; color: var(--meta); font-size: 12px; line-height: 1.6; }
.filter-empty { color: var(--muted); }
#career-filter-panel > .filter-hint { margin-top: 0; }
.career-form { margin-top: 16px; }
.career-form > label { display: block; padding: 0; margin-bottom: 8px; font-size: 13px; }
.career-form > label:hover { background: transparent; }
.career-input-row { display: flex; align-items: center; gap: 8px; }
.career-input-row input { flex: 1; width: 0; height: 42px; padding: 8px 12px; }
.career-input-row > span { color: var(--muted); font-size: 13px; }
.career-input-row .button { padding: 10px 16px; }
.career-form .field-error { margin-top: 8px; }
.career-quick-values { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.career-quick-values button { flex: 1; min-height: 40px; border: 1px solid var(--line); border-radius: 7px; background: var(--surface); color: var(--muted); font-size: 13px; }
.career-quick-values .is-selected { border-color: #a5b4fc; background: var(--primary-soft); color: var(--primary-dark); }
.career-clear { display: block; margin-top: 12px; min-height: 40px; width: 100%; border: 0; border-radius: 7px; background: transparent; color: var(--meta); font-size: 13px; text-align: left; padding: 8px 0; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
@media (max-width: 640px) {
  .filter-options { gap: 10px; }
  .filter-group, .filter-options > select { flex-basis: 100%; min-width: 0; }
  .filter-popover, .position-options, #status-filter-panel, #career-filter-panel { position: static; width: 100%; margin-top: 8px; padding: 12px; box-shadow: none; }
  .position-options .filter-choice-list { grid-template-columns: 1fr; }
}
</style>
