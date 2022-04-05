import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router/index.js";
import axios from "axios";
import Header from "./components/layout/Header.vue";
import mitt from "mitt";
import VeeValidate from "vee-validate";

const emitter = mitt();
const vue = createApp(App);
vue.component("demp-header", Header);
vue.use(router);
vue.use(VeeValidate);

vue.config.globalProperties.axios = axios;
vue.config.globalProperties.emitter = emitter;

vue.mount("#app");
