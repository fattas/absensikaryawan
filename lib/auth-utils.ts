// Utility functions untuk memeriksa status autentikasi

// Periksa apakah user sudah login
export async function checkUserAuth(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/user/profile', {
      method: 'GET',
      credentials: 'include', // Penting untuk mengirim cookies
      cache: 'no-store'
    })
    
    if (response.ok) {
      return true
    }
    return false
  } catch (error) {
    console.error('Error checking user auth:', error)
    return false
  }
}

// Periksa apakah admin sudah login
export async function checkAdminAuth(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/admin/profile', {
      method: 'GET',
      credentials: 'include', // Penting untuk mengirim cookies
      cache: 'no-store'
    })
    
    if (response.ok) {
      return true
    }
    return false
  } catch (error) {
    console.error('Error checking admin auth:', error)
    return false
  }
}

// Get user profile jika sudah login
export async function getUserIfAuthenticated() {
  try {
    const response = await fetch('/api/auth/user/profile', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store'
    })
    
    if (response.ok) {
      return await response.json()
    }
    return null
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

// Get admin profile jika sudah login
export async function getAdminIfAuthenticated() {
  try {
    const response = await fetch('/api/auth/admin/profile', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store'
    })
    
    if (response.ok) {
      return await response.json()
    }
    return null
  } catch (error) {
    console.error('Error getting admin profile:', error)
    return null
  }
} 