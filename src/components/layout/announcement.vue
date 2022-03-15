<template>
  <div
    class="announcement-tile"
    v-for="(item, index) in BoardData"
    :key="index"
  >
    <a :href="`/detail/${item.id}`">
      <div class="announcement-tile-logo-box">
        <img
          class="announcement-logo"
          :src="require(`@/assets/${item.image}`)"
        />
      </div>
      <p class="info title">{{ item.title }}</p>
      <p class="info skill">{{ item.skill }}</p>
      <p class="info career">{{ item.career }}</p>
    </a>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "demp-announcement",
  props: ["typeName"],
  mounted() {
    {
      this.getAnnounce();
    }
  },
  data() {
    return {
      BoardData: {},
    };
  },
  methods: {
    getAnnounce() {
      axios
        .post("/announce", JSON.stringify({ typeName: "emp" }), {
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then((res) => {
          this.BoardData = res.data;
        });
    },
    detailPage(itemId) {
      this.$router.push({
        name: "detail",
        query: { itemId: itemId },
        params: { itemId: itemId },
      });
    },
  },
  watch: {
    typeName: function () {
      axios
        .post("/announce", JSON.stringify({ typeName: this.typeName }), {
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then((res) => {
          this.BoardData = res.data;
        });
    },
  },
};
</script>

<style>
.announcement-tile {
  float: left;
  margin: 15px 15px 15px 10px;
  width: 250px;
  height: 245px;
}

.announcement-tile-logo-box {
  height: 175px;
  overflow: hidden;
}

.announcement-img {
  object-fit: contain;
  width: 100%;
  height: 100%;
}
.info {
  margin: 0;
  border: 2px solid red;
}
</style>
