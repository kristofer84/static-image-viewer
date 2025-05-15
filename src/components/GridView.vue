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
    <transition-group name="fade-move" tag="div" ref="grid" class="grid">
      <ImageItem v-for="(image, index) in orderedImages" :key="image.name" :image="image" @click="openFullscreen(index)" @loaded="loaded" />
    </transition-group>
    <FullscreenViewer v-if="showFullscreen" :folderHandle="folderHandle" :images="orderedImages" :startIndex="fullscreenIndex" @exit="showFullscreen = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject, getCurrentInstance } from "vue";
import Sortable, { SortableEvent } from "sortablejs";
import * as exifr from "exifr";
import ImageItem from "./ImageItem.vue";
import FullscreenViewer from "./FullscreenViewer.vue";
import { ReusableToast } from "../utils/ReusableToast";

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

async function openFolder() {
  const dirHandle = await (window as any).showDirectoryPicker();
  const toast = new ReusableToast("Loading files", { duration: 0 });
  folderHandle.value = dirHandle;
  orderedImages.value = [];

  let jsonOrder: string[] = [];
  let metadataMap: Record<string, any> = {};
  const fileHandles: Record<string, FileSystemFileHandle> = {};

  let count = 0;
  // Step 1: Scan directory for JSON + build file handle map
  for await (const entry of dirHandle.values()) {
    if (entry.kind === "file") {
      const file = await entry.getFile();
      if (file.type.match(/^image\//) && !file.type.match(/^video\//)) toast.setMessage(`Counting files: ${++count}`);
      if (entry.name === "image-viewer-data.json") {
        // const file = await entry.getFile();
        const json = await file.text();
        try {
          const parsed = JSON.parse(json);
          if (Array.isArray(parsed.order)) jsonOrder = parsed.order;
          if (parsed.metadata) metadataMap = parsed.metadata;
        } catch (e) {
          console.error("Invalid JSON:", e);
        }
      } else {
        fileHandles[entry.name] = entry;
      }
    }
  }

  let loadCount = 0;
  // Step 2: Load files in JSON order
  for (const name of jsonOrder) {
    const entry = fileHandles[name];
    if (!entry) continue;

    const file = await entry.getFile();
    if (!file.type.match(/^image\//) && !file.type.match(/^video\//)) continue;

    let thumbUrl = await getThumbUrl(name);
    if (saveThumbnails.value && !thumbUrl) {
      toast.setMessage(`Loading files and generating thumbnails ${++loadCount}/${count}`);
      await createAndSaveThumbnail(file, name);
      thumbUrl = await getThumbUrl(name);
    } else {
      toast.setMessage(`Loading file ${++loadCount}/${count}`);
    }

    const url = thumbUrl || URL.createObjectURL(file);

    const metadata = metadataMap[name] || {};
    const fileData = { name, url, metadata };

    if (file.type.startsWith("image/")) {
      try {
        const exifData = await exifr.parse(file, { tiff: true, exif: true, gps: true });
        if (exifData?.DateTimeOriginal) fileData.metadata.timestamp = exifData.DateTimeOriginal as Date;
        if (exifData?.latitude && exifData?.longitude) {
          fileData.metadata.gps = { lat: exifData.latitude, lon: exifData.longitude };
        }
      } catch (err) {
        console.warn("EXIF parse failed:", err);
      }
    }

    orderedImages.value.push(fileData);
    delete fileHandles[name]; // prevent duplicate loading
  }

  // Step 3: Load remaining image/video files
  for (const name in fileHandles) {
    const entry = fileHandles[name];
    const file = await entry.getFile();
    if (!file.type.match(/^image\//) && !file.type.match(/^video\//)) continue;

    let thumbUrl = await getThumbUrl(name);
    if (saveThumbnails.value && !thumbUrl) {
      toast.setMessage(`Loading files and generating thumbnails ${++loadCount}/${count}`);
      await createAndSaveThumbnail(file, name);
      thumbUrl = await getThumbUrl(name);
    } else {
      toast.setMessage(`Loading file ${++loadCount}/${count}`);
    }

    const url = thumbUrl || URL.createObjectURL(file);
    // const url = URL.createObjectURL(file);
    const metadata = metadataMap[name] || {};
    const fileData = { name, url, metadata };

    if (file.type.startsWith("image/")) {
      try {
        const exifData = await exifr.parse(file, { tiff: true, exif: true, gps: true });
        if (exifData?.DateTimeOriginal) fileData.metadata.timestamp = exifData.DateTimeOriginal as Date;
        if (exifData?.latitude && exifData?.longitude) {
          fileData.metadata.gps = { lat: exifData.latitude, lon: exifData.longitude };
        }
      } catch (err) {
        console.warn("EXIF parse failed:", err);
      }
    }

    orderedImages.value.push(fileData);
  }

  setTimeout(() => {
    toast.dismiss();
  }, 1500);
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
  const instance = getCurrentInstance();
  const gridComponent = instance?.proxy?.$refs.grid as { $el: any };
  const gridEl = gridComponent?.$el || gridComponent;

  if (gridEl instanceof HTMLElement) {
    Sortable.create(gridEl, {
      animation: 150,
      onEnd: (evt: SortableEvent) => {
        const { oldIndex, newIndex } = evt;
        const moved = orderedImages.value.splice(oldIndex!, 1)[0];
        orderedImages.value.splice(newIndex!, 0, moved);
      },
    });
  }
});

const saveThumbnails = ref(localStorage.getItem("saveThumbs") === "true");

async function getThumbUrl(name: string) {
  try {
    const thumbsDir = await folderHandle.value.getDirectoryHandle("thumbs", { create: false });
    const thumbHandle = await thumbsDir.getFileHandle(name);
    const file = await thumbHandle.getFile();
    return URL.createObjectURL(file);
  } catch {
    return null;
  }
}

async function createAndSaveThumbnail(file: File, name: string) {
  try {
    const thumbsDir = await folderHandle.value.getDirectoryHandle("thumbs", { create: true });
    const img = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const maxDim = 512;
    const scale = Math.min(maxDim / img.width, maxDim / img.height);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.7));
    const handle = await thumbsDir.getFileHandle(name, { create: true });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  } catch (err) {
    console.warn("Thumbnail creation failed:", err);
  }
}
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

.fade-move {
  transition: transform 0.15s ease;
}
.fade-move-move {
  transition: transform 0.15s ease;
}
</style>
