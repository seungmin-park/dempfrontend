const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  transpileDependencies: true,
});

const target = "https://dempbackend.herokuapp.com/";

module.exports = {
  devServer: {
    port: 15986,
    proxy: {
      //proxy 요청을 보낼 api 시작 부분
      "^/api": {
        target,
        changeOrigin: true,
      },
    },
  },
};
