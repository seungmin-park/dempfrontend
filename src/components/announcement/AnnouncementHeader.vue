<template>
  <div>
    <div class="search-condition">
      <span>
        <button v-on:click="emp">채용</button>
        <button v-on:click="edu">교육</button>
      </span>
      <button @click="changePositionStatus">직무</button>
      <div class="search-condition-position" v-if="positionStatus">
        <ul>
          <li v-for="position in positions" :key="position.id">
            <label :for="position">
              <input
                type="checkbox"
                :name="positions"
                :id="position"
                :value="position"
              />{{ position }}
            </label>
          </li>
        </ul>
      </div>
    </div>
    <div>
      <router-link :to="{ path: '/addAnnounce' }">글쓰기</router-link>
    </div>
  </div>
</template>

<script>
import positions from "../../data/positon";
export default {
  data() {
    return {
      positionStatus: false,
      type: null,
      positions: positions,
    };
  },
  methods: {
    changePositionStatus() {
      if (this.positionStatus) {
        this.positionStatus = false;
      } else {
        this.positionStatus = true;
      }
    },
    emp() {
      this.type = "emp";
      this.submitType();
    },
    edu() {
      this.type = "edu";
      this.submitType();
    },
    submitType() {
      this.emitter.emit("type", this.type);
    },
  },
};
</script>

<style scoped>
.search-condition {
  padding: 25px;
}

.search-condition-position {
  width: 385px;
  height: 300px;
  border-radius: 5px;
  border: 1px solid rgba(0, 0, 0, 0.3);
}

ul {
  list-style: none;
  padding-left: 0px;
}
</style>
