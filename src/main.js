import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router/index.js";
import axios from "axios";
import Header from "./components/layout/Header.vue";

import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faHatWizard,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faHatWizard, faMagnifyingGlass);

const vue = createApp(App);
vue.component("demp-header", Header);
vue.component("font-awesome-icon", FontAwesomeIcon);
vue.use(router);

vue.config.globalProperties.axios = axios;

vue.mount("#app");
