<template>
  <div class="announcement">
    <div class="announcement-element">
      <div class="announcement-header">
        <announcement-header />
      </div>
      <div class="announcement-list">
        <announcement-list />
      </div>
      <div class="announcement-footer">
        <announcement-footer />
      </div>
    </div>
  </div>
</template>

<script>
import AnnouncementList from "../../components/announcement/AnnouncementList.vue";
import AnnouncementHeader from "../../components/announcement/AnnouncementHeader.vue";
import AnnouncementFooter from "../../components/announcement/AnnouncementFooter.vue";
export default {
  components: {
    AnnouncementList,
    AnnouncementHeader,
    AnnouncementFooter,
  },
};
</script>

<style>
.announcement {
  position: relative;
}
.announcement-element {
  position: absolute;
}
</style>
