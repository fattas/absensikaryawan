"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { loginUser, registerUser } from "@/lib/auth-service"
import { checkUserAuth } from "@/lib/auth-utils"

export default function Home() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("login")
  const [isLoading, setIsLoading] = useState(false)
  const [isDbReady, setIsDbReady] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [dbRetryCount, setDbRetryCount] = useState(0)
  const [isCheckingDb, setIsCheckingDb] = useState(true)

  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })

  // Register form state
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = await checkUserAuth()
        if (isAuthenticated) {
          router.push("/dashboard")
          return
        }
      } catch (error) {
        console.error("Error checking authentication:", error)
      } finally {
        setIsCheckingAuth(false)
      }
    }
    
    checkAuth()
  }, [router])

  // Check database connection with retry mechanism
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout
    const maxRetries = 5
    const retryDelay = 3000 // 3 seconds

    const checkDbConnection = async () => {
      try {
        console.log(`Checking database connection... (Attempt ${dbRetryCount + 1}/${maxRetries})`)
        
        const response = await fetch('/api/system/status', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.status === 'ok' && data.database === 'connected') {
            setIsDbReady(true)
            setIsCheckingDb(false)
            console.log("✅ Database connection established successfully!")
            return // Success, no need to retry
          }
        }
        
        // If we get here, database is not ready
        throw new Error("Database connection failed")
        
      } catch (err) {
        console.error(`Database connection attempt ${dbRetryCount + 1} failed:`, err)
        
        if (dbRetryCount < maxRetries - 1) {
          // Retry after delay
          setDbRetryCount(prev => prev + 1)
          retryTimeout = setTimeout(checkDbConnection, retryDelay)
        } else {
          // Max retries reached
          console.error("❌ Max retries reached. Database connection failed.")
          setIsDbReady(false)
          setIsCheckingDb(false)
          
          // Show user-friendly error message
          toast({
            title: "Connection Error",
            description: "Unable to connect to the database. Please ensure XAMPP MySQL is running and try refreshing the page.",
            variant: "destructive",
            duration: 10000,
          })
        }
      }
    }
    
    checkDbConnection()
    
    // Cleanup
    return () => {
      if (retryTimeout) clearTimeout(retryTimeout)
    }
  }, [dbRetryCount, toast])

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLoginData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setRegisterData((prev) => ({ ...prev, [name]: value }))
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Panggil API login langsung
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Gagal login. Email atau password salah.")
      }

      toast({
        title: "Login Berhasil",
        description: "Selamat datang kembali!",
        variant: "default",
      })
      
      router.push("/dashboard")
    } catch (error) {
      console.error("[Login Error]", error)
      let errorMsg = "Terjadi kesalahan saat login."
      
      if (error instanceof Error) {
        errorMsg = error.message
      } else if (typeof error === 'string') {
        errorMsg = error
      }
      
      toast({
        title: "Login Gagal",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Register submit triggered");
    
    // Validasi input
    if (!registerData.name.trim()) {
      toast({
        title: "Nama Tidak Valid",
        description: "Silakan masukkan nama lengkap Anda.",
        variant: "destructive",
      })
      return
    }

    if (!registerData.email.trim() || !registerData.email.includes('@')) {
      toast({
        title: "Email Tidak Valid",
        description: "Silakan masukkan alamat email yang valid.",
        variant: "destructive",
      })
      return
    }

    if (registerData.password.length < 6) {
      toast({
        title: "Kata Sandi Terlalu Pendek",
        description: "Kata sandi harus memiliki minimal 6 karakter.",
        variant: "destructive",
      })
      return
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Kata Sandi Tidak Cocok",
        description: "Pastikan kata sandi yang Anda masukkan sama.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      console.log("Sending registration data:", {
        name: registerData.name.trim(),
        email: registerData.email.trim().toLowerCase(),
        // password tidak di-log untuk keamanan
      });

      // Panggil API register langsung
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: registerData.name.trim(),
          email: registerData.email.trim().toLowerCase(),
          password: registerData.password,
        }),
      });

      const result = await response.json();
      console.log("Registration response:", result);

      if (!response.ok) {
        throw new Error(result.error || "Gagal mendaftar. Silakan coba lagi.");
      }
      
      console.log("Registration successful");
      
      toast({
        title: "Pendaftaran Berhasil",
        description: "Akun Anda telah dibuat. Silakan login untuk melanjutkan.",
        variant: "default",
      })
      
      // Reset form dan pindah ke tab login
      setRegisterData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      })
      setActiveTab("login")
    } catch (error) {
      // Tambahkan logging error ke console
      console.error("[Register Error]", error)
      let errorMsg = "Terjadi kesalahan saat mendaftar."
      if (error instanceof Error) {
        errorMsg = error.message
      } else if (typeof error === 'string') {
        errorMsg = error
      }
      toast({
        title: "Pendaftaran Gagal",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Tampilkan loading saat memeriksa autentikasi atau database
  if (isCheckingAuth || isCheckingDb) {
    return (
      <div className="min-h-screen bg-[#f0f5ff] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563eb]"></div>
          {isCheckingDb && (
            <div className="text-center">
              <p className="text-gray-600">Connecting to database...</p>
              {dbRetryCount > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Retry attempt {dbRetryCount + 1} of 5
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f0f5ff] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-[#2563eb]">Sistem Absensi Karyawan</CardTitle>
            <CardDescription>Pengenalan Wajah & Verifikasi GPS</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {/* Database Connection Status */}
            {!isDbReady && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-yellow-800 font-medium">Database Connection Issue</p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Please ensure MySQL/XAMPP is running. The system will continue trying to connect.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-[#dbeafe] flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#2563eb]"
                >
                  <path d="M3 14h18"></path>
                  <rect width="18" height="10" x="3" y="4" rx="2"></rect>
                  <path d="M7 19v2"></path>
                  <path d="M17 19v2"></path>
                </svg>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Daftar</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Kata Sandi</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-[#2563eb] hover:bg-blue-700" disabled={isLoading}>
                    {isLoading && activeTab === "login" ? "Sedang login..." : "Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      value={registerData.name}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Kata Sandi</Label>
                    <Input
                      id="register-password"
                      name="password"
                      type="password"
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#2563eb] hover:bg-blue-700" 
                    disabled={isLoading}
                  >
                    {isLoading && activeTab === "register" ? "Mendaftar..." : "Daftar"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-gray-600">
            <div className="text-center">
              <p className="mb-2">Sistem absensi modern dengan pengenalan wajah dan verifikasi lokasi</p>
              <p className="text-xs">
                Jika tombol daftar tidak berfungsi, silakan gunakan{" "}
                <Link href="/register" className="text-[#2563eb] hover:underline">
                  halaman pendaftaran alternatif
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
