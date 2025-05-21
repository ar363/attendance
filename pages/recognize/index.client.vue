<script setup lang="ts">
import * as FaceAPI from 'face-api.js'
import { watch } from 'vue'


const modelsLoaded = ref(false)
const streamLoaded = ref(false)
const name = ref("")
const endSignal = ref(false)
const hideLoader = ref(false)

interface Face {
  x: number,
  y: number,
  w: number,
  h: number,
  match: FaceAPI.FaceMatch,
}

const recfaces = ref<Face[]>([])
const videoObj = useTemplateRef("videoObj")

async function loadModels() {
  await Promise.all([
    FaceAPI.loadSsdMobilenetv1Model('/models'),
    FaceAPI.loadFaceLandmarkModel('/models'),
    FaceAPI.loadFaceRecognitionModel('/models')
  ])

  modelsLoaded.value = true
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

// Set options for small/far faces directly in constructor
const opts = new FaceAPI.SsdMobilenetv1Options({
  scoreThreshold: 0.4 // lower for more sensitivity
})

function parseStrF32(s: string) {
  return Float32Array.from(s.split(","))
}

const savedfaces = JSON.parse(localStorage.getItem("faces") || "[]").map((face: any) => {
  return {
    name: face.name,
    usn: face.usn,
    desc: parseStrF32(face.desc),
  }
})

// Store present students with face crop
const presentStudents = ref<any[]>([])

// Cache last seen face box for each label
const lastFaceBox: Record<string, any> = {}

function getFaceCrop(faceBox, video) {
  // Returns a dataURL of the cropped face
  const canvas = document.createElement('canvas')
  const sx = faceBox.x * video.videoWidth / 100
  const sy = faceBox.y * video.videoHeight / 100
  const sw = faceBox.w * video.videoWidth / 100
  const sh = faceBox.h * video.videoHeight / 100
  canvas.width = sw
  canvas.height = sh
  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh)
  return canvas.toDataURL()
}

const attendance: Record<string, { seen: number, lastSeen: number, present: boolean }> = {}
const presentList = ref<string[]>([])
const recording = ref(false)
const thresholdSeconds = 0.5 // seconds to mark present
const countdown = ref(0)
const attendanceDuration = 5 // seconds
const minVisibleTime = 0.5 // seconds
let lastFrameTime = 0
let countdownTimer: any = null

function resetAttendance() {
  for (const key in attendance) delete attendance[key]
  presentList.value = []
  presentStudents.value = [] // Clear present students UI on reset
}

async function faceDetection(ts?: number) {
  if (!recording.value) return
  if (ts && lastFrameTime && ts - lastFrameTime < 100) { // drop frames if <10fps
    requestAnimationFrame(faceDetection)
    return
  }
  lastFrameTime = ts || 0

  if (videoObj.value && modelsLoaded.value) {
    const faces = await FaceAPI.detectAllFaces(videoObj.value, opts).withFaceLandmarks(true).withFaceDescriptors()
    if (savedfaces.length == 0) {
      recfaces.value = faces.map((face) => ({
        x: 100 * face.detection.box.x / face.detection.imageWidth,
        y: 100 * face.detection.box.y / face.detection.imageHeight,
        w: 100 * face.detection.box.width / face.detection.imageWidth,
        h: 100 * face.detection.box.height / face.detection.imageHeight,
        match: { label: "No faces in DB", distance: 0 },
      }))
    } else {
      const matcher = new FaceAPI.FaceMatcher(savedfaces.map((face) => new FaceAPI.LabeledFaceDescriptors(face.name, [face.desc])))
      recfaces.value = faces.map((face) => {
        const match = matcher.findBestMatch(face.descriptor)
        // Attendance logic
        if (match.label !== 'unknown' && match.label !== 'No faces in DB') {
          if (!attendance[match.label]) attendance[match.label] = { seen: 0, lastSeen: 0, present: false }
          const now = Date.now()
          if (attendance[match.label].lastSeen && now - attendance[match.label].lastSeen < 2000) {
            attendance[match.label].seen += (now - attendance[match.label].lastSeen) / 1000
          }
          attendance[match.label].lastSeen = now
          if (!attendance[match.label].present && attendance[match.label].seen >= thresholdSeconds) {
            attendance[match.label].present = true
            if (!presentList.value.includes(match.label)) presentList.value.push(match.label)
          }
          // Cache last seen face box for this label
          lastFaceBox[match.label] = {
            x: 100 * face.detection.box.x / face.detection.imageWidth,
            y: 100 * face.detection.box.y / face.detection.imageHeight,
            w: 100 * face.detection.box.width / face.detection.imageWidth,
            h: 100 * face.detection.box.height / face.detection.imageHeight,
          }
        }
        return {
          x: 100 * face.detection.box.x / face.detection.imageWidth,
          y: 100 * face.detection.box.y / face.detection.imageHeight,
          w: 100 * face.detection.box.width / face.detection.imageWidth,
          h: 100 * face.detection.box.height / face.detection.imageHeight,
          match,
        }
      })
    }
  }
  if (!endSignal.value && recording.value)
    requestAnimationFrame(faceDetection)
}

function startAttendance() {
  resetAttendance()
  recording.value = true
  endSignal.value = false
  countdown.value = attendanceDuration
  if (videoObj.value) videoObj.value.play()
  faceDetection()
  // Start countdown
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      stopAttendance()
    }
  }, 1000)
}

