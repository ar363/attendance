<script setup>
import CameraSelector from '../CameraSelector.vue'

const faces = ref(JSON.parse(localStorage.getItem('faces') || "[]"))

const removeFace = (name, usn) => {
  const newFaces = faces.value.filter(face => !(face.name === name && face.usn === usn))
  localStorage.setItem('faces', JSON.stringify(newFaces))
  faces.value = newFaces
}

const clearAll = () => {
  if (confirm('Are you sure you want to clear all faces?')) {
    localStorage.setItem('faces', JSON.stringify([]))
    faces.value = []
  }
}

async function loadCamera() {
  let constraints = { video: true, audio: false }
  if (process.client) {
    const preferredId = localStorage.getItem('preferredCameraId')
    if (preferredId) {
      constraints = { video: { deviceId: { exact: preferredId } }, audio: false }
    }
  }
  const ms = await navigator.mediaDevices.getUserMedia(constraints)
  // @ts-ignore
  ms.onactive = () => {
    streamLoaded.value = true
  }
  if (videoObj.value) {
    videoObj.value.srcObject = ms
    streamLoaded.value = true // Ensure streamLoaded is set
  }
}
</script>

<template>
  <div class="min-h-screen bg-pink-50">
    <div class="mx-auto p-4 max-w-screen-md">
      <div class="mb-4">
        <CameraSelector />
      </div>
      <NuxtLink href="/" class="text-rose-700 mb-4 block underline">Back home</NuxtLink>
      <h1 class="text-2xl font-bold">Storage</h1>
      <NuxtLink href="/storage/add" class="text-rose-700">Bulk Add</NuxtLink> &nbsp;&middot;&nbsp;
      <button class="text-rose-700" @click="clearAll">Clear All</button>
      <div class="mt-6 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div v-for="face in faces" :key="face.name + face.usn" class="bg-white shadow p-4 rounded-md">
          <h2 class="text-lg font-medium">{{ face.name }} <span class="text-xs text-gray-500">({{ face.usn }})</span></h2>
          <button class="text-red-500 text-sm" @click="removeFace(face.name, face.usn)">Remove</button>
          <pre class="mt-4 text-gray-600">Descriptor: {{ JSON.stringify(face.desc.split ? face.desc.split(",").map(x => Math.round(Number.parseFloat(x) * 1000000) / 1000000) : face.desc, 0, 2).substring(0, 50) + '...' }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>