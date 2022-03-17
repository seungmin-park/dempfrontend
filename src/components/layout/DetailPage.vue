<template>
  <main>
    <div class="testPage">
      <span></span>
    </div>
    <div class="detall-announce">
      <h1 class="detall-announce-title">{{ DetailAnnounce.title }}</h1>
      <div>
        <img src="@/assets/line.png" alt="" />
        <div><a href="/">지원하기</a></div>
        <div><a href="/">채팅방</a></div>
      </div>
      <div>
        <span class="detall-announce-content">
          <p class="detall-announce-content-sub">
            기술 스택 : {{ DetailAnnounce.skill }}
          </p>
          <p class="detall-announce-content-sub">
            경력 : {{ DetailAnnounce.career }}
          </p>
          <p class="detall-announce-content-sub">
            지원 자격 : {{ DetailAnnounce.content }}
          </p>
        </span>
      </div>
    </div>
  </main>
</template>

<script>
import axios from "axios";

export default {
  mounted() {
    {
      this.getDetailAnnounce();
    }
  },
  data() {
    return {
      DetailAnnounce: {},
    };
  },
  methods: {
    getDetailAnnounce() {
      axios
        .post(
          "/announce/detail",
          JSON.stringify({ id: this.$route.params.itemId }),
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
        .then((res) => {
          this.DetailAnnounce = res.data;
        });
    },
  },
};
</script>

<style>
main {
  display: flex;
  margin: 50px 200px 0 200px;
  padding: 0 30px 0 30px;
}

.testPage {
  width: 50%;
}

.detall-announce {
  box-shadow: 10px #000808;
  width: 50%;
}
</style>
