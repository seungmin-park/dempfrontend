<template>
  <div class="anncoucement-scroll">
    <div class="anncoucement-scroll-header">
      <span @click="$router.push('/')" class="anncoucement-scroll-history">
        &lt;-
      </span>
      <span>전체 공고</span>
    </div>

    <div role="link" tabindex="0" @keydown.enter="$router.push({ name: 'detail', params: { itemId: item.id } })"
      @click="
        $router.push({
          name: 'detail',
          params: { itemId: item.id },
        })
      "
      class="anncoucement-scroll-items"
      v-for="item in announcement"
      :key="item.id"
    >
      <div class="anncoucement-scroll-items-img">
        <CompanyImage :src="item.image" />
      </div>
      <div class="anncoucement-scroll-items-description">
        <p class="item-title">{{ item.company?.name ?? '' }}</p>
        <p class="item-company">{{ item.title }}</p>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import type { AnnouncementScroll } from '@/types/api';
import CompanyImage from '@/components/common/CompanyImage.vue';
import { defineComponent } from "vue";
import { getAnnouncementScroll } from '@/api/announcements';
export default defineComponent({
  name: "announcement-scroll",
  components: { CompanyImage },
  mounted() {
    {
      this.getScroll();
    }
  },
  data() {
    return {
      announcement: [] as AnnouncementScroll[],
    };
  },
  methods: {
    getScroll() {
      getAnnouncementScroll().then((res) => {
        this.announcement = res.data;
      });
    },
  },
});
</script>
