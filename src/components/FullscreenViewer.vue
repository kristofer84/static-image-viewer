<template>
  <div class="fullscreen-background" :class="{ mouseHidden: !showControls }" @mousemove="handleMouseMove" v-if="visible">
    <div class="viewer fadeIn op0">
      <transition name="fade">
        <div class="media-wrapper" :key="currentImage.url">
          <video v-if="isVideo(currentImage.url)" :src="currentImage.url" autoplay loop muted controls class="media"></video>
          <img v-else :src="currentImage.url" :alt="currentImage.name" class="media" />
          <div v-if="showOverlay" class="overlay">
            <div class="timestamp dseg">
              <span v-for="part of formatTimestamp(currentImage.metadata?.timestamp)">{{ part }}</span>
            </div>
            <div v-if="currentImage.metadata?.gps" class="location">{{ getLocation(currentImage.metadata.gps) }}</div>
          </div>
        </div>
      </transition>

      <button v-show="showControls" class="control-btn" @click="togglePlayPause">
        <span class="material-symbols-outlined">{{ isPlaying ? "pause" : "play_arrow" }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { nearest } from "../utils/geo";

const props = defineProps<{ images: { name: string; url: string; metadata?: any }[]; startIndex: number }>();
const emit = defineEmits(["exit"]);

const index = ref(props.startIndex);
const isPlaying = ref(true);
const showControls = ref(false);
const visible = ref(true);
const showOverlay = ref(localStorage.getItem("showOverlay") !== "false");

const currentImage = computed(() => props.images[index.value]);
const timePerImage = +(localStorage.getItem("timePerImage") || 2) * 1000;
let timer: ReturnType<typeof setInterval>;

function nextImage() {
  index.value = (index.value + 1) % props.images.length;
}

function togglePlayPause() {
  handleMouseMove();
  isPlaying.value = !isPlaying.value;
  if (isPlaying.value) startTimer();
  else stopTimer();
}

function handleMouseMove() {
  showControls.value = true;
  clearTimeout(mouseTimer);
  mouseTimer = setTimeout(() => (showControls.value = false), 2500);
}

function startTimer() {
  stopTimer();
  timer = setInterval(nextImage, timePerImage);
}

function stopTimer() {
  if (timer) clearInterval(timer);
}

function handleKeydown(e: KeyboardEvent) {
  // console.log(e.key);
  if (e.key === "ArrowRight") {
    nextImage();
    startTimer();
  } else if (e.key === "ArrowLeft") {
    index.value = (index.value - 1 + props.images.length) % props.images.length;
    startTimer();
  } else if (e.key === " ") togglePlayPause();
  else if (e.key === "Escape") emit("exit");
}

function handleFullscreenchange(e: Event) {
  if (!document.fullscreenElement) {
    emit("exit");
  }
}

function isVideo(url: string) {
  return url.match(/\.(mp4|webm|ogg)$/i);
}

function getLocation(data: { lat: number; lon: number }) {
  const d = nearest(data.lat, data.lon);
  return d.location + ", " + (d.country ?? "SE");
}

function formatTimestamp(timestamp: string | Date | undefined): string[] {
  if (!timestamp) return [];
  const date = new Date(timestamp);
  const yy = date.getFullYear().toString().slice(2);
  const mm = (date.getMonth() + 1).toString();
  const dd = date.getDate().toString();
  return ["'", yy, mm, dd];
}

let mouseTimer: ReturnType<typeof setTimeout>;

let touchstartX = 0;
let touchstartY = 0;
let touchendX = 0;
let touchendY = 0;

onMounted(() => {
  const fb = document.getElementsByClassName("fullscreen-background")[0];
  fb.requestFullscreen?.();
  document.addEventListener("keydown", handleKeydown);
  document.addEventListener("touchstart", touchStart, false);
  document.addEventListener("touchend", touchEnd, false);
  document.addEventListener("fullscreenchange", handleFullscreenchange);
  if (isPlaying.value) startTimer();
});

function touchStart(event: TouchEvent) {
  touchstartX = event.changedTouches[0].screenX;
  touchstartY = event.changedTouches[0].screenY;
}

function touchEnd(event: TouchEvent) {
  touchendX = event.changedTouches[0].screenX;
  touchendY = event.changedTouches[0].screenY;
  handleGesture();
}

function handleGesture() {
  if (touchendX < touchstartX) {
    nextImage();
    startTimer();
  }

  if (touchendX > touchstartX) {
    index.value = (index.value - 1 + props.images.length) % props.images.length;
    startTimer();
  }

  // if (touchendY < touchstartY) {
  //   console.log("Swiped Up");
  // }

  // if (touchendY > touchstartY) {
  //   console.log("Swiped Down");
  // }

  if (touchendY === touchstartY) {
    togglePlayPause();
  }
}

onBeforeUnmount(() => {
  stopTimer();
  document.removeEventListener("keydown", handleKeydown);
  document.removeEventListener("fullscreenchange", handleFullscreenchange);
  document.removeEventListener("touchstart", touchStart, false);
  document.removeEventListener("touchend", touchEnd, false);
  // document.exitFullscreen?.();
});
</script>

<style scoped lang="scss">
@use "../styles/variables" as *;

.mouseHidden {
  cursor: none;
}

.fullscreen-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: black;

  .viewer {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    transition: opacity 5s ease;
  }

  .media-wrapper {
    position: absolute;
  }

  .media {
    max-width: 100vw;
    max-height: 100vh;
    object-fit: contain;
  }

  .control-btn {
    width: 80px;
    height: 80px;
    position: absolute;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.6);
    border: none;
    color: white;
    padding: 1rem;
    border-radius: 50%;
    cursor: pointer;
    font-size: 2rem;
    transition: opacity $transition-time ease;
  }

  .overlay {
    position: absolute;
    bottom: 3.4rem;
    right: 4.2rem;
    color: transparent;
    // text-shadow: 0 0 2px #ff5100c4;
    text-shadow: 0 0 2px rgba(255, 81, 0, 1), #000 1px 1px 4px, #000 -1px -1px 4px, #000 -1px 1px 4px, #000 1px -1px 4px;
    font-weight: bold;
    font-style: italic;

    font-size: 1rem;
    display: flex;
    align-items: end;
    flex-direction: column;

    .timestamp {
      font-family: "DSEG7-Classic", monospace;
      font-size: 2rem;
      // margin-bottom: 0.5rem;
      display: flex;

      :first-child {
        position: relative;
        top: -0.5em;
        right: -0.85em;
      }

      span {
        width: 4rem;
        text-align: right;
      }
    }
    .location {
      font-family: "Roboto Mono";
      font-size: 1.5rem;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
