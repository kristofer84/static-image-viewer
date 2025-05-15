<template>
  <div class="settings-menu">
    <button @click="visible = !visible">
      <span class="material-symbols-outlined">settings</span>
    </button>
    <div v-if="visible" class="panel">
      <label>
        Time per image (s):
        <input type="number" v-model.number="timePerImage" min="0.1" step="0.1" />
      </label>
      <label> <input type="checkbox" v-model="showOverlay" /> Show overlay </label>
      <label> <input type="checkbox" v-model="autoSave" /> Auto-save JSON </label>
      <label> <input type="checkbox" v-model="saveThumbs" /> Save thumbnails </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const visible = ref(false);
const timePerImage = ref(+localStorage.getItem("timePerImage")! || 2);
const showOverlay = ref(localStorage.getItem("showOverlay") !== "false");
const autoSave = ref(localStorage.getItem("autoSave") === "true");
const saveThumbs = ref(localStorage.getItem("saveThumbs") === "true");

watch(timePerImage, (val) => localStorage.setItem("timePerImage", String(val)));
watch(showOverlay, (val) => localStorage.setItem("showOverlay", String(val)));
watch(autoSave, (val) => localStorage.setItem("autoSave", String(val)));
watch(saveThumbs, (val) => localStorage.setItem("saveThumbs", String(val)));
</script>

<style scoped lang="scss">
.settings-menu {
  position: absolute;
  top: 1rem;
  right: 1rem;

  .panel {
    border: 1px solid #ccc;
    padding: 1rem;
    border-radius: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.5rem;
  }
}
</style>
