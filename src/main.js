import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router/index.js";
import axios from "axios";
import Header from "./components/layout/Header.vue";

const vue = createApp(App);
vue.component("demp-header", Header);
vue.use(router);

vue.config.globalProperties.axios = axios;

vue.mount("#app");
