<template>
  <div class="details">
    <div class="details-scroll">
      <announcement-scroll />
    </div>
    <div class="details-announcement">
      <announcement-detail />
    </div>
  </div>
</template>

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

<style>
.details {
  display: flex;
  justify-content: space-between;
  margin: 50px 20% 50px 20%;
}
</style>