function stopAttendance() {
  recording.value = false
  endSignal.value = true
  if (countdownTimer) clearInterval(countdownTimer)
  countdown.value = 0
  if (videoObj.value) videoObj.value.pause()
  // Show all present students, only if seen for > minVisibleTime
  const arr = Object.keys(attendance)
    .filter(label => attendance[label].present && attendance[label].seen > minVisibleTime)
    .map(label => {
      const db = savedfaces.find(f => f.name === label)
      let crop = ''
      if (lastFaceBox[label] && videoObj.value) {
        // Use a reasonable size for dashboard display (e.g. 96x96)
        const canvas = document.createElement('canvas')
        const sx = lastFaceBox[label].x * videoObj.value.videoWidth / 100
        const sy = lastFaceBox[label].y * videoObj.value.videoHeight / 100
        const sw = lastFaceBox[label].w * videoObj.value.videoWidth / 100
        const sh = lastFaceBox[label].h * videoObj.value.videoHeight / 100
        const size = 96
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        ctx.drawImage(videoObj.value, sx, sy, sw, sh, 0, 0, size, size)
        crop = canvas.toDataURL('image/jpeg', 0.85) // higher quality
      }
      // Find last accuracy from recfaces
      const lastFace = recfaces.value.find(rf => rf.match.label === label)
      const accuracy = lastFace ? Math.round(100 * (1 - lastFace.match.distance)) : null
      return {
        name: db?.name || label,
        usn: db?.usn || '',
        accuracy,
        seen: attendance[label].seen,
        crop,
      }
    })
  presentStudents.value = arr
  // Store attendance in localStorage
  const attendanceHistory = JSON.parse(localStorage.getItem('attendanceHistory') || '[]')
  attendanceHistory.push({
    timestamp: new Date().toISOString(),
    students: arr
  })
  localStorage.setItem('attendanceHistory', JSON.stringify(attendanceHistory))
  console.log('Present students:', arr)
}

// Hide loader when both models and camera are ready
watch([modelsLoaded, streamLoaded], ([models, stream]) => {
  if (models && stream) hideLoader.value = true
})

loadModels()
loadCamera()

onBeforeUnmount(() => {
  endSignal.value = true
})

</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="p-4 mx-auto max-w-screen-xl">
      <h1 class="text-2xl font-bold mb-4">Recognize faces</h1>
      <div v-if="recording" class="mb-4 p-4 bg-blue-100 text-blue-900 rounded shadow text-center text-2xl font-bold">
        Attendance in progress: <span class="font-mono">{{ countdown }}</span> seconds left
      </div>
      <div class="flex gap-4 mb-4">
        <button class="bg-green-600 text-white px-4 py-2 rounded" @click="startAttendance" :disabled="recording">Start Attendance</button>
        <button v-if="recording" class="bg-red-600 text-white px-4 py-2 rounded" @click="stopAttendance">Stop Early</button>
      </div>
      <div v-if="!recording" class="mb-4 p-4 bg-green-50 rounded shadow">
        <h2 class="font-bold mb-2 text-lg text-green-900">Present Students</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full border border-green-200 rounded-lg bg-white">
            <thead class="bg-green-100">
              <tr>
                <th class="px-4 py-2 text-left">Face</th>
                <th class="px-4 py-2 text-left">Name</th>
                <th class="px-4 py-2 text-left">USN</th>
                <th class="px-4 py-2 text-left">Accuracy</th>
                <th class="px-4 py-2 text-left">Visible Time</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in presentStudents" :key="student.name + student.usn">
                <td class="px-4 py-2"><img :src="student.crop" class="w-16 h-16 object-cover rounded-md border border-green-300 shadow" v-if="student.crop" /></td>
                <td class="px-4 py-2 font-semibold text-green-800">{{ student.name }}</td>
                <td class="px-4 py-2 text-green-700">{{ student.usn }}</td>
                <td class="px-4 py-2">{{ student.accuracy !== null ? student.accuracy + '%' : '-' }}</td>
                <td class="px-4 py-2">{{ student.seen ? student.seen.toFixed(2) : '-' }}</td>
              </tr>
              <tr v-if="presentStudents.length === 0">
                <td colspan="5" class="text-center text-gray-400 py-4">No students recognized during attendance.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mt-4 p-6 rounded-md bg-amber-100 text-amber-800" v-if="!hideLoader">Loading models, please wait...
      </div>

      <div class="mt-4 p-6 rounded-md bg-purple-100 text-purple-800" v-if="!hideLoader">Setting up video, please
        wait...
      </div>

      <div class="relative inline-block">
        <video ref="videoObj" autoplay playsinline @loadedmetadata="faceDetection"></video>
        <div v-for="rf of recfaces"
          :style="{ top: rf.y + '%', left: rf.x + '%', width: rf.w + '%', height: rf.h + '%', position: 'absolute', border: '2px solid white' }"
          class="flex items-end justify-end rounded-t-md rounded-bl-md">
          <button class="bg-indigo-700 text-white -mb-8 -mr-[2px] px-4 py-1 rounded-b-md">{{ rf.match.label }} ({{
            Math.round(100 * (1 - rf.match.distance)) }}%)</button>
        </div>
      </div>
    </div>

    <div class="z-10 absolute top-0 left-0 w-full h-full flex items-center justify-center bg-opacity-50 bg-blue-500"
      v-if="!hideLoader">
      <div class="bg-white p-6 rounded-md shadow">
        <h1 class="text-xl font-bold mb-4 text-center">Loading models</h1>
        <progress class="progress w-56"></progress>
      </div>
    </div>
  </div>
</template>
