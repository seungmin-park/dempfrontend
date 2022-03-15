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
    path: "/emp",
    name: "emp",
    component: () => import("@/components/layout/EmpBoard"),
  },
  {
    path: "/boot-camp",
    name: "bootCamp",
    component: () => import("@/components/layout/BCBoard"),
  },
  {
    path: "/detail/:itemId",
    name: "detail",
    component: () => import("@/components/layout/DetailPage"),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
