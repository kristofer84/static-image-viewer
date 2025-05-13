<template>
  <div class="grid-view">
    <div class="toolbar">
      <button @click="resetOrder">
        <span class="material-symbols-outlined">sort</span>
        Reset Order
      </button>
      <button @click="openFolder">
        <span class="material-symbols-outlined">folder_open</span>
        Open Folder
      </button>
      <button v-if="folderHandle" @click="saveJson">
        <span class="material-symbols-outlined">save</span>
        Save Order
      </button>
      <button v-if="folderHandle" @click="saveSidecars">
        <span class="material-symbols-outlined">upload_file</span>
        Export XMP
      </button>
    </div>
    <div ref="grid" class="grid">
      <ImageItem v-for="(image, index) in orderedImages" :key="image.name" :image="image" @click="openFullscreen(index)" @loaded="loaded" />
    </div>
    <FullscreenViewer v-if="showFullscreen" :images="orderedImages" :startIndex="fullscreenIndex" @exit="showFullscreen = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from "vue";
import Sortable from "sortablejs";
import * as exifr from "exifr";
import ImageItem from "./ImageItem.vue";
import FullscreenViewer from "./FullscreenViewer.vue";
import { ToastPluginApi } from "vue-toast-notification";
const $toast = inject("$toast") as ToastPluginApi;

const orderedImages = ref<{ name: string; url: string; metadata?: any }[]>([]);

const showFullscreen = ref(false);
const fullscreenIndex = ref(0);
const grid = ref<HTMLElement | null>(null);
const folderHandle = ref<any | null>(null);

function openFullscreen(index: number) {
  fullscreenIndex.value = index;
  showFullscreen.value = true;
}

function resetOrder() {
  orderedImages.value.sort((a, b) => a.name.localeCompare(b.name));
}

function loaded(event: { name: string; orientation: "horizontal" | "vertical" }) {
  const img = orderedImages.value.find((i) => i.name === event.name);
  if (img) img.metadata.orientation = event.orientation;
}

function getToast(text: string) {
  const div = document.createElement("div");
  div.id = "dir-toast";
  div.innerText = text;
  const toast = $toast.info(div.outerHTML);
  return toast;
}

function updateToast(text: string) {
  const div = document.getElementById("dir-toast") as HTMLDivElement;
  div.innerText = text;
}

async function openFolder() {
  const dirHandle = await (window as any).showDirectoryPicker();
  const toast = getToast("Loading files");
  folderHandle.value = dirHandle;
  orderedImages.value = [];
  let jsonOrder: string[] = [];
  let metadataMap: Record<string, any> = {};
  let count = 0;
  for await (const entry of dirHandle.values()) {
    if (entry.kind === "file") {
      const file = await entry.getFile();
      if (file.type.match(/^image\//) || file.type.match(/^video\//)) {
        count++;
      }
    }
    
    if (entry.kind === "file" && entry.name === "image-viewer-data.json") {
      const file = await entry.getFile();
      const json = await file.text();
      try {
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed.order)) jsonOrder = parsed.order;
        if (parsed.metadata) metadataMap = parsed.metadata;
      } catch (e) {
        console.error("Invalid JSON:", e);
      }
    }
  }

  const files: { name: string; url: string; metadata?: any }[] = [];
  for await (const entry of dirHandle.values()) {
    updateToast(`Loading files: ${files.length + 1}/${count}`);
    if (entry.kind === "file") {
      const file = await entry.getFile();
      if (file.type.match(/^image\//) || file.type.match(/^video\//)) {
        const url = URL.createObjectURL(file);
        const fileData: { name: string; url: string; metadata?: any } = { name: file.name, url, metadata: metadataMap[file.name] || {} };

        if (file.type.startsWith("image/")) {
          try {
            const exifData = await exifr.parse(file, { tiff: true, exif: true, gps: true });
            if (exifData?.DateTimeOriginal) fileData.metadata.timestamp = exifData.DateTimeOriginal as Date;
            if (exifData?.latitude && exifData?.longitude) fileData.metadata.gps = { lat: exifData.latitude, lon: exifData.longitude };
          } catch (err) {
            console.warn("Failed to parse EXIF with exifr:", err);
          }
        }

        files.push(fileData);
      }
    }
  }

  orderedImages.value = jsonOrder.length ? (jsonOrder.map((name) => files.find((f) => f.name === name)).filter(Boolean) as typeof files) : files;
  // toast.dismiss();
}

async function saveJson() {
  if (!folderHandle.value) return;
  const metadata = Object.fromEntries(orderedImages.value.map((img) => [img.name, img.metadata || {}]));
  const json = JSON.stringify(
    {
      order: orderedImages.value.map((img) => img.name),
      metadata,
    },
    null,
    2
  );

  const handle = await folderHandle.value.getFileHandle("image-viewer-data.json", { create: true });
  const writable = await handle.createWritable();
  await writable.write(json);
  await writable.close();
}

async function saveSidecars() {
  if (!folderHandle.value) return;
  for (const img of orderedImages.value) {
    if (!img.metadata?.gps && !img.metadata?.timestamp) continue;
    const xmp = `<?xpacket begin='﻿' id='W5M0MpCehiHzreSzNTczkc9d'?>
<x:xmpmeta xmlns:x='adobe:ns:meta/'>
  <rdf:RDF xmlns:rdf='http://www.w3.org/1999/02/22-rdf-syntax-ns#'>
    <rdf:Description rdf:about=''
      xmlns:dc='http://purl.org/dc/elements/1.1/'
      xmlns:xmp='http://ns.adobe.com/xap/1.0/'>
      ${img.metadata.timestamp ? `<xmp:CreateDate>${img.metadata.timestamp}</xmp:CreateDate>` : ""}
      ${img.metadata.gps ? `<xmp:Location>${JSON.stringify(img.metadata.gps)}</xmp:Location>` : ""}
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end='w'?>`;

    const xmpHandle = await folderHandle.value.getFileHandle(img.name + ".xmp", { create: true });
    const writable = await xmpHandle.createWritable();
    await writable.write(xmp);
    await writable.close();
  }
}

onMounted(() => {
  if (grid.value) {
    Sortable.create(grid.value, {
      animation: 150,
      onEnd: (evt: { oldIndex: number; newIndex: number }) => {
        const moved = orderedImages.value.splice(evt.oldIndex!, 1)[0];
        orderedImages.value.splice(evt.newIndex!, 0, moved);
      },
    });
  }
});
</script>

<style scoped lang="scss">
@use "../styles/variables" as *;
.grid-view {
  padding: 1rem;
  position: relative;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}
.toolbar {
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;
  button {
    background-color: $primary-color;
    &:hover {
      background-color: $primary-color-hover;
    }
    &:active {
      background-color: $primary-color-active;
    }

    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}
</style>
