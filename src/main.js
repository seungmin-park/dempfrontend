import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router/index.js";
import {store} from './store/index.js'
import axios from "axios";
import Header from "./components/layout/Header.vue";
import mitt from "mitt";

import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"

const emitter = mitt();
const vue = createApp(App);
vue.component("demp-header", Header);
vue.use(router);
vue.use(store);

vue.config.globalProperties.axios = axios;
vue.config.globalProperties.emitter = emitter;
vue.config.globalProperties.$store = store;

vue.mount("#app");
