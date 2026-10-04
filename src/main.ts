import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router/index";
import {store} from './store/index'
import mitt from "mitt";
import type { AppEvents } from "./types/events";

import './assets/styles/main.css'

const emitter = mitt<AppEvents>();
const vue = createApp(App);
vue.use(router);
vue.use(store);

vue.config.globalProperties.emitter = emitter;
vue.config.globalProperties.$store = store;

vue.mount("#app");
