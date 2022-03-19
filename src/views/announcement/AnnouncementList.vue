<template>
  <div>
    <announcement-header />
  </div>
  <div>
    <announcement-list />
  </div>
</template>

<script>
import AnnouncementList from "../../components/announcement/AnnouncementList.vue";
import AnnouncementHeader from "../../components/announcement/AnnouncementHeader.vue";
export default {
  components: {
    AnnouncementList,
    AnnouncementHeader,
  },
};
</script>
