<template>
  <link
    rel="stylesheet"
    href="https://use.fontawesome.com/releases/v6.0.0/css/all.css"
  />
  <div>
    <div class="search-condition" @change="changeCondition">
      <div class="search-condition-selected">
        <span class="selected-condition-element element-init">
          전체 초기화
          <button class="delete-condition" @click="initCondition">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </span>
        <span
          class="selected-condition-element element-typeName"
          v-if="announcementSearchCondition.typeName"
        >
          {{
            announcementSearchCondition.typeName == "emp"
              ? "채용 공고"
              : "부트캠프"
          }}
          <button
            class="delete-condition"
            @click="
              () => {
                announcementSearchCondition.typeName = ``;
                this.changeCondition();
              }
            "
          >
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </span>
        <span
          class="selected-condition-element element-position"
          v-for="position in announcementSearchCondition.positions"
          :key="position.id"
        >
          {{ position }}
          <button class="delete-condition" @click="removePosition(position)">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </span>
        <span
          class="selected-condition-element element-career"
          v-if="announcementSearchCondition.career"
        >
          {{ announcementSearchCondition.career }}년 경력
          <button
            class="delete-condition"
            @click="
              () => {
                announcementSearchCondition.career = ``;
                this.changeCondition();
              }
            "
          >
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </span>
        <span
          class="selected-condition-element element-payment"
          v-if="announcementSearchCondition.payment != 0"
        >
          {{ announcementSearchCondition.payment.toLocaleString("ko-KR") }} 이상
          <button
            class="delete-condition"
            @click="
              () => {
                announcementSearchCondition.payment = 0;
                this.changeCondition();
              }
            "
          >
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </span>
      </div>
      <div class="search-condition-first">
        <label for="emp">
          <input
            type="radio"
            name="emp"
            id="emp"
            value="emp"
            v-model="announcementSearchCondition.typeName"
          />
          채용
        </label>
        <label for="edu">
          <input
            type="radio"
            name="edu"
            id="edu"
            value="edu"
            v-model="announcementSearchCondition.typeName"
          />
          교육
        </label>
      </div>
      <div class="search-condition-second">
        <div>
          <button
            class="condition-btn position-btn"
            @click="changePositionStatus"
          >
            <span class="condition-name">직무</span>
            <span class="condition-arrow"
              ><i class="fa-solid fa-angle-down"></i
            ></span>
          </button>
          <div class="dropdown-menu" v-if="positionStatus">
            <div class="dropdown-item-wraper">
              <ul>
                <li v-for="position in positions" :key="position.id">
                  <label :for="position" class="dropdown-item">
                    <input
                      v-model="announcementSearchCondition.positions"
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
        </div>
        <div class="search-condition-career">
          <button class="condition-btn career-btn" @click="changeCareerStatus">
            <span class="condition-name">경력</span>
            <span class="condition-arrow"
              ><i class="fa-solid fa-angle-down"></i
            ></span>
          </button>
          <div class="dropdown-menu" v-if="careerStatus">
            <div class="dropdown-item-wraper">
              <div class="dropdown-item">
                <label>
                  <input
                    type="radio"
                    name="career"
                    :value="0"
                    v-model="announcementSearchCondition.career"
                  />
                  신입
                </label>
              </div>
              <div class="dropdown-item" v-for="index in 9" :key="index">
                <label>
                  <input
                    type="radio"
                    name="career"
                    :value="index"
                    v-model="announcementSearchCondition.career"
                  />
                  {{ index }}년 경력
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
            <span class="condition-info-name">연봉</span>
            <span class="condition-info-arrow"
              ><i class="fa-solid fa-angle-down"></i
            ></span>
          </button>
          <div class="dropdown-menu" v-if="paymentStatus">
            <div class="dropdown-item-wraper">
              <div class="dropdown-item">
                <label class="min_salary_label">
                  <input
                    type="radio"
                    name="payment"
                    :value="0"
                    v-model="announcementSearchCondition.payment"
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
                    v-model="announcementSearchCondition.payment"
                  />
                  {{ payment.toLocaleString("ko-KR") }} 이상
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="search-condition-title">
          <input
            type="text"
            placeholder="제목 검색"
            v-model="announcementSearchCondition.title"
          />
        </div>
      </div>
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
      announcementSearchCondition: {
        typeName: "",
        positions: [],
        // languages: [],
        career: "",
        payment: 0,
        title: "",
      },
    };
  },
  methods: {
    changeCondition() {
      console.log(this.announcementSearchCondition);
      this.emitter.emit(
        "announcementSearchCondition",
        this.announcementSearchCondition
      );
      this.positionStatus = false;
      this.careerStatus = false;
      this.paymentStatus = false;
    },
    changePositionStatus() {
      if (this.positionStatus) {
        this.positionStatus = false;
      } else {
        this.positionStatus = true;
        this.careerStatus = false;
        this.paymentStatus = false;
      }
    },
    changeCareerStatus() {
      if (this.careerStatus) {
        this.careerStatus = false;
      } else {
        this.positionStatus = false;
        this.careerStatus = true;
        this.paymentStatus = false;
      }
    },
    changePaymentStatus() {
      if (this.paymentStatus) {
        this.paymentStatus = false;
      } else {
        this.positionStatus = false;
        this.careerStatus = false;
        this.paymentStatus = true;
      }
    },
    initCondition() {
      this.announcementSearchCondition = {
        typeName: "",
        positions: [],
        // languages: [],
        career: "",
        payment: 0,
        title: "",
      };
      this.changeCondition();
    },
    removePosition(position) {
      console.log(position);
      this.announcementSearchCondition.positions =
        this.announcementSearchCondition.positions.filter(
          (element) => element !== position
        );
      this.changeCondition();
    },
  },
};
</script>

