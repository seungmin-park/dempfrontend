import { createApp } from "vue";
import App from "./App.vue";

// import { router } from "./router/index.js";
import axios from "axios";

const vue = createApp(App);
// vue.use(router);

vue.config.globalProperties.axios = axios;

vue.mount("#app");
