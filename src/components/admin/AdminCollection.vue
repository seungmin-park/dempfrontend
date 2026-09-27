<template>
  <div>
    <div class="admin-section-heading"><div><h2>{{ heading }}</h2><p>목록에서 내용을 확인하고 수정하거나 삭제할 수 있습니다.</p></div><router-link v-if="kind === 'announcements'" class="button button-primary" to="/admin/announcements/new">공고 등록</router-link></div>
    <p v-if="notice" class="admin-notice" role="status">{{ notice }}</p>
    <form class="admin-search" @submit.prevent="search"><label class="sr-only" for="admin-search">제목·작성자 검색</label><input id="admin-search" v-model="term" :placeholder="kind === 'announcements' ? '공고 제목 또는 기관 검색' : '질문 제목 또는 작성자 검색'" /><select v-if="kind === 'announcements'" v-model="type" aria-label="공고 종류"><option value="">전체 공고</option><option value="EMP">채용</option><option value="EDU">교육·부트캠프</option></select><button class="button button-primary" :disabled="busy">검색</button></form>
    <AsyncState :loading="loading" :error="error" @retry="load" />
    <template v-if="!loading && !error">
      <p v-if="!rows.length" class="state-panel">조건에 맞는 {{ heading }}이 없습니다.</p>
      <div v-else class="admin-rows"><article v-for="row in rows" :key="row.id" class="admin-row"><div class="admin-row-body"><p class="eyebrow">{{ row.subtitle }}</p><router-link :to="`/admin/${kind}/${row.id}`" class="admin-row-title">{{ row.title || '제목 없음' }}</router-link><p>{{ row.meta }}</p></div><div class="admin-row-actions"><router-link class="button button-secondary" :to="`/admin/${kind}/${row.id}`">내용·수정</router-link><button class="button button-quiet danger-text" :data-test="`delete-${row.id}`" :disabled="busy" @click="selected = row">삭제</button></div></article></div>
      <div v-if="rows.length || page > 0" class="question-pages"><button class="button button-secondary" :disabled="page === 0 || busy" @click="navigate(page-1)">이전</button><span>{{ page+1 }} 페이지<span v-if="total !== undefined"> · 총 {{ total }}개</span></span><button class="button button-secondary" :disabled="last || busy" @click="navigate(page+1)">다음</button></div>
    </template>
    <p v-if="mutationError" class="form-error" role="alert">{{ mutationError }}</p>
    <ConfirmDelete v-if="selected" :title="selected.title" :description="kind === 'questions' ? '이 질문의 답변도 함께 삭제됩니다.' : ''" :busy="busy" @cancel="selected = null" @confirm="remove" />
  </div>
</template>
<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { fetchAdminAnnouncements, fetchAdminPosts, deleteAdminItem, type CollectionKind } from '@/api/admin';
import { formatLanguages, formatRecruitDate } from '@/presentation/announcement';
import { requestErrorMessage } from '@/presentation/requestError';
import AsyncState from '@/components/common/AsyncState.vue';
import ConfirmDelete from './ConfirmDelete.vue';
interface Row { id: number; title: string; subtitle: string; meta: string }
export default defineComponent({
  components: { AsyncState, ConfirmDelete },
  props: { kind: { type: String as PropType<CollectionKind>, required: true } },
  data: () => ({ rows: [] as Row[], selected: null as Row | null, loading: true, busy: false, error: '', mutationError: '', notice: '', term: '', type: '', page: 0, last: true, total: undefined as number | undefined, generation: 0 }),
  computed: { heading(): string { return this.kind === 'announcements' ? '공고·부트캠프' : this.kind === 'questions' ? '질문' : '답변'; } },
  mounted() { this.load(); },
  beforeUnmount() { this.generation++; },
  watch: { '$route.query': 'load', kind: 'load' },
  methods: {
    async load() {
      const current = ++this.generation;
      this.loading = true; this.error = ''; this.selected = null;
      this.term = String(this.$route.query.q || ''); this.type = ['EMP','EDU'].includes(String(this.$route.query.type)) ? String(this.$route.query.type) : '';
      const value = Number(this.$route.query.page || 0); this.page = Number.isSafeInteger(value) && value >= 0 ? value : 0;
      if (this.$route.query.cleanup === 'pending') this.notice = '변경은 저장되었습니다. 이미지 정리가 지연되어 운영 로그 확인이 필요합니다.';
      try {
        if (this.kind === 'announcements') {
          const result = await fetchAdminAnnouncements(this.term, this.type, this.page);
          if (current !== this.generation) return;
          this.rows = result.content.map(item => ({ id: item.id, title: item.title || '', subtitle: `${item.announcementType === 'EDU' ? '교육·부트캠프' : '채용'} · ${item.company || '기관 정보 없음'}`, meta: `${formatLanguages(item.language)} · 마감 ${formatRecruitDate(item.deadLineDate)}` }));
          this.last = result.last; this.total = undefined;
        } else {
          const result = await fetchAdminPosts(this.kind, this.term, this.page);
          if (current !== this.generation) return;
          this.rows = result.content.map(item => ({ id: item.id, title: item.title, subtitle: `작성자 ${item.username}`, meta: this.kind === 'answers' ? `질문 #${item.questionId}의 답변 #${item.id}` : item.hashtags.join(', ') }));
          this.last = result.last; this.total = result.totalElements;
        }
      } catch (reason) { if (current === this.generation) this.error = requestErrorMessage(reason); }
      finally { if (current === this.generation) this.loading = false; }
    },
    search() { this.navigate(0, true); },
    navigate(page: number, changed = false) {
      this.$router.push({ path: `/admin/${this.kind}`, query: { ...(changed ? { q: this.term, ...(this.kind === 'announcements' ? { type: this.type } : {}) } : this.$route.query), page: String(page) } });
    },
    async remove() {
      if (!this.selected || this.busy) return;
      const current = this.generation, id = this.selected.id;
      this.busy = true; this.mutationError = '';
      try {
        const result = await deleteAdminItem(this.kind,id);
        if (current !== this.generation) return;
        this.notice = result.cleanupPending ? '삭제되었습니다. 이미지 정리가 지연되어 운영 로그 확인이 필요합니다.' : '삭제되었습니다.';
        this.selected = null; await this.load();
      } catch (reason) { if (current === this.generation) { this.selected = null; this.mutationError = requestErrorMessage(reason); } }
      finally { this.busy = false; }
    },
  },
});
</script>
