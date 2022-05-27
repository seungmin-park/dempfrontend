export const Login={
    namespaced: true,
    state:{
        username: "",
        token: "",
    },
    getters:{
        isLogin(state) {
            return state.username !== "";
        },
        getToken(state) {
            return state.token;
        },
    },
    mutations:{
        setUsername(state, username) {
            state.username = username;
        },
        setToken(state, token) {
            state.token = token;
        },
        logout(state) {
            state.username = "";
            state.token = "";
        },
    },
    actions:{},
}