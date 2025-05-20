<template>
  <div class="bg-gray-100">
    <div class="container mx-auto px-4 py-8 max-w-screen-lg min-h-screen">
      <header class="text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">FaceAuth</h1>
        <p class="text-xl text-gray-600">Secure Authentication with Face Recognition</p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300">
          <div class="text-center mb-4 flex items-center justify-center text-indigo-700">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-12">
              <path
                d="M18 1.5c2.9 0 5.25 2.35 5.25 5.25v3.75a.75.75 0 0 1-1.5 0V6.75a3.75 3.75 0 1 0-7.5 0v3a3 3 0 0 1 3 3v6.75a3 3 0 0 1-3 3H3.75a3 3 0 0 1-3-3v-6.75a3 3 0 0 1 3-3h9v-3c0-2.9 2.35-5.25 5.25-5.25Z" />
            </svg>

          </div>
          <h2 class="text-2xl font-semibold text-gray-800 mb-2 text-center">Recognize Face</h2>
          <p class="text-gray-600 mb-4 text-center">Authenticate using your registered face.</p>
          <NuxtLink href="/recognize"
            class="w-full inline-block text-center bg-indigo-700 text-white py-2 rounded-md hover:bg-indigo-800 transition duration-300">
            Start
            Recognition</NuxtLink>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300">
          <div class="flex items-center justify-center mb-4 text-emerald-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-12">
              <path
                d="M5.25 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM2.25 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM18.75 7.5a.75.75 0 0 0-1.5 0v2.25H15a.75.75 0 0 0 0 1.5h2.25v2.25a.75.75 0 0 0 1.5 0v-2.25H21a.75.75 0 0 0 0-1.5h-2.25V7.5Z" />
            </svg>

          </div>
          <h2 class="text-2xl font-semibold text-gray-800 mb-2 text-center">Add New Face</h2>
          <p class="text-gray-600 mb-4 text-center">Register a new face for authentication.</p>
          <NuxtLink href="/addface"
            class="w-full inline-block text-center bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 transition duration-300">
            Register
            Face</NuxtLink>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300">
          <div class="flex items-center justify-center mb-4 text-rose-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-12">
              <path d="M21 6.375c0 2.692-4.03 4.875-9 4.875S3 9.067 3 6.375 7.03 1.5 12 1.5s9 2.183 9 4.875Z" />
              <path
                d="M12 12.75c2.685 0 5.19-.586 7.078-1.609a8.283 8.283 0 0 0 1.897-1.384c.016.121.025.244.025.368C21 12.817 16.97 15 12 15s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.285 8.285 0 0 0 1.897 1.384C6.809 12.164 9.315 12.75 12 12.75Z" />
              <path
                d="M12 16.5c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 0 0 1.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 0 0 1.897 1.384C6.809 15.914 9.315 16.5 12 16.5Z" />
              <path
                d="M12 20.25c2.685 0 5.19-.586 7.078-1.609a8.282 8.282 0 0 0 1.897-1.384c.016.121.025.244.025.368 0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875c0-.124.009-.247.025-.368a8.284 8.284 0 0 0 1.897 1.384C6.809 19.664 9.315 20.25 12 20.25Z" />
            </svg>

          </div>
          <h2 class="text-2xl font-semibold text-gray-800 mb-2 text-center">Face Storage</h2>
          <p class="text-gray-600 mb-4 text-center">Securely store and manage registered faces.</p>
          <NuxtLink href="/storage"
            class="w-full inline-block text-center bg-rose-600 text-white py-2 rounded-md hover:bg-rose-700 transition duration-300">
            View
            Stored Faces</NuxtLink>
        </div>
      </div>

      <div class="text-center text-gray-600 mt-12 font-light">3rd Semester AI Mini Project</div>
    </div>
  </div>
  <!-- asdf
  
  <NuxtLink class="m-4 rounded-md bg-lime-100 p-4 inline-block" href="/recognize">Recognise</NuxtLink>
  <NuxtLink class="m-4 rounded-md bg-lime-100 p-4 inline-block" href="/addface">Add face</NuxtLink>
  <NuxtLink class="m-4 rounded-md bg-lime-100 p-4 inline-block" href="/storage">Storage</NuxtLink> -->
</template>