<template><div class="page discovery-page"><header class="page-heading"><h1>개발자의 다음 기회</h1><p>채용부터 부트캠프까지, 나에게 맞는 시작을 찾아보세요.</p></header><announcement-header /><section class="announcement-list" aria-label="공고 목록"><announcement-list /></section></div></template>
<script lang="ts">
import { defineComponent } from "vue";
import AnnouncementList from "../../components/announcement/AnnouncementList.vue";
import AnnouncementHeader from "../../components/announcement/AnnouncementHeader.vue";
export default defineComponent({
  components: {
    AnnouncementList,
    AnnouncementHeader,
  },
});
</script>
