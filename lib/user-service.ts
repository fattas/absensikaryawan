// Service untuk manajemen pengguna
// Semua fungsi ini akan membuat panggilan API ke backend

// Hapus pengguna berdasarkan ID
export async function deleteUser(userId: string | number): Promise<void> {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Gagal menghapus pengguna");
  }
}

// Reset pendaftaran wajah pengguna
export async function resetFaceEnrollment(userId: string | number): Promise<void> {
  const response = await fetch(`/api/users/${userId}/reset-face`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Gagal mereset pendaftaran wajah");
  }
}

// Mendapatkan semua pengguna (untuk admin)
export async function getAllUsers() {
  const response = await fetch('/api/users/all');
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Gagal mengambil daftar pengguna");
  }

  return result.users || [];
}

// Mendapatkan detail pengguna berdasarkan ID
export async function getUserById(userId: string | number) {
  const response = await fetch(`/api/users/${userId}`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Gagal mengambil data pengguna");
  }

  return result;
}

// Memperbarui data pengguna
export async function updateUser(userId: string | number, userData: any) {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Gagal memperbarui data pengguna");
  }

  return result;
} 