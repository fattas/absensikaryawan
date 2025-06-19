// Get all users (admin only)
export async function getAllUsers() {
  const response = await fetch('/api/users/all')
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || "Gagal mengambil data user")
  }

  return result
}

// Reset user's face enrollment (admin only)
export async function resetFaceEnrollment(userId: string): Promise<void> {
  const response = await fetch(`/api/users/${userId}/reset-face`, {
    method: 'POST',
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || "Gagal mereset face enrollment")
  }
}

// Delete user (admin only)
export async function deleteUser(userId: string): Promise<void> {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'DELETE',
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || "Gagal menghapus user")
  }
}

// Get user by ID
export async function getUserById(userId: string) {
  const response = await fetch(`/api/users/${userId}`)
  const result = await response.json()

  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    throw new Error(result.error || "Gagal mengambil data user")
  }

  return result
}

// Update user profile
export async function updateUser(userId: string, data: { name?: string; email?: string }) {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || "Gagal mengupdate data user")
  }

  return result
} 