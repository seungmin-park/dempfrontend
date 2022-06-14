<template>
  <main>
    <div
      v-for="notice in notices"
      :key="notice.id"
      class="item"
      @click="getDetailAnnounce(notice.id)"
    >
      <div class="item-image-box">
        <img
          :src="notice.image"
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
  <div style="padding-left: 100px ;display: block; float: none">
    <button v-if="!last" @click="loadDataFromServer" class="w-75 btn btn-secondary btn-lg">더보기</button>
    <br>
    <b v-if="last" style="font-weight: 600; font-size: 20px; margin: 0">더 이상 채용/교육 공고 내용이 존재하지 않습니다.</b>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "demp-announcement",
  mounted() {
    {
      this.emitter.on("announcementSearchCondition", (e) => {
        this.announcementSearchCondition = e;
        this.notices = [];
        this.announcementSearchCondition.page = 0;
        this.last = false;
        this.loadDataFromServer();
      });
      this.loadDataFromServer();
    }
  },
  data() {
    return {
      notices: [],
      announcementSearchCondition: {
        typeName: "",
        positions: [],
        // languages: [],
        career: 0,
        payment: 0,
        title: "",
        page:0,
      },
      last:false
    };
  },

  methods: {
    async loadDataFromServer(){
      try {
        if (this.last){
          return
        }
        const result = await axios
            .get("/api/announce", {
              params: {
                typeName: this.announcementSearchCondition.typeName,
                positions: this.announcementSearchCondition.positions.join(","),
                career: this.announcementSearchCondition.career,
                payment: this.announcementSearchCondition.payment,
                title: this.announcementSearchCondition.title,
                page: this.announcementSearchCondition.page,
                size: 8,
              },
            })
        if (result.data.content.length){
          this.notices.push(...result.data.content);
          this.announcementSearchCondition.page ++;
          this.last = result.data.last;
        }else {
          this.last = true;
        }
      }
      catch(err){
        console.log(err)
        this.last = true;
      }
    },
    getDetailAnnounce(id){
      if (this.$store.state.Login.token != ""){
        this.$router.push(`/detail/${id}`);
      }else {
        alert("로그인이 필요한 서비스 입니다.");
      }
    },
  },
  watch: {
    typeName: function () {
      this.loadDataFromServer();
    },
  },
};
</script>

<style scoped>
main {
  display: flex;
  width: 100%;
  float: left;
  flex-wrap: wrap;
  box-sizing: border-box;
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
  margin: 0 25px 25px 25px;
  box-sizing: border-box;
}

.big-font {
  font-size: 20px;
}

</style>
