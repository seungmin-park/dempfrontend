import { createWebHistory, createRouter } from "vue-router";
import { store } from '@/store';

export function createAuthGuard(authStore) {
  return to => {
    if (!to.meta.requiresAuth) return true;
    const { token, username } = authStore.state.Login;
    return token && username ? true : { path: '/login', query: { redirect: to.fullPath } };
  };
}

const routes = [
  {
    path: "/",
    name: "AnnouncementList",
    component: () => import("../views/announcement/AnnouncementList"),
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/components/LoginForm"),
  },
  {
    path: "/account",
    name: "Register",
    component: () => import("@/components/AccountForm"),
  },
  {
    path: "/detail/:itemId",
    name: "detail",
    meta: { requiresAuth: true },
    component: () => import("../views/announcement/AnnouncementDetail"),
  },
  {
    path: "/addAnnounce",
    name: "addAnnounce",
    meta: { requiresAuth: true },
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
    meta: { requiresAuth: true },
    component: () => import("../views/question/QuestionDetail"),
  },
  {
    path: "/questions/new",
    name: "addQuestion",
    meta: { requiresAuth: true },
    component: () => import("../views/question/QuestionWrite"),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
router.beforeEach(createAuthGuard(store));
