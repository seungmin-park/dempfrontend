import {createStore} from 'vuex'
import {Login} from "@/store/modules/Login";
import createPersistedState from "vuex-persistedstate";

export const store = createStore({
  modules:{Login},
  plugins: [createPersistedState()]
});
