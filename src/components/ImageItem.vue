<template>
  <div class="image-item" @click="$emit('click')">
    <img class="op0" ref="img" :src="image.url" :alt="image.name" :onload="() => print()" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const img = ref<HTMLImageElement | null>(null);
const props = defineProps<{ image: { name: string; url: string } }>();
const emit = defineEmits<{ (e: "loaded", data: { name:string, orientation: "vertical" | "horizontal" }): void; (e: "click"): void }>();

function print() {
  img.value!.classList.remove("op0");
  emit("loaded", { name: props.image.name, orientation: img.value!.width > img.value!.height ? "horizontal" : "vertical" });
}
</script>

<style scoped lang="scss">
.image-item {
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    transition: opacity 0.4s ease;
    border: 2px solid #ccc;
    border-radius: 8px;
    width: 100%;
    height: auto;
    &:hover {
      border-color: #444;
      cursor: pointer;
    }
  }
}
</style>
