"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Clock, MapPin } from "lucide-react"
import { useEffect, useState } from "react"

export function AttendanceButton() {
  const router = useRouter()
  const [locationName, setLocationName] = useState<string>("Memuat lokasi...")
  const [locationSettings, setLocationSettings] = useState({
    latitude: 0,
    longitude: 0
  })

  useEffect(() => {
    const fetchLocationSettings = async () => {
      try {
        // Mendapatkan setting lokasi dari API
        const response = await fetch('/api/location/settings')
        
        if (response.ok) {
          const settings = await response.json()
          setLocationSettings(settings)
          
          // Menggunakan Nominatim untuk mendapatkan nama lokasi
          const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${settings.latitude}&lon=${settings.longitude}&zoom=14&addressdetails=1`,
            {
              headers: {
                "Accept-Language": "id", // Hasil dalam Bahasa Indonesia
                "User-Agent": "AttendanceApp/1.0",
              },
            },
          )

          if (geoResponse.ok) {
            const data = await geoResponse.json()
            // Format nama lokasi berdasarkan komponen alamat yang tersedia
            const address = data.address
            let formattedLocation = ""

            if (address.city || address.town || address.village) {
              formattedLocation += address.city || address.town || address.village
            }

            if (address.state || address.province) {
              if (formattedLocation) formattedLocation += ", "
              formattedLocation += address.state || address.province
            }

            if (address.country) {
              if (formattedLocation) formattedLocation += ", "
              formattedLocation += address.country
            }

            setLocationName(formattedLocation || "Lokasi tidak diketahui")
          } else {
            setLocationName("Lokasi tidak diketahui")
          }
        } else {
          setLocationName("Lokasi tidak diketahui")
        }
      } catch (error) {
        console.error("Error fetching location name:", error)
        setLocationName("Lokasi tidak diketahui")
      }
    }

    fetchLocationSettings()
  }, [])

  const handleCheckIn = () => {
    router.push("/check-in")
  }

  // Format date as DD-MM-YYYY
  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>{formatDate(new Date())}</span>
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          <span>Lokasi Diperlukan</span>
        </div>
      </div>

      {/* Location name display */}
      <div className="bg-blue-50 rounded-md p-2 flex items-start">
        <MapPin className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-800">Lokasi Absensi:</p>
          <p className="text-sm text-blue-700">{locationName}</p>
        </div>
      </div>

      <Button onClick={handleCheckIn} className="w-full bg-blue-600 hover:bg-blue-700">
        Absen Sekarang
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Verifikasi wajah dan pemeriksaan lokasi diperlukan untuk absensi
      </p>
    </div>
  )
}
