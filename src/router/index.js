import { createWebHistory, createRouter } from "vue-router";

const routes = [
  {
    path: "/",
    name: "AnnouncementList",
    component: () => import("../views/announcement/AnnouncementList"),
  },
  {
    path: "/login",
    name: "TestLoginForm",
    component: () => import("@/components/LoginForm"),
  },
  {
    path: "/account",
    name: "TestAccountForm",
    component: () => import("@/components/AccountForm"),
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
    path: "/addAnnounce",
    name: "addAnnounce",
    component: () => import("../views/announcement/AnnouncementWrite"),
  },
  {
    path: "/question",
    name: "question",
    component: () => import("../views/question/QuestionList"),
  },
  {
    path: "/questions/:questionId",
    name: "questions",
    component: () => import("../views/question/QuestionDetail"),
  },
  {
    path: "/questions/new",
    name: "addQuestion",
    component: () => import("../views/question/QuestionWrite"),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
