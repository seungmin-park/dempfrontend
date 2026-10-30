<template>
  <section class="discovery-hero" aria-labelledby="discovery-title">
    <div class="discovery-hero-copy">
      <p class="discovery-eyebrow"><span aria-hidden="true"></span>개발자의 다음 선택을 위한 곳</p>
      <h1 id="discovery-title">다음 커리어의 시작,<br>내 조건에 맞게.</h1>
      <p class="discovery-lead">개발자 채용부터 교육 과정까지.<br>흩어진 정보를 같은 기준으로 비교하고,<br>궁금한 것은 함께 물어보세요.</p>
      <a class="button button-primary discovery-primary-action" href="#announcement-discovery">내 조건으로 찾아보기 <AppIcon name="arrowRight" /></a>
      <p class="discovery-availability"><AppIcon name="check" :size="16" />목록은 가입 없이 둘러볼 수 있어요.</p>
    </div>
    <div class="discovery-journey" role="img" aria-label="배움에서 시작해 경험을 쌓고 나에게 맞는 다음 기회로 이어지는 커리어 탐색">
      <svg class="journey-path" viewBox="0 0 500 400" fill="none" aria-hidden="true"><path d="M0 310H90Q115 310 115 285V220Q115 195 140 195H350Q380 195 380 165V80Q380 55 405 55H500" /><path d="M0 340H120Q145 340 145 315V250Q145 225 170 225H380Q410 225 410 195V110Q410 85 435 85H500" /></svg>
      <p class="journey-caption">나의 커리어 탐색</p>
      <h2>배움에서 시작해<br>나에게 맞는 일로.</h2>
      <div class="journey-learning"><AppIcon name="book" :size="32" /><div><strong>지금 필요한 배움</strong><span>기술 · 교육 방식 · 기간으로 비교</span></div></div>
      <div class="journey-destination"><div><span>다음 목적지</span><strong>나에게 맞는 커리어</strong></div><AppIcon name="arrowRight" :size="24" /></div>
      <p class="journey-footnote">각자의 속도로, 더 선명한 다음 단계.</p>
    </div>
  </section>
</template>
<script setup lang="ts">
import AppIcon from '@/components/common/AppIcon.vue';
</script>
