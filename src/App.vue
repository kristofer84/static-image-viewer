<template>
  <div class="app">
    <transition name="fade">
      <div v-if="init" class="loading">
        <div class="spinner">
          <span class="material-symbols-outlined">progress_activity</span>
        </div>
      </div>
    </transition>
    <GridView />
    <SettingsMenu />
    <div id="footer">
      <div id="footer-left"></div>
      <div id="footer-right"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import GridView from "./components/GridView.vue";
import SettingsMenu from "./components/SettingsMenu.vue";
import { initGeo } from "./utils/geo";
import { ReusableToast } from "./utils/reusableToast";

const init = ref(true);

onMounted(async () => {
  const toast = new ReusableToast("Loading geo data", { duration: 0 });
  await initGeo();
  init.value = false;

  toast.setMessage("Load complete");
  setTimeout(() => toast.dismiss(), 1000);
});
</script>

<style scoped lang="scss">
.app {
  // height: 100vh;
  // width: 100vw;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.loading {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  span {
    font-size: 2em;
  }
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.spinner {
  position: absolute;
  left: 50%;
  transform: translateY(-50%);
}

#footer {
  position: fixed;
  bottom: 0;
  right: 0;
  left: 0;
  // height: 2rem;
  // border-top: 1px solid black;
  display: flex;
  justify-content: space-between;
}
</style>
