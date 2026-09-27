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
    component: () => import("../views/announcement/AnnouncementList.vue"),
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/components/LoginForm.vue"),
  },
  {
    path: "/account",
    name: "Register",
    component: () => import("@/components/AccountForm.vue"),
  },
  {
    path: "/detail/:itemId",
    name: "detail",
    meta: { requiresAuth: true },
    component: () => import("../views/announcement/AnnouncementDetail.vue"),
  },
  {
    path: "/addAnnounce",
    name: "addAnnounce",
    meta: { requiresAuth: true },
    component: () => import("../views/announcement/AnnouncementWrite.vue"),
  },
  {
    path: "/question",
    name: "question",
    component: () => import("../views/question/QuestionList.vue"),
  },
  {
    path: "/questions/:questionId",
    name: "questions",
    meta: { requiresAuth: true },
    component: () => import("../views/question/QuestionDetail.vue"),
  },
  {
    path: "/questions/new",
    name: "addQuestion",
    meta: { requiresAuth: true },
    component: () => import("../views/question/QuestionWrite.vue"),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
router.beforeEach(createAuthGuard(store));
