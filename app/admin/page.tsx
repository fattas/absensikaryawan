"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AdminNotification } from "@/components/admin-notification"
import Link from "next/link"
import { checkAdminAuth } from "@/lib/auth-utils"

export default function AdminLogin() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  // Check if admin is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = await checkAdminAuth()
        if (isAuthenticated) {
          router.push("/admin/dashboard")
          return
        }
      } catch (error) {
        console.error("Error checking admin authentication:", error)
      } finally {
        setIsCheckingAuth(false)
      }
    }
    
    checkAuth()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Panggil API login admin langsung
      const response = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal login sebagai admin. Kredensial tidak valid.");
      }

      AdminNotification.success("Selamat datang di dashboard admin");
      
      router.push("/admin/dashboard");
    } catch (error) {
      console.error("Admin login error:", error);
      AdminNotification.error(error instanceof Error ? error.message : "Kredensial admin tidak valid.");
    } finally {
      setIsLoading(false);
    }
  }

  // Tampilkan loading saat memeriksa autentikasi
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563eb]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] p-4 flex items-center">
        <Card className="w-full shadow-lg border-t-4 border-t-[#2563eb]">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Admin Panel</CardTitle>
            <CardDescription className="text-center">
              Masukkan kredensial Anda untuk mengakses panel admin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Kata Sandi</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-[#2563eb] hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? "Sedang login..." : "Login"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/" className="text-sm text-[#2563eb] hover:underline">
              Kembali ke Beranda
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
