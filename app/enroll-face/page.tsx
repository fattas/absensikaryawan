"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function EnrollFaceRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new location
    router.push("/user/enroll-face")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting to face enrollment page...</p>
    </div>
  )
}
