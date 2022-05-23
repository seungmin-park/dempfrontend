<template>
  <main>
    <div class="detall-announce">
      <h1 class="detall-announce-title">
        {{ DetailAnnounce.title }}
      </h1>
      <div class="detall-announce-info">
        <div class="detall-announce-info-img">
          <img :src="require(`@/assets/${DetailAnnounce.image}`)" />
        </div>
        <div class="detall-announce-info-location">
          <p>
            <a
              :href="DetailAnnounce.accessUrl"
              style="text-decoration: none; color: rgba(0, 0, 0, 0.7)"
              >지원하기</a
            >
          </p>
          <p>
            <a href="/" style="text-decoration: none; color: rgba(0, 0, 0, 0.7)"
              >채팅방</a
            >
          </p>
        </div>
      </div>

      <span class="detall-announce-content">
        <p class="detall-announce-content-sub">
          회사명 : {{ DetailAnnounce.company.name }}
        </p>
        <p
          class="detall-announce-content-sub"
          v-text="
            DetailAnnounce.payment == 0
              ? '교육비 : 무료'
              : '교육비 : ' + DetailAnnounce.payment + ` 만원`
          "
          v-if="DetailAnnounce.announcementType == 'edu'"
        ></p>
        <p
          class="detall-announce-content-sub"
          v-if="DetailAnnounce.announcementType == 'emp'"
        >
          연봉 : {{ DetailAnnounce.payment }} 만원
        </p>
        <p class="detall-announce-content-sub">
          지원기간 : {{ DetailAnnounce.startedDate }} ~
          {{ DetailAnnounce.deadLineDate }}
        </p>
        <p class="detall-announce-content-sub">
          포지션 : {{ DetailAnnounce.position }}
        </p>
        <p class="detall-announce-content-sub">
          언어 : {{ DetailAnnounce.language }}
        </p>
        <p class="detall-announce-content-sub">
          경력 : {{ DetailAnnounce.career }}
        </p>
        지원 자격 :
        <p
          class="detall-announce-content-sub"
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
    if (this.$store.state.token == "") {
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
        image: "noimg.jpg",
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
            "X-AUTH-TOKEN": this.$store.state.token,
          },
        })
        .then((res) => {
          this.DetailAnnounce = res.data;
        });
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
.detall-announce {
  border-top: 1px solid rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.detall-announce-info {
  display: flex;
  align-items: center;
  justify-content: left;
}

.detall-announce-info-img {
  padding: 0%;
  overflow: hidden;
  width: auto;
  height: auto;
  margin: 0;
}

.detall-announce-info-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detall-announce-info-location {
  padding-left: 20px;
}

.detall-announce-info-location p {
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
