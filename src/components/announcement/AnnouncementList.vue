<template>
  <main>
    <div
      v-for="notice in notices"
      :key="notice.id"
      class="item"
      @click="openAnnouncementDetail(notice.id)"
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
  <div ref="listEnd" data-test="list-end" aria-hidden="true" class="list-end"></div>
  <div style="padding-left: 100px ;display: block; float: none">
    <button v-if="!last && !error" :disabled="loading" @click="loadNextPage" class="w-75 btn btn-secondary btn-lg">더보기</button>
    <p v-if="error" role="alert">{{ error }} <button data-test="retry" @click="loadNextPage">재시도</button></p>
    <br>
    <b v-if="last" style="font-weight: 600; font-size: 20px; margin: 0">더 이상 채용/교육 공고 내용이 존재하지 않습니다.</b>
  </div>
</template>

<script>
import { markRaw } from "vue";
import { getAnnouncements } from "@/api/announcements";
export default {
  name: "demp-announcement",
  mounted() {
    this.emitter.on("announcementSearchCondition", this.onSearchCondition);
    if (typeof IntersectionObserver !== "undefined") {
      this.pageObserver = markRaw(new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting) && !this.error) this.loadNextPage();
      }, { rootMargin: "200px" }));
      this.pageObserver.observe(this.$refs.listEnd);
    }
    this.loadNextPage();
  },
  unmounted() {
    this.requestGeneration++;
    this.pageObserver?.disconnect();
    this.emitter.off("announcementSearchCondition", this.onSearchCondition);
  },
  data() {
    return {
      notices: [],
      announcementSearchCondition: {
        announcementType: "",
        positions: [],
        // languages: [],
        career: 0,
        payment: 0,
        title: "",
        page:0,
      },
      last:false,
      loading:false,
      error:null,
      requestGeneration:0,
      pageObserver:null,
    };
  },

  methods: {
    onSearchCondition(condition) {
      this.announcementSearchCondition = { ...condition, page: 0 };
      this.notices = [];
      this.last = false;
      this.error = null;
      this.requestGeneration++;
      this.loading = false;
      this.loadNextPage();
    },
    async loadNextPage(){
      if (this.last || this.loading) return;
      const generation = ++this.requestGeneration;
      this.loading = true;
      this.error = null;
      try {
        const result = await getAnnouncements({ ...this.announcementSearchCondition });
        if (generation !== this.requestGeneration) return;
        if (result.data.content.length) {
          const visibleIds = new Set(this.notices.map(notice => notice.id));
          this.notices.push(...result.data.content.filter(notice => {
            if (visibleIds.has(notice.id)) return false;
            visibleIds.add(notice.id);
            return true;
          }));
          this.announcementSearchCondition.page ++;
        }
        this.last = result.data.last || result.data.content.length === 0;
      }
      catch {
        if (generation === this.requestGeneration) this.error = "공고를 불러오지 못했습니다.";
      } finally {
        if (generation === this.requestGeneration) {
          this.loading = false;
          await this.$nextTick();
          if (generation === this.requestGeneration && !this.last && !this.error && this.pageObserver) {
            this.pageObserver.unobserve(this.$refs.listEnd);
            this.pageObserver.observe(this.$refs.listEnd);
          }
        }
      }
    },
    openAnnouncementDetail(id){
      if (this.$store.state.Login.token != ""){
        this.$router.push(`/detail/${id}`);
      }else {
        alert("로그인이 필요한 서비스 입니다.");
      }
    },
  },
  watch: {
    typeName: function () {
      this.loadNextPage();
    },
  },
};
</script>

<style scoped>
.list-end { clear: both; height: 1px; }
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
