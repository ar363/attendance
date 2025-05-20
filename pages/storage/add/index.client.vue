<script setup>
function addJSONFile() {
  const file = document.getElementById("faces").files[0]
  const reader = new FileReader()

  reader.onload = function (e) {
    const data = JSON.parse(e.target.result)

    let exfaces = localStorage.getItem("faces")
    exfaces = JSON.parse(exfaces || "[]")

    exfaces = [...exfaces, ...data]

    localStorage.setItem("faces", JSON.stringify(exfaces))

    const router = useRouter()
    router.push("/")
  }

  reader.readAsText(file)
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
  <div class="max-w-screen md mx-auto p-4">
    <NuxtLink href="/storage" class="text-rose-700 mb-4 block">&larr;  Back</NuxtLink>
    <h1 class="text-xl font-medium mb-5">
      Bulk add faces via JSON file
    </h1>

    <input class="file-input file-input-bordered" type="file" name="faces" id="faces" @input="addJSONFile">
  </div>
</template>