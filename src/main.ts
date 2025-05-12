import { createApp } from "vue";
import App from "./App.vue";
import "@vueuse/core";
import "./styles/variables.scss";
import "./styles/main.scss";
import { initGeo } from "./utils/geo";
initGeo();
createApp(App).mount("#app");
