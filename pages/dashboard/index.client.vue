<script setup lang="ts">
import { ref, computed } from 'vue'

const attendanceHistory = ref<any[]>([])
const faces = ref<any[]>([])

if (process.client) {
  const arr = JSON.parse(localStorage.getItem('attendanceHistory') || '[]')
  attendanceHistory.value = arr.slice().reverse()
  faces.value = JSON.parse(localStorage.getItem('faces') || '[]')
}

function formatDate(ts: string) {
  const d = new Date(ts)
  return d.toLocaleString()
}

function isPresent(session: any, face: any) {
  return session.students.some((s: any) => s.name === face.name && s.usn === face.usn)
}

function getStudentData(session: any, face: any) {
  return session.students.find((s: any) => s.name === face.name && s.usn === face.usn)
}

function togglePresence(sessionIdx: number, face: any) {
  const session = attendanceHistory.value[sessionIdx]
  const idx = session.students.findIndex((s: any) => s.name === face.name && s.usn === face.usn)
  if (idx !== -1) {
    // Remove student (mark absent)
    session.students.splice(idx, 1)
  } else {
    // Add student (mark present, with minimal info)
    session.students.push({
      name: face.name,
      usn: face.usn,
      accuracy: null,
      seen: null,
      crop: null, // No crop if manually added
    })
  }
  // Persist
  localStorage.setItem('attendanceHistory', JSON.stringify(attendanceHistory.value))
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="p-4 mx-auto max-w-screen-xl">
      <h1 class="text-3xl font-bold mb-6 text-center">Attendance Dashboard</h1>
      <div v-if="attendanceHistory.length === 0" class="text-center text-gray-500 mt-12">
        No attendance records found.
      </div>
      <div v-for="(session, idx) in attendanceHistory" :key="session.timestamp" class="mb-8 bg-white rounded shadow p-6">
        <h2 class="text-xl font-semibold mb-2">Class {{ attendanceHistory.length - idx }} <span class="text-gray-500 text-sm">({{ formatDate(session.timestamp) }})</span></h2>
        <div class="overflow-x-auto">
          <table class="min-w-full border border-slate-200 rounded-lg bg-slate-50">
            <thead class="bg-slate-100">
              <tr>
                <th class="px-4 py-2 text-left">Face</th>
                <th class="px-4 py-2 text-left">Name</th>
                <th class="px-4 py-2 text-left">USN</th>
                <th class="px-4 py-2 text-left">Accuracy</th>
                <th class="px-4 py-2 text-left">Visible Time (s)</th>
                <th class="px-4 py-2 text-left">Present</th>
                <th class="px-4 py-2 text-left">Edit</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="face in faces" :key="face.name + face.usn">
                <td class="px-4 py-2">
                  <img v-if="getStudentData(session, face)?.crop" :src="getStudentData(session, face).crop" class="w-12 h-12 object-cover rounded border border-slate-300 shadow" />
                  <span v-else class="block w-12 h-12 bg-slate-200 rounded"></span>
                </td>
                <td class="px-4 py-2 font-semibold text-slate-800">{{ face.name }}</td>
                <td class="px-4 py-2 text-slate-700">{{ face.usn }}</td>
                <td class="px-4 py-2">{{ getStudentData(session, face)?.accuracy !== null && getStudentData(session, face) ? getStudentData(session, face).accuracy + '%' : '-' }}</td>
                <td class="px-4 py-2">{{ getStudentData(session, face)?.seen ? getStudentData(session, face).seen.toFixed(2) : '-' }}</td>
                <td class="px-4 py-2">
                  <span v-if="isPresent(session, face)" class="text-green-600 font-bold">Present</span>
                  <span v-else class="text-red-500 font-bold">Absent</span>
                </td>
                <td class="px-4 py-2">
                  <button @click="togglePresence(idx, face)" class="px-2 py-1 rounded text-white" :class="isPresent(session, face) ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'">
                    {{ isPresent(session, face) ? 'Mark Absent' : 'Mark Present' }}
                  </button>
                </td>
              </tr>
              <tr v-if="faces.length === 0">
                <td colspan="7" class="text-center text-gray-400 py-4">No students in face database.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
