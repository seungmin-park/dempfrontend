<template>
  <div class="announcement">
    <div class="announcement-element">
      <div class="announcement-header">
        <announcement-header />
      </div>
      <div class="announcement-list">
        <announcement-list />
      </div>
    </div>
  </div>
</template>

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

<style>
.announcement{
  margin-left: 5%;
}
</style>
