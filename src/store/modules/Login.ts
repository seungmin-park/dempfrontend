import type { Module } from 'vuex';
import type { LoginState, RootState } from '../types';

export const Login: Module<LoginState, RootState> = {
  namespaced: true,
  state: () => ({ username: '', token: '' }),
  getters: {
    isLogin: state => state.username !== '' && state.token !== '',
    getToken: state => state.token,
  },
  mutations: {
    setUsername(state, username: string) { state.username = username; },
    setToken(state, token: string) { state.token = token; },
    logout(state) { state.username = ''; state.token = ''; },
  },
};
