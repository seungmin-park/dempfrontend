<template>
  <main>
    <div
      v-for="notice in BoardData"
      :key="notice.id"
      class="item"
      @click="$router.push(`/detail/${notice.id}`)"
    >
      <div class="item-image-box">
        <img
          :src="require(`@/assets/${notice.image}`)"
          class="white--text align-end card-image"
        />
      </div>
      <div align="left" class="big-font notice-title" style="font-weight: bold">
        <p>{{ notice.title }}</p>
      </div>
      <div class="medium-font">언어 : {{ notice.language }}</div>
      <div class="medium-font">포지션 : {{ notice.position }}</div>
    </div>
  </main>
</template>

<script>
import axios from "axios";
export default {
  name: "demp-announcement",
  mounted() {
    {
      this.emitter.on("emp", (e) => {
        this.typeParam = e;
        this.getAnnounce();
      });
      this.emitter.on("edu", (e) => {
        this.typeParam = e;
        this.getAnnounce();
      });
      this.getAnnounce();
    }
  },
  data() {
    return {
      BoardData: {},
      typeParam: "",
    };
  },
  methods: {
    getAnnounce() {
      axios
        .get("/api/announce", { params: { typeName: this.typeParam } })
        .then((res) => {
          this.BoardData = res.data;
        });
    },
  },
  watch: {
    typeName: function () {
      this.getAnnounce();
    },
  },
};
</script>

<style scoped>
main {
  display: flex;
  width: 100%;
  float: left;
}

.item-image-box {
  border-radius: 15px 15px 0 0;
  padding: 0%;
  width: 260px;
  height: 150px;
  overflow: hidden;
  margin: 0;
}

.item-image-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item {
  display: table;
  border: 1px solid rgba(0, 0, 0, 0.5);
  border-radius: 15px;
  margin: 0 15px 0px 15px;
  box-sizing: border-box;
}

.notice-detail {
  margin-top: 50px;
  align-items: center;
  width: 40%;
  min-width: 200px;
}
.inner {
  display: flex;
  justify-content: start;
  width: 90%;
  box-sizing: border-box;
  padding: 10px 0 40px 0;
  border-bottom: solid 1px #e8e8e8;
}
.notice-detail-main {
  display: flex;
  flex-direction: column;
}
.notice-header {
  padding: 18px;
  border-bottom: solid 1px #e8e8e8;
  font-family: "Jua", sans-serif;
}
.notice-body {
  display: flex;
  justify-content: center;
  align-content: space-between;
}
.notice-info {
  display: flex;
  justify-content: flex-end;
}
.notice-info {
  display: flex;
  flex-direction: column;
}
.notice-info .infos {
  font-size: 16px;
  margin-right: 15px;
}
.question-info .infos:last-child {
  margin-right: 5px;
}
.notice-content {
  padding: 30px 15px;
  word-break: break-all;
}
.notice-buttons {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 10px;
}
#apply-btn {
  width: 100px;
  padding: 10px;
  margin: 3px 3px;
}
#chatting-btn {
  width: 100px;
  padding: 10px;
  margin: 3px 3px;
}
.admin-btn {
  width: 100px;
  padding: 10px;
  margin: 3px 3px;
}
.fas {
  width: 15px;
  height: 15px;
  padding-right: 20px;
}
.big-font {
  font-size: 20px;
}
.heart-icon {
  display: inline;
}
.back-button {
  display: none;
}
.notice-body.mobile {
  width: 100%;
  flex-wrap: wrap;
}
.notice-detail.mobile {
  width: 100%;
  margin-bottom: 50px;
}
.notice-buttons.mobile {
  flex-direction: row;
  flex-wrap: wrap;
}
.inner.mobile {
  margin: auto;
}
.back-button.mobile {
  display: block;
  margin-bottom: 15px;
}
</style>
