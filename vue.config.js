const { defineConfig } = require("@vue/cli-service");

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 5050,
    proxy: {
      "/api": {
        target: process.env.DEV_API_TARGET || "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
