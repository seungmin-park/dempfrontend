<template>
  <section class="discovery-benefits" aria-label="탐색을 돕는 기능">
    <article><AppIcon name="filter" :size="30" /><h2>비교는 한눈에</h2><p>직무와 기술, 경력부터 교육 기간과 비용까지. 핵심 조건을 같은 형식으로 살펴보세요.</p></article>
    <article><AppIcon name="list" :size="30" /><h2>관심 있는 기회는 한곳에</h2><p>마음에 드는 공고를 저장해 두세요. 다시 검색하지 않고 이어서 비교할 수 있어요.</p></article>
    <article><AppIcon name="message" :size="30" /><h2>궁금한 것은 함께</h2><p>학습과 면접 준비 중 생긴 질문을 나누고, 다른 개발자의 경험을 참고하세요.</p><router-link to="/question">면접 질문 둘러보기 <AppIcon name="arrowRight" :size="16" /></router-link></article>
  </section>
  <section ref="tagline" class="discovery-tagline" aria-label="찾는 시간은 줄이고 가능성은 더 가까이">
    <h2><span v-for="(line,index) in taglineLines" :key="index" class="tagline-line"><span v-for="(word,wordIndex) in line" :key="word" class="tagline-word" :style="{ transitionDelay: `${(index * 3 + wordIndex) * 60}ms` }">{{ word }} </span></span></h2>
    <p>여러 탭을 오가던 탐색 대신,<br>나에게 맞는 선택에 집중하세요.</p>
  </section>
  <section class="discovery-how" aria-labelledby="discovery-how-title">
    <p class="discovery-eyebrow">처음 오셨나요?</p><h2 id="discovery-how-title">다음 기회까지, 세 단계면 돼요.</h2>
    <ol><li><h3>찾고 싶은 분야 선택</h3><p>새로운 일을 찾는다면 채용, 배움이 필요하다면 부트캠프를 선택하세요.</p></li><li><h3>내 조건으로 비교</h3><p>직무와 기술, 경력을 골라 좁히고 마음에 드는 공고는 저장해 두세요.</p></li><li><h3>원문에서 확인하고 지원</h3><p>로그인 후 상세 조건을 확인하고, 연결된 원본 모집 페이지에서 지원하세요.</p></li></ol>
  </section>
  <section class="discovery-faq" aria-labelledby="discovery-faq-title"><div><p class="discovery-eyebrow">자주 묻는 질문</p><h2 id="discovery-faq-title">탐색 전에<br>궁금할 수 있으니까.</h2></div><div>
    <details><summary>회원가입 없이 공고를 볼 수 있나요?</summary><p>목록은 가입 없이 둘러볼 수 있습니다. 상세 조회와 관심 공고 저장에는 로그인이 필요합니다. 로그인 후 원래 공고와 검색 조건으로 돌아옵니다.</p></details>
    <details><summary>DEMP에서 바로 지원하나요?</summary><p>지원은 공고에 연결된 원본 모집 페이지에서 진행합니다. 최종 조건과 제출 서류를 원문에서 확인하세요.</p></details>
    <details><summary>공고는 어떻게 확인하나요?</summary><p>운영자가 출처를 확인하고 핵심 조건을 정리합니다. 확인 이후 내용이 변경될 수 있으므로 지원 전 원문을 확인해 주세요.</p></details>
    <details><summary>관심 공고는 어디서 볼 수 있나요?</summary><p>공고의 관심 공고 버튼을 누르면 저장할 수 있습니다. 로그인한 뒤 마이페이지의 관심 공고에서 모아볼 수 있어요.</p></details>
    <details><summary>교육 과정은 모두 무료인가요?</summary><p>과정마다 비용과 지원 대상이 다릅니다. 교육비 필터와 상세 조건을 비교하고, 지원금과 자부담은 원문에서 확인하세요.</p></details>
    <details><summary>저장한 공고가 마감되면 어떻게 되나요?</summary><p>마감된 공고도 관심 목록에 남습니다. 비공개 또는 삭제된 공고는 이용 불가 상태로 안내합니다.</p></details>
  </div></section>
  <section class="discovery-final"><div><h2>지금의 나에게 맞는 다음 기회.</h2><p>나에게 필요한 조건부터 비교해 보세요.</p></div><a class="button discovery-final-action" href="#announcement-discovery">내 조건으로 찾아보기 <AppIcon name="arrowRight" /></a></section>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import AppIcon from '@/components/common/AppIcon.vue';
const tagline = ref<HTMLElement>();
const taglineLines = [['찾는', '시간은', '줄이고,'], ['가능성은', '더', '가까이.']];
let wordObserver: IntersectionObserver | undefined;
onMounted(() => {
  if (!tagline.value || typeof IntersectionObserver === 'undefined') return;
  wordObserver = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      wordObserver?.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -15% 0px', threshold: 1 });
  for (const word of tagline.value.querySelectorAll('.tagline-word')) wordObserver.observe(word);
  tagline.value.classList.add('has-word-reveal');
});
onUnmounted(() => wordObserver?.disconnect());
</script>
