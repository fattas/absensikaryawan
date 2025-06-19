import { prisma } from "./prisma"

// Save user's face encoding
export async function saveFaceEncoding(faceEncoding: number[]): Promise<void> {
  const response = await fetch('/api/face/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      faceEncoding,
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || "Gagal menyimpan face encoding")
  }
}

// Get user's face encoding
export async function getUserFaceEncoding(): Promise<number[] | null> {
  const response = await fetch('/api/face/get')
  
  if (!response.ok) {
    if (response.status === 404) {
      return null // User belum mendaftarkan wajah
    }
    const result = await response.json()
    throw new Error(result.error || "Gagal mengambil face encoding")
  }

  const result = await response.json()
  // Pastikan faceEncoding adalah array
  if (Array.isArray(result.faceEncoding)) {
    return result.faceEncoding
  } else {
    throw new Error("Format face encoding tidak valid")
  }
}

// Delete user's face encoding
export async function deleteFaceEncoding(): Promise<void> {
  const response = await fetch('/api/face/delete', {
    method: 'DELETE',
  })

  if (!response.ok) {
    const result = await response.json()
    throw new Error(result.error || "Gagal menghapus face encoding")
  }
}

// Verify face encoding
export async function verifyFaceEncoding(faceEncoding: number[]): Promise<any> {
  const response = await fetch('/api/face/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      faceEncoding,
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || "Gagal memverifikasi face encoding")
  }

  return result
}
