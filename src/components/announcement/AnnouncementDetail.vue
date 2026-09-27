<template>
  <main>
    <div class="detail-announce">
      <h1 class="detail-announce-title">
        {{ announcement.title }}
      </h1>
      <div class="detail-announce-info">
        <div class="detail-announce-info-img">
          <img :src="announcement.image" style="width: 255px; height: 255px;"/>
        </div>
        <div class="detail-announce-info-location">
          <p>
            <a
              :href="announcement.accessUrl ?? undefined"
              style="text-decoration: none; color: rgba(0, 0, 0, 0.7)"
              >지원하기</a
            >
          </p>
          <p>
            <a @click="showChatUnavailable" style="text-decoration: none; color: rgba(0, 0, 0, 0.7)">채팅방</a>
          </p>
        </div>
      </div>

      <span class="detail-announce-content">
        <p class="detail-announce-content-sub">
          회사명 : {{ announcement.company }}
        </p>
        <p
          class="detail-announce-content-sub"
          v-text="
            announcement.payment == 0
              ? '교육비 : 무료'
              : '교육비 : ' + announcement.payment + ` 만원`
          "
          v-if="announcement.type === 'EDU'"
        ></p>
        <p
          class="detail-announce-content-sub"
          v-if="announcement.type === 'EMP'"
        >
          연봉 : {{ announcement.payment }} 만원
        </p>
        <p class="detail-announce-content-sub">
          지원기간 : {{ announcement.startedDate }} ~
          {{ announcement.deadLineDate }}
        </p>
        <p class="detail-announce-content-sub">
          포지션 : {{ announcement.position }}
        </p>
        <p class="detail-announce-content-sub">
          언어 : {{ (announcement.language || []).join(', ') }}
        </p>
        <p class="detail-announce-content-sub">
          경력 : {{ careerText }}
        </p>
        지원 자격 :
        <SafeHtml
          class="detail-announce-content-sub"
          :content="announcement.content ?? ''"
        />
      </span>
    </div>
  </main>
</template>

<script lang="ts">
import type { AnnouncementDetail } from '@/types/api';
import { routeId } from '@/router/query';
import { defineComponent } from "vue";
import SafeHtml from "@/components/common/SafeHtml.vue";
import { getAnnouncementDetail } from "@/api/announcements";

export default defineComponent({
  components: { SafeHtml },
  created(){
    if (this.$store.state.Login.token == "") {
      this.$router.replace({
        path: "/login",
        query: { redirect: this.$router.currentRoute.value.fullPath },
      });
  }},
  mounted() {
    {
      this.loadAnnouncementDetail();
    }
  },
  data(): { announcement: Partial<AnnouncementDetail> } {
    return {
      announcement: {
        image: "https://inhatc-demp.s3.ap-northeast-2.amazonaws.com/noimg.jpg",
        company: "",
        language: [],
      },
    };
  },
  computed: {
    careerText() {
      if (this.announcement.maxCareer === 0) {
        return `${this.announcement.minCareer}년 이상`;
      }
      return `${this.announcement.minCareer}년 ~ ${this.announcement.maxCareer}년`;
    },
  },
  methods: {
    loadAnnouncementDetail() {
      getAnnouncementDetail(routeId(this.$route.params.itemId))
        .then((announcement) => {
          this.announcement = announcement;
        });
    },
    showChatUnavailable(){
      alert('지원 예정 입니다.');
    },
  },
  watch: {
    $route: {
      handler() {
        this.loadAnnouncementDetail();
      },
    },
  },
});
</script>

<style>
.detail-announce {
  border-top: 1px solid rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.detail-announce-info {
  display: flex;
  align-items: center;
  justify-content: left;
}

.detail-announce-info-img {
  padding: 0%;
  overflow: hidden;
  width: auto;
  height: auto;
  margin: 0;
}

.detail-announce-info-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-announce-info-location {
  padding-left: 20px;
}

.detail-announce-info-location p {
  display: flex;
  border: 1px solid black;
  border-radius: 5px;
  width: 105px;
  height: 50px;
  background-color: #b3dce0;
  margin: 10px 0px 10px 0px;
  align-items: center;
  justify-content: center;
}
</style>
