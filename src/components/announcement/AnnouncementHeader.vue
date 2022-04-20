<template>
  <div>
    <div class="search-condition">
      <span>
        <button v-on:click="emp">채용</button>
        <button v-on:click="edu">교육</button>
      </span>
      <div>
        <button
          class="search-condition-position-btn"
          @click="changePositionStatus"
        >
          직무
        </button>
        <div class="search-condition-position" v-if="positionStatus">
          <ul>
            <li>
              <label for="all">
                <input type="checkbox" id="all" value />전체
              </label>
            </li>
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
      <div class="career">
        <span @click="changePositionStatus">경력</span>
        <ul class="search-condition-career" v-if="positionStatus">
          <li>
            <label>
              전체
              <input type="checkbox" value />
            </label>
          </li>
          <li>
            <label>
              신입
              <input type="checkbox" value="신입" />
            </label>
          </li>
          <li>
            <label>
              1년 경력
              <input type="checkbox" value="1" />
            </label>
          </li>
          <li v-for="index in 9" :key="index">
            <label>
              {{ index }}년 경력
              <input type="checkbox" :value="index" />
            </label>
          </li>
        </ul>
      </div>
      <div class="search-condition-payment">
        <div class="dropdown-item-wraper">
          <div class="dropdown-item">
            <label class="min_salary_label">
              <input type="radio" value />
              전체
            </label>
          </div>
          <div class="dropdown-item">
            <label class="min_salary_label">
              <input type="radio" value="3000" />
              3,000 이상
            </label>
          </div>
          <div class="dropdown-item">
            <label class="min_salary_label">
              <input type="radio" value="3500" />
              3,500 이상
            </label>
          </div>
          <div class="dropdown-item">
            <label class="min_salary_label">
              <input type="radio" value="4000" />
              4,000 이상
            </label>
          </div>
          <div class="dropdown-item">
            <label class="min_salary_label">
              <input type="radio" value="4500" />
              4,500 이상
            </label>
          </div>
          <div class="dropdown-item">
            <label class="min_salary_label">
              <input type="radio" value="5000" />
              5,000 이상
            </label>
          </div>
          <div class="dropdown-item">
            <label class="min_salary_label">
              <input type="radio" value="5500" />
              5,500 이상
            </label>
          </div>
          <div class="dropdown-item">
            <label class="min_salary_label">
              <input type="radio" value="6000" />
              6,000 이상
            </label>
          </div>
          <div class="dropdown-item">
            <label class="min_salary_label">
              <input type="radio" value="6500" />
              6,500 이상
            </label>
          </div>
          <div class="dropdown-item">
            <label class="min_salary_label">
              <input type="radio" value="7000" />
              7,000 이상
            </label>
          </div>
          <div class="dropdown-item">
            <label class="min_salary_label">
              <input type="radio" value="7500" />
              7,500 이상
            </label>
          </div>
          <div class="dropdown-item">
            <label class="min_salary_label">
              <input type="radio" value="8000" />
              8,000 이상
            </label>
          </div>
        </div>
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
  display: flex;
  padding: 25px;
}

.search-condition-position-btn {
  width: 385px;
  height: 40px;
}

.search-condition-position {
  z-index: 1000;
  column-count: 2;
  width: 385px;
  height: 300px;
  border-radius: 5px;
  border: 1px solid rgba(0, 0, 0, 0.3);
}

ul {
  width: auto;
  list-style: none;
  padding-left: 0px;
}

li {
  display: block;
}

.search-condition-payment {
  width: 290px;
  height: 175px;
  font-size: 16px;
  letter-spacing: -0.009em;
  line-height: 1.6;
  z-index: 1000;
  min-width: 7.5rem;
  border: 0;
  background-color: white;
  border-radius: 0.25rem;
  box-shadow: 0 0.25rem 0.5rem rgb(20 20 84 / 4%),
    0 0.5rem 1.125rem rgb(20 20 84 / 8%),
    0 1rem 2rem -0.125rem rgb(20 20 84 / 8%),
    0 0 0 0.0625rem rgb(20 20 84 / 12%);
  color: #263747;
}

.dropdown-item-wraper {
  column-count: 2;
  font-size: 14px;
  line-height: 1.5;
  display: block;
  margin-bottom: 0;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 500;
  white-space: nowrap;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 0.25rem;
  clear: both;
  font-weight: 400;
  color: #212529;
  text-align: inherit;
  white-space: nowrap;
  background-color: transparent;
  border: 0;
}
</style>
