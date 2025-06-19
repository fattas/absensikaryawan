// This is a mock implementation for the frontend demo
// In a real application, these functions would make API calls to your backend

import { setCookie, deleteCookie } from "./cookie-utils"

interface RegisterData {
  name: string
  email: string
  password: string
}

interface LoginData {
  email: string
  password: string
}

// Register a new user
export async function registerUser(data: RegisterData): Promise<{ success: boolean; message: string }> {
  console.log("auth-service: Registering user with data:", {
    name: data.name,
    email: data.email,
    // password omitted for security
  });

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
      }),
    });

    console.log("auth-service: Registration response status:", response.status);
    const result = await response.json();
    console.log("auth-service: Registration response:", result);

    if (!response.ok) {
      throw new Error(result.error || "Gagal mendaftar. Silakan coba lagi.");
    }
    
    return { 
      success: true, 
      message: result.message || "Pendaftaran berhasil. Silakan login untuk melanjutkan." 
    };
  } catch (error) {
    console.error("auth-service: Registration error:", error);
    throw error;
  }
}

// Login user
export async function loginUser(data: LoginData): Promise<{ needsFaceEnrollment: boolean; success: boolean; message: string }> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Gagal login. Email atau password salah.");
    }

    return {
      needsFaceEnrollment: result.needsFaceEnrollment,
      success: true,
      message: result.message || "Login berhasil"
    };
  } catch (error) {
    console.error("auth-service: Login error:", error);
    throw error;
  }
}

// Login admin
export async function loginAdmin(data: LoginData): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/auth/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Gagal login sebagai admin. Kredensial tidak valid.");
    }
    
    return {
      success: true,
      message: result.message || "Login admin berhasil"
    };
  } catch (error) {
    console.error("auth-service: Admin login error:", error);
    throw error;
  }
}

// Get user profile
export async function getUserProfile() {
  const response = await fetch('/api/auth/user/profile')
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || "Gagal mengambil profil pengguna.")
  }

  return result
}

// Get admin profile
export async function getAdminProfile() {
  const response = await fetch('/api/auth/admin/profile')
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || "Gagal mengambil profil admin.")
  }

  return result
}

// Logout user
export async function logout() {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
  })

  if (!response.ok) {
    const result = await response.json()
    throw new Error(result.error || "Gagal logout. Silakan coba lagi.")
  }
}

// Logout admin
export async function logoutAdmin() {
  const response = await fetch('/api/auth/admin/logout', {
    method: 'POST',
  })

  if (!response.ok) {
    const result = await response.json()
    throw new Error(result.error || "Gagal logout admin. Silakan coba lagi.")
  }
}
