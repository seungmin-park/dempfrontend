<template>
  <div class="announcemnt">
    <div class="announcemnt-element">
      <div class="announcemnt-header">
        <announcement-header />
      </div>
      <div class="announcemnt-list">
        <announcement-list />
      </div>
      <div class="announcemnt-footer">
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
.announcemnt {
  position: relative;
}
.announcemnt-element {
  position: absolute;
}
</style>
