<template>
  <section class="answer-section" aria-label="답변">
    <AsyncState :loading="loading" :error="loadError" @retry="loadInitial" />
    <template v-if="!loading && !loadError"><h2>답변 <span class="count-label">표시된 답변 {{ answers.length }}개</span></h2>
    <article class="question-answer" v-for="item in answers" :key="item.answerId">
      <MemberBadge :username="item.username" />
      <SafeHtml class="answer-content" :content="item.content ?? ''" />
      <ContentReactionControl target="answer" :target-id="item.answerId" :my-reaction="item.myReaction ?? 'NONE'" class="question-answer-reaction" :recommend="item.recommend" :dislike="item.dislike" />
    </article>
    <p v-if="!answers.length" class="empty-answer">알고 있는 내용을 첫 답변으로 남겨주세요.</p>
    <p v-if="moreError" data-test="answer-more-error" role="alert" class="form-error">{{ moreError }}</p>
    <button v-if="hasNext" type="button" class="button" data-test="answer-load-more" :disabled="loadingMore" @click="loadMore">{{ loadingMore ? '불러오는 중…' : '답변 더 보기' }}</button>
    <div class="answer-composer">
      <h3>답변 작성</h3><MarkdownEditor id="answer" label="답변 본문" :model-value="body" :disabled="saving" @update:model-value="setBody" />
      <p v-if="saveError" role="alert" class="form-error">{{ saveError }}</p>
      <div class="form-actions"><button class="button button-primary" type="submit" :disabled="saving" @click="submitAnswer">{{ saving ? '저장 중…' : '댓글 달기' }}</button></div>
    </div>
  </template></section>
</template>
<script setup lang="ts">
import type { EntityId } from '@/types/api';
import AsyncState from '@/components/common/AsyncState.vue';
import SafeHtml from '@/components/common/SafeHtml.vue';
import MarkdownEditor from '@/components/common/MarkdownEditor.vue';
import MemberBadge from '@/components/common/MemberBadge.vue';
import ContentReactionControl from '@/components/common/ContentReactionControl.vue';
import { useQuestionAnswers } from '@/composables/useQuestionAnswers';

const props = defineProps<{ questionId: EntityId; username: string }>();
const { answers, body, hasNext, loading, loadingMore, saving, loadError, moreError, saveError,
  setBody, loadInitial, loadMore, submitAnswer } = useQuestionAnswers(props);
</script>
