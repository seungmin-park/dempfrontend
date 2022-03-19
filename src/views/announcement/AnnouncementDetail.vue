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

<script>
import AnnouncementScroll from "../../components/announcement/AnnouncementScroll";
import AnnouncementDetail from "../../components/announcement/AnnouncementDetail";
export default {
  components: {
    AnnouncementScroll,
    AnnouncementDetail,
  },
};
</script>

<style>
.details {
  display: flex;
  justify-content: space-between;
  margin: 50px 20% 50px 20%;
}
</style>
