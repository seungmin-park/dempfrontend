<template><div class="page writing-page"><header class="page-heading"><h1>공고 등록</h1><p>지원자가 알아야 할 정보를 차근차근 알려주세요.</p></header><announcement-write /></div></template>
<script lang="ts">
import { defineComponent } from "vue";
import AnnouncementWrite from "../../components/announcement/AnnouncementWrite.vue";
export default defineComponent({
  components: {
    AnnouncementWrite,
  },
});
</script>
