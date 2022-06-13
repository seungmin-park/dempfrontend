<template>
  <main>
    <div class="detail-announce">
      <h1 class="detail-announce-title">
        {{ DetailAnnounce.title }}
      </h1>
      <div class="detail-announce-info">
        <div class="detail-announce-info-img">
          <img :src="DetailAnnounce.image" style="width: 255px; height: 255px;"/>
        </div>
        <div class="detail-announce-info-location">
          <p>
            <a
              :href="DetailAnnounce.accessUrl"
              style="text-decoration: none; color: rgba(0, 0, 0, 0.7)"
              >지원하기</a
            >
          </p>
          <p>
            <a @click="updateSchedule" style="text-decoration: none; color: rgba(0, 0, 0, 0.7)">채팅방</a>
          </p>
        </div>
      </div>

      <span class="detail-announce-content">
        <p class="detail-announce-content-sub">
          회사명 : {{ DetailAnnounce.company.name }}
        </p>
        <p
          class="detail-announce-content-sub"
          v-text="
            DetailAnnounce.payment == 0
              ? '교육비 : 무료'
              : '교육비 : ' + DetailAnnounce.payment + ` 만원`
          "
          v-if="DetailAnnounce.announcementType == 'edu'"
        ></p>
        <p
          class="detail-announce-content-sub"
          v-if="DetailAnnounce.announcementType == 'emp'"
        >
          연봉 : {{ DetailAnnounce.payment }} 만원
        </p>
        <p class="detail-announce-content-sub">
          지원기간 : {{ DetailAnnounce.startedDate }} ~
          {{ DetailAnnounce.deadLineDate }}
        </p>
        <p class="detail-announce-content-sub">
          포지션 : {{ DetailAnnounce.position }}
        </p>
        <p class="detail-announce-content-sub">
          언어 : {{ DetailAnnounce.language }}
        </p>
        <p class="detail-announce-content-sub">
          경력 : {{ DetailAnnounce.career }}
        </p>
        지원 자격 :
        <p
          class="detail-announce-content-sub"
          v-html="DetailAnnounce.content"
        ></p>
      </span>
    </div>
  </main>
</template>

<script>
import axios from "axios";

export default {
  created(){
    if (this.$store.state.Login.token == "") {
      this.$router.replace({
        path: "/login",
        query: { redirect: this.$router.currentRoute.value.fullPath },
      });
  }},
  mounted() {
    {
      this.getDetailAnnounce();
    }
  },
  data() {
    return {
      DetailAnnounce: {
        image: "https://inhatc-demp.s3.ap-northeast-2.amazonaws.com/noimg.jpg",
        company: {
          name: "",
        },
      },
    };
  },
  methods: {
    getDetailAnnounce() {
      axios
        .get(`/api/announce/detail/${this.$route.params.itemId}`, {
          headers: {
            "X-AUTH-TOKEN": this.$store.state.Login.token,
          },
        })
        .then((res) => {
          this.DetailAnnounce = res.data;
        });
    },
    updateSchedule(){
      alert('지원 예정 입니다.');
    },
  },
  watch: {
    $route: {
      handler() {
        this.getDetailAnnounce();
      },
    },
  },
};
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
