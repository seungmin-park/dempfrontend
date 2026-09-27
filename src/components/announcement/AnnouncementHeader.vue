<template>
  <div>
    <div class="search-condition" @change="changeCondition">
      <div class="search-condition-selected">
        <span class="selected-condition-element element-init">
          전체 초기화
          <button class="delete-condition" @click="initCondition">
            <AppIcon name="close" :size="14" />
          </button>
        </span>
        <span
          class="selected-condition-element element-typeName"
          v-if="announcementSearchCondition.announcementType"
        >
          {{
            announcementSearchCondition.announcementType === "EMP"
              ? "채용 공고"
              : "부트캠프"
          }}
          <button
            class="delete-condition"
            @click="
              () => {
                announcementSearchCondition.announcementType = ``;
                changeCondition();
              }
            "
          >
            <AppIcon name="close" :size="14" />
          </button>
        </span>
        <span
          class="selected-condition-element element-position"
          v-for="position in announcementSearchCondition.positions"
          :key="position"
        >
          {{ position }}
          <button class="delete-condition" @click="removePosition(position)">
            <AppIcon name="close" :size="14" />
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
                announcementSearchCondition.career = 0;
                changeCondition();
              }
            "
          >
            <AppIcon name="close" :size="14" />
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
                changeCondition();
              }
            "
          >
            <AppIcon name="close" :size="14" />
          </button>
        </span>
      </div>
      <div class="search-condition-first">
        <label for="emp">
          <input
            type="radio"
            name="emp"
            id="emp"
            value="EMP"
            v-model="announcementSearchCondition.announcementType"
          />
          채용
        </label>
        <label for="edu">
          <input
            type="radio"
            name="edu"
            id="edu"
            value="EDU"
            v-model="announcementSearchCondition.announcementType"
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
                <li v-for="position in positions" :key="position">
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
                  전체
                </label>
              </div>
              <div class="dropdown-item" v-for="index in 9" :key="index">
                <label>
                  <input
                    type="radio"
                    name="career"
                    :value=index
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
            placeholder="제목 검색" aria-label="공고 제목 검색"
            v-model="announcementSearchCondition.title"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import type { AnnouncementFilters, JobPosition } from '@/types/api';
import { defineComponent } from "vue";
import AppIcon from '@/components/common/AppIcon.vue';
import positions from "../../data/positions";

export default defineComponent({
  components: { AppIcon },
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
        announcementType: "" as AnnouncementFilters["announcementType"],
        positions: [] as JobPosition[],
        // languages: [],
        career: 0,
        payment: 0,
        title: "",
      },
    };
  },
  methods: {
    changeCondition() {
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
        announcementType: "" as AnnouncementFilters["announcementType"],
        positions: [] as JobPosition[],
        // languages: [],
        career: 0,
        payment: 0,
        title: "",
      };
      this.changeCondition();
    },
    removePosition(position: JobPosition) {
      this.announcementSearchCondition.positions =
        this.announcementSearchCondition.positions.filter(
          (element) => element !== position
        );
      this.changeCondition();
    },
  },
});
</script>
