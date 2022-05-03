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
    path: "/addAnnounce",
    name: "addAnnounce",
    component: () => import("../views/announcement/AnnouncementWrite"),
  },
  {
    path: "/question",
    name: "question",
    component: () => import("../views/qusetion/QuestionList"),
    // props: (route) => ({
    //   orderBy: route.query.orderBy,
    // }),
  },
  {
    path: "/questions/:questionId",
    name: "questions",
    component: () => import("../views/qusetion/QuestionDetail"),
  },
  {
    path: "/questions/new",
    name: "addQuestion",
    component: () => import("../views/qusetion/QuestionWrite"),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
