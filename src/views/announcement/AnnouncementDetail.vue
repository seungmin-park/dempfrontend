<template><div class="page detail-layout"><aside class="detail-sidebar"><announcement-scroll /></aside><div class="details-announcement"><announcement-detail /></div></div></template>
<script lang="ts">
import { defineComponent } from "vue";
import AnnouncementScroll from "../../components/announcement/AnnouncementScroll.vue";
import AnnouncementDetail from "../../components/announcement/AnnouncementDetail.vue";
export default defineComponent({
  components: {
    AnnouncementScroll,
    AnnouncementDetail,
  },
});
</script>
