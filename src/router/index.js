import { createWebHistory, createRouter } from "vue-router";

const routes = [
  {
    path: "/",
    name: "mainFrame",
    component: () => import("@/components/layout/MainFrame"),
  },
  {
    path: "/hello",
    name: "hello",
    component: () => import("@/components/HelloWorld"),
  },
  {
    path: "/detail/:itemId",
    name: "detail",
    component: () => import("@/components/layout/DetailPage"),
  },
  {
    path: "/question",
    name: "question",
    component: () => import("@/components/layout/Question"),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
