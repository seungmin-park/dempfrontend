<template>
  <div class="questions">
    <div class="center">
      <questionWrite />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import QuestionWrite from "../../components/question/QuestionWrite.vue";

export default defineComponent({
  components: {
    QuestionWrite,
  },
});
</script>

<style></style>
