<script setup>
import { ref, onMounted } from 'vue'

const cameras = ref([])
const selectedCameraId = ref('')
const loading = ref(true)

onMounted(async () => {
  if (!navigator.mediaDevices?.enumerateDevices) {
    loading.value = false
    return
  }
  // Request camera permission to get full device labels (and all cameras, including DroidCam)
  try {
    await navigator.mediaDevices.getUserMedia({ video: true })
  } catch (e) {
    // Ignore, just try to enumerate anyway
  }
  const devices = await navigator.mediaDevices.enumerateDevices()
  cameras.value = devices.filter(d => d.kind === 'videoinput')
  // Load saved camera
  selectedCameraId.value = localStorage.getItem('preferredCameraId') || (cameras.value[0]?.deviceId || '')
  loading.value = false
})

function saveCamera() {
  localStorage.setItem('preferredCameraId', selectedCameraId.value)
}
</script>

<template>
  <div class="mt-4 p-4 bg-white rounded-lg shadow flex flex-col gap-2">
    <label class="block text-base font-semibold text-gray-700 mb-1">Camera to use for attendance:</label>
    <div v-if="loading" class="text-gray-400 text-sm">Loading cameras...</div>
    <div v-else-if="cameras.length === 0" class="text-gray-400 text-sm">No cameras found.</div>
    <div v-else class="flex flex-col gap-2">
      <select v-model="selectedCameraId" @change="saveCamera" class="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition w-full bg-gray-50 text-gray-800">
        <option v-for="cam in cameras" :key="cam.deviceId" :value="cam.deviceId">{{ cam.label || 'Camera ' + (cameras.indexOf(cam)+1) }}</option>
      </select>
      <div class="text-xs text-gray-500 mt-1 italic">This camera will be used for face recognition and attendance.</div>
    </div>
  </div>
</template>
