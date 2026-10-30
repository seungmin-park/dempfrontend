<template>
  <div class="page discovery-page">
    <DiscoveryIntro />
    <section id="announcement-discovery" class="discovery-catalog" aria-labelledby="catalog-title" tabindex="-1">
      <header class="discovery-catalog-heading"><h2 id="catalog-title">어떤 기회를 찾고 있나요?</h2><p>나에게 중요한 조건부터 골라보세요.</p></header>
      <AnnouncementHeader />
      <section class="announcement-list" aria-label="공고 목록"><AnnouncementList /></section>
    </section>
    <DiscoveryGuide />
  </div>
</template>
<script setup lang="ts">
import AnnouncementList from '@/components/announcement/AnnouncementList.vue';
import AnnouncementHeader from '@/components/announcement/AnnouncementHeader.vue';
import DiscoveryIntro from '@/components/announcement/DiscoveryIntro.vue';
import DiscoveryGuide from '@/components/announcement/DiscoveryGuide.vue';
</script>
