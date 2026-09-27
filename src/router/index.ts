import { createWebHistory, createRouter } from "vue-router";
import { store } from '@/store';

import type { RootState } from '@/store/types';
import type { NavigationGuard } from 'vue-router';

export function createAuthGuard(authStore: { state: RootState }): NavigationGuard {
  return to => {
    if (!to.meta.requiresAuth) return true;
    const { token, username } = authStore.state.Login;
    return token && username ? true : { path: '/login', query: { redirect: to.fullPath } };
  };
}

const routes = [
  { path: "/admin", meta: { requiresAuth: true }, component: () => import("@/views/admin/AdminLayout.vue"), children: [
    { path: '', component: () => import('@/views/admin/AdminDashboard.vue') },
    { path: 'announcements', component: () => import('@/views/admin/AdminAnnouncements.vue') },
    { path: 'announcements/new', component: () => import('@/views/admin/AdminAnnouncementEditor.vue') },
    { path: 'announcements/:id', component: () => import('@/views/admin/AdminAnnouncementEditor.vue') },
    { path: 'questions', component: () => import('@/views/admin/AdminPosts.vue'), props: { kind: 'questions' } },
    { path: 'answers', component: () => import('@/views/admin/AdminPosts.vue'), props: { kind: 'answers' } },
    { path: 'questions/:id', component: () => import('@/views/admin/AdminPostEditor.vue'), props: { kind: 'questions' } },
    { path: 'answers/:id', component: () => import('@/views/admin/AdminPostEditor.vue'), props: { kind: 'answers' } },
  ] },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFound.vue') },
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
    redirect: "/admin/announcements/new",
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
