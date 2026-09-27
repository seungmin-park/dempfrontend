<template>
  <div>
    <announcement-write />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import AnnouncementWrite from "../../components/announcement/AnnouncementWrite.vue";
export default defineComponent({
  components: {
    AnnouncementWrite,
  },
});
</script>
