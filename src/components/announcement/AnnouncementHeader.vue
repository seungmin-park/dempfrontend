<template>
  <div>
    <div class="search-condition" @change="changeCondition">
      <div class="search-condition-first">
        <label for="emp">
          채용
          <input
            type="radio"
            name="emp"
            id="emp"
            value="emp"
            v-model="announceSearchCondition.typeName"
          />
        </label>
        <label for="edu">
          교육
          <input
            type="radio"
            name="edu"
            id="edu"
            value="edu"
            v-model="announceSearchCondition.typeName"
          />
        </label>
      </div>
      <div class="search-condition-second">
        <div>
          <button
            class="condition-btn position-btn"
            @click="changePositionStatus"
          >
            직무
          </button>
          <div class="search-condition-position" v-if="positionStatus">
            <ul>
              <li v-for="position in positions" :key="position.id">
                <label :for="position">
                  <input
                    v-model="announceSearchCondition.positions"
                    type="checkbox"
                    name="positions"
                    :id="position"
                    :value="position"
                  />{{ position }}
                </label>
              </li>
            </ul>
          </div>
        </div>
        <div class="search-condition-career">
          <button class="condition-btn career-btn" @click="changeCareerStatus">
            경력
          </button>
          <div class="dropdown-menu" v-if="careerStatus">
            <div class="dropdown-item-wraper">
              <div class="dropdown-item">
                <label>
                  전체
                  <input
                    type="radio"
                    name="career"
                    :value="null"
                    v-model="announceSearchCondition.career"
                  />
                </label>
              </div>
              <div class="dropdown-item">
                <label>
                  신입
                  <input
                    type="radio"
                    name="career"
                    :value="0"
                    v-model="announceSearchCondition.career"
                  />
                </label>
              </div>
              <div class="dropdown-item" v-for="index in 9" :key="index">
                <label>
                  {{ index }}년 경력
                  <input
                    type="radio"
                    name="career"
                    :value="index"
                    v-model="announceSearchCondition.career"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="search-condition-payment">
          <button
            class="condition-btn payment-btn"
            @click="changePaymentStatus"
          >
            연봉
          </button>
          <div class="dropdown-menu" v-if="paymentStatus">
            <div class="dropdown-item-wraper">
              <div class="dropdown-item">
                <label class="min_salary_label">
                  <input
                    type="radio"
                    name="payment"
                    :value="null"
                    v-model="announceSearchCondition.payment"
                  />
                  전체
                </label>
              </div>
              <div
                class="dropdown-item"
                v-for="payment in payments"
                :key="payment"
              >
                <label class="min_salary_label">
                  <input
                    type="radio"
                    name="payment"
                    :value="payment"
                    v-model="announceSearchCondition.payment"
                  />
                  {{ payment.toLocaleString("ko-KR") }} 이상
                </label>
              </div>
            </div>
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
      careerStatus: false,
      paymentStatus: false,
      type: null,
      positions: positions,
      payments: [
        3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000,
      ],
      announceSearchCondition: {
        typeName: String,
        positions: [],
        // languages: [],
        career: String,
        payment: Number,
        title: String,
      },
    };
  },
  methods: {
    changeCondition() {
      console.log(this.announceSearchCondition);
      this.emitter.emit(
        "announceSearchCondition",
        this.announceSearchCondition
      );
    },
    changePositionStatus() {
      if (this.positionStatus) {
        this.positionStatus = false;
      } else {
        this.positionStatus = true;
      }
    },
    changeCareerStatus() {
      if (this.careerStatus) {
        this.careerStatus = false;
      } else {
        this.careerStatus = true;
      }
    },
    changePaymentStatus() {
      if (this.paymentStatus) {
        this.paymentStatus = false;
      } else {
        this.paymentStatus = true;
      }
    },
  },
};
</script>

<style scoped>
.search-condition {
  padding: 25px;
}

.search-condition-second {
  display: flex;
}

.condition-btn {
  width: 385px;
  height: 40px;
}

.search-condition-position {
  box-sizing: border-box;
  display: absolute;
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

.dropdown-menu {
  width: 290px;
  box-sizing: border-box;
  background-color: white;
  border-radius: 0.25rem;
  box-shadow: 0 0.25rem 0.5rem rgb(20 20 84 / 4%),
    0 0.5rem 1.125rem rgb(20 20 84 / 8%),
    0 1rem 2rem -0.125rem rgb(20 20 84 / 8%),
    0 0 0 0.0625rem rgb(20 20 84 / 12%);
  color: #354e66;
  padding: 5px 0px 5px 20px;
}

.dropdown-item-wraper {
  width: auto;
  column-count: 2;
}

.dropdown-item {
  white-space: nowrap;
  width: 95px;
  font-weight: 500;
  color: #212529;
  padding: 2px;
  font-size: 14px;
}
</style>
