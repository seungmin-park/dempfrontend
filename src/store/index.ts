import { createStore } from 'vuex';
import { Login } from './modules/Login';
import { persistAuthentication } from './authPersistence';
import type { RootState } from './types';

export const store = createStore<RootState>({
  modules: { Login },
  plugins: [persistAuthentication],
});
