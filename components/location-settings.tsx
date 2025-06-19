"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { AdminNotification } from "@/components/admin-notification"
import { getLocationSettings, updateLocationSettings } from "@/lib/location-service"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Save } from "lucide-react"
import Script from "next/script"
import { LocationSearch } from "@/components/location-search"

interface LocationSettingsData {
  latitude: number
  longitude: number
  radius: number
}

// Define Leaflet types
declare global {
  interface Window {
    L: any
  }
}

export function LocationSettings() {
  const [settings, setSettings] = useState<LocationSettingsData>({
    latitude: -6.9175, // Default to Jakarta, Indonesia
    longitude: 107.6191, // Default to Bandung, Indonesia
    radius: 100,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [scriptsLoaded, setScriptsLoaded] = useState(false)
  const [locationName, setLocationName] = useState<string>("Memuat lokasi...")

  // Refs for Leaflet objects
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const circleRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)

  // Auto-save timeout
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch location settings from the database
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getLocationSettings()
        if (data) {
          setSettings(data)
        }
      } catch (error) {
        console.error("Error fetching location settings:", error)
        AdminNotification.error("Gagal memuat pengaturan lokasi.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Fetch location name when settings change
  useEffect(() => {
    const fetchLocationName = async () => {
      if (!settings) return

      try {
        // Use Nominatim reverse geocoding to get location name
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${settings.latitude}&lon=${settings.longitude}&zoom=14&addressdetails=1`,
          {
            headers: {
              "Accept-Language": "id", // Get results in Indonesian
              "User-Agent": "AttendanceApp/1.0",
            },
          },
        )

        if (response.ok) {
          const data = await response.json()
          // Format the location name based on available address components
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
      } catch (error) {
        console.error("Error fetching location name:", error)
        setLocationName("Lokasi tidak diketahui")
      }
    }

    if (!isLoading) {
      fetchLocationName()
    }
  }, [settings, isLoading])

  // Initialize Leaflet map once scripts are loaded and settings are fetched
  useEffect(() => {
    if (!scriptsLoaded || isLoading || !mapContainerRef.current) return

    // Initialize the map if it doesn't exist yet
    if (!mapRef.current) {
      // Create the map
      const map = window.L.map(mapContainerRef.current).setView([settings.latitude, settings.longitude], 15)

      // Add OpenStreetMap tile layer
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      // Create marker
      const marker = window.L.marker([settings.latitude, settings.longitude], {
        draggable: true,
        title: "Lokasi yang Diizinkan",
      }).addTo(map)

      // Create circle
      const circle = window.L.circle([settings.latitude, settings.longitude], {
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.2,
        radius: settings.radius,
      }).addTo(map)

      // Store references
      mapRef.current = map
      markerRef.current = marker
      circleRef.current = circle

      // Add click event to the map
      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng

        // Update marker and circle position
        marker.setLatLng([lat, lng])
        circle.setLatLng([lat, lng])

        // Update settings state
        setSettings((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }))

        // Auto-save after a delay
        scheduleAutoSave()
      })

      // Add dragend event to the marker
      marker.on("dragend", () => {
        const position = marker.getLatLng()

        // Update circle position
        circle.setLatLng(position)

        // Update settings state
        setSettings((prev) => ({
          ...prev,
          latitude: position.lat,
          longitude: position.lng,
        }))

        // Auto-save after a delay
        scheduleAutoSave()
      })

      setMapLoaded(true)
    }
  }, [scriptsLoaded, isLoading, settings.latitude, settings.longitude])

  // Update circle radius when radius changes
  const handleRadiusChange = (value: number[]) => {
    const radius = value[0]
    
    // Update settings
    setSettings((prev) => ({ ...prev, radius }))
    
    // Update circle radius if map is loaded
    if (circleRef.current && mapLoaded) {
      circleRef.current.setRadius(radius)
    }
    
    // Auto-save after a delay
    scheduleAutoSave()
  }

  // Schedule auto-save with debounce
  const scheduleAutoSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      handleSaveSettings(true)
    }, 2000) // Delay 2 seconds before auto-saving
  }

  // Handle manual input changes
  const handleInputChange = (field: keyof LocationSettingsData, value: number) => {
    // Validasi input untuk memastikan nilai adalah angka yang valid
    if (isNaN(value)) {
      AdminNotification.error("Nilai harus berupa angka");
      return;
    }
    
    // Validasi radius harus positif
    if (field === "radius" && value <= 0) {
      AdminNotification.error("Radius harus lebih besar dari 0");
      return;
    }
    
    setSettings((prev) => ({ ...prev, [field]: value }))

    // Update map, marker and circle if coordinates change
    if (field === "latitude" || (field === "longitude" && mapLoaded)) {
      const newPosition = [
        field === "latitude" ? value : settings.latitude,
        field === "longitude" ? value : settings.longitude,
      ]

      if (mapRef.current && markerRef.current && circleRef.current) {
        markerRef.current.setLatLng(newPosition)
        circleRef.current.setLatLng(newPosition)
        mapRef.current.panTo(newPosition)
      }
    }

    scheduleAutoSave()
  }

  // Save settings to database
  const handleSaveSettings = async (isAutoSave = false) => {
    if (!isAutoSave) {
      setIsSaving(true)
    }

    try {
      // Validasi input sebelum mengirim ke server
      const latitude = Number(settings.latitude)
      const longitude = Number(settings.longitude)
      const radius = Number(settings.radius)
      
      if (isNaN(latitude) || isNaN(longitude) || isNaN(radius)) {
        throw new Error("Data koordinat dan radius harus berupa angka")
      }
      
      if (radius <= 0) {
        throw new Error("Radius harus lebih besar dari 0")
      }
      
      // Kirim data yang sudah divalidasi
      await updateLocationSettings({
        latitude, 
        longitude, 
        radius
      })

      if (!isAutoSave) {
        AdminNotification.success("Pengaturan berhasil disimpan")
      }
    } catch (error: any) {
      console.error("Error saving location settings:", error)
      AdminNotification.error(error.message || "Gagal menyimpan pengaturan lokasi.")
    } finally {
      if (!isAutoSave) {
        setIsSaving(false)
      }
    }
  }

  // Get current location
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude

          // Log koordinat untuk debugging
          console.log("Current location from browser:", {
            lat: lat.toString(),
            lng: lng.toString(),
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp).toISOString()
          });

          // Update settings
          setSettings((prev) => ({ ...prev, latitude: lat, longitude: lng }))

          // Update map, marker and circle
          if (mapRef.current && markerRef.current && circleRef.current && mapLoaded) {
            const newPosition = [lat, lng]
            mapRef.current.panTo(newPosition)
            markerRef.current.setLatLng(newPosition)
            circleRef.current.setLatLng(newPosition)
          }

          // Auto-save
          scheduleAutoSave()
        },
        (error) => {
          console.error("Error getting current location:", error)
          AdminNotification.error(`Gagal mendapatkan lokasi: ${error.message || error.code}`)
        },
        { 
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0
        }
      )
    } else {
      AdminNotification.error("Browser Anda tidak mendukung geolokasi.")
    }
  }

  // Handle location selection from search
  const handleLocationSelect = (location: { lat: number; lon: number; display_name: string }) => {
    const lat = Number.parseFloat(location.lat.toString())
    const lng = Number.parseFloat(location.lon.toString())

    // Update settings
    setSettings((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }))

    // Update map, marker and circle
    if (mapRef.current && markerRef.current && circleRef.current && mapLoaded) {
      const newPosition = [lat, lng]
      mapRef.current.setView(newPosition, 16) // Zoom in a bit more when selecting a location
      markerRef.current.setLatLng(newPosition)
      circleRef.current.setLatLng(newPosition)
    }

    // Show success toast
    AdminNotification.success(`Lokasi diatur ke: ${location.display_name}`)

    // Auto-save
    scheduleAutoSave()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    )
  }

  return (
    <>
      {/* Load Leaflet CSS and JS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        crossOrigin=""
        onLoad={() => setScriptsLoaded(true)}
      />

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <Card className="mb-4">
              <CardContent className="p-4">
                <LocationSearch onLocationSelect={handleLocationSelect} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0 relative">
                <div
                  ref={mapContainerRef}
                  id="map"
                  className="h-[400px] w-full rounded-md z-0"
                  style={{ zIndex: 0 }}
                ></div>

                {/* Map info overlay */}
                <div className="absolute top-2 left-2 bg-white bg-opacity-90 p-2 rounded-md shadow-md text-xs z-[400]">
                  <p>
                    Lat: {settings.latitude.toFixed(6)}, Lng: {settings.longitude.toFixed(6)}
                  </p>
                  <p>Radius: {settings.radius}m</p>
                  <p className="font-medium mt-1">{locationName}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="w-full md:w-80 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Garis Lintang (Latitude)</Label>
              <Input
                id="latitude"
                value={settings.latitude}
                onChange={(e) => handleInputChange("latitude", Number.parseFloat(e.target.value))}
                type="number"
                step="0.000001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Garis Bujur (Longitude)</Label>
              <Input
                id="longitude"
                value={settings.longitude}
                onChange={(e) => handleInputChange("longitude", Number.parseFloat(e.target.value))}
                type="number"
                step="0.000001"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="radius">Radius (meter)</Label>
                <span className="text-sm text-gray-500">{settings.radius}m</span>
              </div>
              <Slider
                id="radius"
                min={10}
                max={1000}
                step={10}
                value={[settings.radius]}
                onValueChange={handleRadiusChange}
              />
            </div>

            <Button variant="outline" className="w-full" onClick={handleGetCurrentLocation}>
              <MapPin className="mr-2 h-4 w-4" />
              Gunakan Lokasi Saat Ini
            </Button>

            <Button className="w-full" onClick={() => handleSaveSettings()} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          <p>
            Cari lokasi, klik di mana saja pada peta untuk mengatur lokasi yang diizinkan, atau seret penanda untuk
            menyesuaikan.
          </p>
          <p>Lingkaran biru menunjukkan radius yang diizinkan untuk absensi.</p>
          <p>Perubahan secara otomatis disimpan setelah jeda singkat.</p>
        </div>
      </div>
    </>
  )
}
