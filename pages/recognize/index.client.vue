<script setup lang="ts">
import * as FaceAPI from 'face-api.js'


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
    FaceAPI.loadTinyFaceDetectorModel('/models'),
    FaceAPI.loadFaceLandmarkTinyModel('/models'),
    FaceAPI.loadFaceRecognitionModel('/models')
  ])

  modelsLoaded.value = true
}

async function loadCamera() {
  const ms = await navigator.mediaDevices.getUserMedia({
    video: true, audio: false,
  })

  // @ts-ignore
  ms.onactive = () => {
    streamLoaded.value = true
  }

  if (videoObj.value)
    videoObj.value.srcObject = ms
}

const opts = new FaceAPI.TinyFaceDetectorOptions({
  inputSize: 224,
  scoreThreshold: 0.5,
})


function parseStrF32(s: string) {
  return Float32Array.from(s.split(","))
}

const savedfaces = JSON.parse(localStorage.getItem("faces") || "[]").map((face: any) => {
  return {
    name: face.name,
    desc: parseStrF32(face.desc),
  }
})

async function faceDetection() {


  if (videoObj.value && modelsLoaded.value) {
    hideLoader.value = true

    const faces = await FaceAPI.detectAllFaces(videoObj.value, opts).withFaceLandmarks(true).withFaceDescriptors()

    if (savedfaces.length == 0) {
      recfaces.value = faces.map((face) => {
        return {
          x: 100 * face.detection.box.x / face.detection.imageWidth,
          y: 100 * face.detection.box.y / face.detection.imageHeight,
          w: 100 * face.detection.box.width / face.detection.imageWidth,
          h: 100 * face.detection.box.height / face.detection.imageHeight,
          match: { label: "No faces in DB", distance: 0 },
        }
      })
    } else {
      const matcher = new FaceAPI.FaceMatcher(savedfaces.map((face) => new FaceAPI.LabeledFaceDescriptors(face.name, [face.desc])))
      recfaces.value = faces.map((face) => {
        return {
          x: 100 * face.detection.box.x / face.detection.imageWidth,
          y: 100 * face.detection.box.y / face.detection.imageHeight,
          w: 100 * face.detection.box.width / face.detection.imageWidth,
          h: 100 * face.detection.box.height / face.detection.imageHeight,
          match: matcher.findBestMatch(face.descriptor),
        }
      })
    }

  }

  if (!endSignal.value)
    requestAnimationFrame(faceDetection)

}

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

      <div class="mt-4 p-6 rounded-md bg-amber-100 text-amber-800" v-if="!modelsLoaded">Loading models, please wait...
      </div>

      <div class="mt-4 p-6 rounded-md bg-purple-100 text-purple-800" v-if="!modelsLoaded">Setting up video, please
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
