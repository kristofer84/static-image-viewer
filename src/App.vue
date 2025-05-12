<template>
  <div class="app">
    <transition name="fade">
      <div v-if="geoInit" class="loading">
        <span class="footer" >{{ geoStatus }}</span>
        <div class="spinner">
          <span class="material-symbols-outlined">progress_activity</span>
        </div>
      </div>
    </transition>
    <GridView />
    <SettingsMenu />
  </div>
</template>

<script setup lang="ts">
import GridView from "./components/GridView.vue";
import SettingsMenu from "./components/SettingsMenu.vue";
import { geoInit, geoStatus } from "./utils/geo";
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
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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

</style>

<style lang="scss">
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.spinner {
  animation: rotation 2s infinite ease-in-out;
  transform-origin: center;
  &.pause {
    animation-play-state: paused;
  }

  @keyframes rotation {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(1079deg);
    }
  }
}

.fadeIn {
  animation: fadeIn 0.5s forwards ease-in-out 0.2s;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
}

.op0 {
  opacity: 0;
}
</style>
