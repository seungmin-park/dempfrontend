<template>
  <main>
    <div class="detall-announce">
      <h1 class="detall-announce-title">
        {{ DetailAnnounce[this.$route.params.itemId].title }}
      </h1>
      <div class="detall-announce-info">
        <div class="detall-announce-info-img">
          <img
            :src="
              require(`@/assets/${
                DetailAnnounce[this.$route.params.itemId].image
              }`)
            "
          />
        </div>
        <div class="detall-announce-info-location">
          <p>
            <a
              :href="DetailAnnounce[this.$route.params.itemId].accessUrl"
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
          회사명 : {{ DetailAnnounce[this.$route.params.itemId].company }}
        </p>
        <p class="detall-announce-content-sub">
          연봉/교육비 : {{ DetailAnnounce[this.$route.params.itemId].payment }}
        </p>
        <p class="detall-announce-content-sub">
          지원기간 : {{ DetailAnnounce[this.$route.params.itemId].period }}
        </p>
        <p class="detall-announce-content-sub">
          포지션 : {{ DetailAnnounce[this.$route.params.itemId].position }}
        </p>
        <p class="detall-announce-content-sub">
          언어 : {{ DetailAnnounce[this.$route.params.itemId].language }}
        </p>
        <p class="detall-announce-content-sub">
          경력 : {{ DetailAnnounce[this.$route.params.itemId].career }}
        </p>
        <p class="detall-announce-content-sub">
          지원 자격 : {{ DetailAnnounce[this.$route.params.itemId].content }}
        </p>
      </span>
    </div>
  </main>
</template>

<script>
// import axios from "axios";
import BoardData from "../../data/announcement";

export default {
  mounted() {
    {
      // this.getDetailAnnounce();
    }
  },
  data() {
    return {
      DetailAnnounce: BoardData,
    };
  },
  // methods: {
  //   getDetailAnnounce() {
  //     axios
  //       .post(
  //         "/announce/detail",
  //         JSON.stringify({ id: this.$route.params.itemId }),
  //         {
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //         }
  //       )
  //       .then((res) => {
  //         this.DetailAnnounce = res.data;
  //       });
  //   },
  // },
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