<style scoped>
.search-condition {
  padding: 25px;
  margin-right: 10px;
}

.search-condition-second {
  display: flex;
}

.condition-btn {
  display: flex;
  box-sizing: border-box;
  align-items: center;
  justify-content: space-between;
  width: 350px;
  height: 40px;
  font-size: 15px;
  font-weight: 600;
  background-color: white;
  border-radius: 5px;
  border: 1px solid rgba(0, 0, 0, 0.5);
}

ul {
  width: auto;
  list-style: none;
  padding-left: 0px;
  margin: 0;
}

li {
  display: block;
}

.search-condition-career {
  margin: 0px 5px 0px 5px;
}

.search-condition-title {
  display: flex;
  align-items: flex-end;
}

.search-condition-title input {
  border: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.5);
  height: 20px;
}

.dropdown-menu {
  position: absolute;
  z-index: 1000;
  box-sizing: border-box;
  background-color: white;
  border-radius: 0.25rem;
  box-shadow: 0 0.25rem 0.5rem rgb(20 20 84 / 4%),
    0 0.5rem 1.125rem rgb(20 20 84 / 8%),
    0 1rem 2rem -0.125rem rgb(20 20 84 / 8%),
    0 0 0 0.0625rem rgb(20 20 84 / 12%);
  color: #354e66;
  display: flex;
  justify-content: center;
  padding: 10px 12px 10px 12px;
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

.career-btn,
.payment-btn {
  width: 200px;
}

.search-condition-selected {
  display: flex;
  align-items: center;
  height: 45px;
  margin-top: 10px;
}

.selected-condition-element {
  border: none;
  padding: 10px 5px 10px 5px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  margin-right: 15px;
}

.element-typeName,
.element-typeName i {
  background-color: #ffd3ae;
  color: #ff6a00;
}

.element-position,
.element-position i {
  background-color: #e0d0f0;
  color: #a585d4;
}
.element-career,
.element-career i {
  background-color: #faebd6;
  color: #efb870;
}
.element-payment,
.element-payment i {
  background-color: #e0f2f1;
  color: #00a2b4;
}

.delete-condition,
.element-condition i {
  background-color: inherit;
  border: none;
  padding: 0;
}
.element-init,
.element-init i {
  background-color: #cfc6ca;
}
</style>
