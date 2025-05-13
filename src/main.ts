import { createApp } from "vue";
import VueToast from "vue-toast-notification";
import App from "./App.vue";
import "@vueuse/core";
import "./styles/variables.scss";
import "./styles/main.scss";
import "vue-toast-notification/dist/theme-bootstrap.css";
import { toastProps } from "./utils/toastProps";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/static-image-viewer/sw.js")
    .then(() => console.log("Service Worker registered"))
    .catch((err) => console.error("Service Worker registration failed:", err));
}

createApp(App).use(VueToast, toastProps()).mount("#app");
