"use client"

import { LeaveRequestList } from "@/components/leave-request-list"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function LeaveHistoryPage() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      {/* Mobile app container with width constraints */}
      <div className="w-full max-w-[430px] min-h-screen bg-white shadow-sm flex flex-col">
        {/* App header with back button */}
        <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push('/dashboard')}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Riwayat Cuti/Izin</h1>
        </header>

        {/* App content */}
        <main className="flex-1 overflow-auto p-4">
          <LeaveRequestList />
        </main>
      </div>
    </div>
  )
} 