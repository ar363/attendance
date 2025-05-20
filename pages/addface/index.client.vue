<script setup lang="ts">
import * as FaceAPI from 'face-api.js'


const modelsLoaded = ref(false)
const streamLoaded = ref(false)
const addingFace = ref<Face | null>(null)
const name = ref("")
const fdt = ref<NodeJS.Timeout | null>(null)
const endSignal = ref(false)
const hideLoader = ref(false)

interface Face {
  x: number,
  y: number,
  w: number,
  h: number,
  key: string,
  desc: Float32Array,
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

async function faceDetection() {

  if (videoObj.value && modelsLoaded.value) {
    hideLoader.value = true
    const faces = await FaceAPI.detectAllFaces(videoObj.value, opts).withFaceLandmarks(true).withFaceDescriptors()

    recfaces.value = faces.map((face) => {
      return {
        x: 100 * face.detection.box.x / face.detection.imageWidth,
        y: 100 * face.detection.box.y / face.detection.imageHeight,
        w: 100 * face.detection.box.width / face.detection.imageWidth,
        h: 100 * face.detection.box.height / face.detection.imageHeight,
        desc: face.descriptor,
        key: crypto.randomUUID().toString(),
      }
    })
  }


  if (!endSignal.value)
    requestAnimationFrame(faceDetection)
}

loadModels()
loadCamera()

onBeforeUnmount(() => {
  endSignal.value = true
})


function addNewFace(face: Face) {
  if (videoObj.value) {
    videoObj.value.pause()
    endSignal.value = true
    addingFace.value = face
  }
}

function saveState() {
  if (name.value) {
    let exfaces = localStorage.getItem("faces")
    exfaces = JSON.parse(exfaces || "[]")

    exfaces.push({
      name: name.value,
      desc: addingFace.value?.desc.join(","),
    })

    localStorage.setItem("faces", JSON.stringify(exfaces))

    const router = useRouter()
    router.push("/")
  }
}
</script>

<template>
  <div class="bg-emerald-50 min-h-screen">
    <div class="p-4 mx-auto max-w-screen-xl">
      <h1 class="text-2xl font-bold mb-4">Add new face</h1>

      <div class="mt-4 p-6 rounded-md bg-amber-100 text-amber-800" v-if="!modelsLoaded">Loading models, please wait...
      </div>

      <div class="mt-4 p-6 rounded-md bg-purple-100 text-purple-800" v-if="!modelsLoaded">Setting up video, please
        wait...
      </div>

      <div class="flex items-stretch mt-4 mb-3" v-if="addingFace">
        <input type="text" v-model="name" aria-label="Your name" placeholder="Your name" id="name"
          class="border border-gray-300 px-3 rounded-l-md" required>
        <button class="px-4 py-2 bg-emerald-700 text-white rounded-r-md" @click="saveState">Save</button>
      </div>

      <div class="relative inline-block">
        <video ref="videoObj" autoplay playsinline @loadedmetadata="faceDetection"></video>
        <div v-for="rf of recfaces"
          :style="{ top: rf.y + '%', left: rf.x + '%', width: rf.w + '%', height: rf.h + '%', position: 'absolute', border: '2px solid white' }"
          class="flex items-end justify-end rounded-t-md rounded-bl-md">
          <button class="bg-emerald-700 text-white -mb-8 -mr-[2px] px-4 py-1 rounded-b-md" @click="addNewFace(rf)"
            v-if="!addingFace">Add
            face</button>
        </div>

        <div v-if="addingFace"
          :style="{ top: addingFace.y + '%', left: addingFace.x + '%', width: addingFace.w + '%', height: addingFace.h + '%', position: 'absolute', zIndex: 99, border: '2px solid #03fc3d' }"
          class="flex items-end justify-end rounded-t-md rounded-bl-md">
          <button class="px-2 rounded-b-md text-[#03fc3d]">Added face!</button>
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
