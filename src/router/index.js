import { createWebHistory, createRouter } from "vue-router";

const routes = [
  {
    path: "/",
    name: "AnnouncementList",
    component: () => import("../views/announcement/AnnouncementList"),
  },
  {
    path: "/hello",
    name: "hello",
    component: () => import("@/components/HelloWorld"),
  },
  {
    path: "/detail/:itemId",
    name: "detail",
    component: () => import("../views/announcement/AnnouncementDetail"),
  },
  {
    path: "/question",
    name: "question",
    component: () => import("../views/qusetion/QuestionList"),
  },
  {
    path: "/questions/:questionId",
    name: "questions",
    component: () => import("../views/qusetion/QuestionDetail"),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
