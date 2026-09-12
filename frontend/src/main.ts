import { createApp } from "vue";
import { createPinia } from "pinia";
import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
} from "vue-router";
import App from "./App.vue";
import Workspace from "./pages/Workspace.vue";
import { i18n } from "./locales";
import "./style.css";
const router = createRouter({
  history:
    import.meta.env.VITE_DEMO === "true" || import.meta.env.VITE_ROUTER_MODE === "hash"
      ? createWebHashHistory(import.meta.env.BASE_URL)
      : createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", redirect: "/live" },
    ...[
      "/live",
      "/chat",
      "/rankings",
      "/voice",
      "/alerts",
      "/rules",
      "/settings",
      "/history",
      "/statistics",
    ].map((path) => ({ path, component: Workspace })),
  ],
  scrollBehavior: () => ({ top: 0 }),
});
createApp(App).use(createPinia()).use(router).use(i18n).mount("#app");
