<template>
  <div class="anncoucement-scroll">
    <div class="anncoucement-scroll-header">
      <span @click="$router.push('/')" class="anncoucement-scroll-history">
        &lt;-
      </span>
      <span>전체 공고</span>
    </div>

    <div
      @click="
        this.$router.push({
          name: 'detail',
          params: { itemId: item.id },
        })
      "
      class="anncoucement-scroll-items"
      v-for="item in announcement"
      :key="item.id"
    >
      <div class="anncoucement-scroll-items-img">
        <img :src="require(`@/assets/${item.image}`)" alt="" />
      </div>
      <div class="anncoucement-scroll-items-description">
        <p class="item-title">{{ item.company.name }}</p>
        <p class="item-company">{{ item.title }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "announcement-scroll",
  mounted() {
    {
      this.getScroll();
    }
  },
  data() {
    return {
      announcement: {},
    };
  },
  methods: {
    getScroll() {
      axios.get("/api/announce/scroll",{
        headers: {
          "X-AUTH-TOKEN": this.$store.state.Login.token,
        },
      }).then((res) => {
        this.announcement = res.data;
      });
    },
  },
};
</script>

<style>
.anncoucement-scroll {
  position: relative;
  width: 400px;
  height: 560px;
  border: 1px solid rgba(0, 0, 0, 0.3);
  border-radius: 15px;
  box-sizing: border-box;
  overflow: auto;
  overflow-x: hidden;
}

.anncoucement-scroll::-webkit-scrollbar {
  width: 10px;
}
.anncoucement-scroll::-webkit-scrollbar-thumb {
  background-color: #b3dce0;
  border-radius: 10px;
  background-clip: padding-box;
  border: 2px solid transparent;
}
.anncoucement-scroll::-webkit-scrollbar-track {
  background-color: grey;
  border-radius: 10px;
  box-shadow: inset 0px 0px 5px white;
}

.anncoucement-scroll-history {
  position: absolute;
  left: 30px;
}

.anncoucement-scroll-header {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 15px 15px 0px 0px;
  background: #b3dce0;
  height: 70px;
  font-weight: 600;
  font-size: 20px;
}

.anncoucement-scroll-items {
  display: flex;
  align-items: center;
  justify-content: left;
  width: 100%;
  height: 70px;
  padding: 15px 0px 15px 30px;
  border-bottom: 1px solid gray;
  box-sizing: border-box;
}

.anncoucement-scroll-items-img {
  border-radius: 50%;
  padding: 0%;
  width: 60px;
  height: 60px;
  overflow: hidden;
  margin: 0;
}

.anncoucement-scroll-items-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.anncoucement-scroll-items-description {
  padding-left: 15px;
}

p {
  margin: 0;
}

.item-title {
  font-weight: 600;
}

.item-company {
  opacity: 0.5;
}
</style>
