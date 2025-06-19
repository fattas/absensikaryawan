"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserProfile, logout } from "@/lib/auth-service"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2 } from "lucide-react"

interface UserProfile {
  id: number
  name: string
  email: string
  hasFaceEncoding: boolean
}

export default function Profile() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getUserProfile()
        setUser(userData)
      } catch (error) {
        console.error("Error fetching user data:", error)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-white shadow-sm flex flex-col">
        {/* App header */}
        <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg font-bold">Profile</h1>
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
            Back
          </Button>
        </header>

        {/* App content */}
        <main className="flex-1 overflow-auto p-4 space-y-4">
          <div className="flex flex-col items-center justify-center py-6">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarFallback className="text-2xl bg-blue-600 text-white">
                {user?.name ? getInitials(user.name) : "U"}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold">{user?.name}</h2>
            <p className="text-gray-500">{user?.email}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Face Enrollment</p>
                <p className="font-medium">
                  {user?.hasFaceEncoding ? (
                    <span className="text-green-600">Completed</span>
                  ) : (
                    <span className="text-red-600">Not Enrolled</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2 pt-4">
            {!user?.hasFaceEncoding && (
              <Button className="w-full" onClick={() => router.push("/enroll-face")}>
                Enroll Face
              </Button>
            )}
            <Button variant="outline" className="w-full" onClick={() => router.push("/change-password")}>
              Change Password
            </Button>
            <Button variant="destructive" className="w-full" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </main>

        {/* App bottom navigation */}
        <nav className="sticky bottom-0 z-10 bg-white border-t px-2 py-2">
          <div className="flex justify-around items-center">
            <Button
              variant="ghost"
              className="flex flex-col items-center h-auto py-2"
              onClick={() => router.push("/dashboard")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mb-1"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span className="text-xs">Home</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center h-auto py-2"
              onClick={() => router.push("/check-in")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mb-1"
              >
                <path d="M12 2v20"></path>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              <span className="text-xs">Check In</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center h-auto py-2 text-blue-600"
              onClick={() => router.push("/profile")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mb-1"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span className="text-xs">Profile</span>
            </Button>
          </div>
        </nav>
      </div>
    </div>
  )
}
