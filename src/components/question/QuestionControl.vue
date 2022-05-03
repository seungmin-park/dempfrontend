<template>
  <div class="question-control">
    <button class="question-control-hastag" @click="visibleHashtags">
      해시태그
    </button>
    <button
      class="question-control-btn"
      @click="$router.push(`/questions/new`)"
    >
      질문하기
    </button>
    <div v-if="visible" @change="print">
      <div v-for="hashtag in hashtags" :key="hashtag.id">
        <label :for="hashtag" class="dropdown-item">
          <input
            v-model="searchTags"
            type="checkbox"
            name="hashtags"
            :id="hashtag"
            :value="hashtag"
          />{{ hashtag }}
        </label>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
export default {
  data() {
    return {
      visible: false,
      searchTags: [],
      hashtags: [],
    };
  },
  methods: {
    visibleHashtags() {
      axios.get("/api/question/hashtags").then((res) => {
        this.hashtags = res.data;
        this.visible = true;
      });
    },
    print() {
      console.log(this.searchTags);
    },
  },
};
</script>

<style>
.question-control {
  align-items: center;
}

.question-control button {
  display: block;
  color: white;
  background-color: #a9cbdd;
  width: 100px;
  height: 41px;
  border: none;
  border-radius: 5px;
  margin: 10px 10px 10px 10px;
  font-size: 15px;
  font-weight: 600;
}
</style>
