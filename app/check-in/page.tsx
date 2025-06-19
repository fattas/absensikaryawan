"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import * as faceapi from "face-api.js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { recordAttendance } from "@/lib/attendance-service"
import { getUserFaceEncoding } from "@/lib/face-service"
import { getLocationSettings, isLocationValid } from "@/lib/location-service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, MapPin } from "lucide-react"
import { ModelInstructions } from "@/components/model-instructions"

export default function CheckIn() {
  const router = useRouter()
  const { toast } = useToast()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [faceMatched, setFaceMatched] = useState<boolean | null>(null)
  const [locationValid, setLocationValid] = useState<boolean | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [attendanceSuccess, setAttendanceSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [locationName, setLocationName] = useState<string>("")
  const userFaceDescriptorRef = useRef<Float32Array | null>(null)
  const locationSettingsRef = useRef<{ latitude: number; longitude: number; radius: number } | null>(null)

  useEffect(() => {
    const loadModelsAndData = async () => {
      try {
        // Check if we're in a browser environment
        if (typeof window === "undefined") return

        // Create a function to check if a file exists
        const fileExists = async (url: string) => {
          try {
            const response = await fetch(url, { method: "HEAD" })
            return response.ok
          } catch {
            return false
          }
        }

        // Check if model files exist before trying to load them
        const modelsPath = "/models"
        const tinyFaceDetectorPath = `${modelsPath}/tiny_face_detector_model-weights_manifest.json`

        const modelExists = await fileExists(tinyFaceDetectorPath)

        if (!modelExists) {
          setErrorMessage(
            "File model pengenalan wajah tidak ditemukan. Pastikan model berada di direktori public/models.",
          )
          setIsLoading(false)
          return
        }

        // Load face-api models
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath),
          faceapi.nets.faceRecognitionNet.loadFromUri(modelsPath),
        ])
        setModelsLoaded(true)

        // Get user's face encoding
        const faceEncoding = await getUserFaceEncoding()
        if (!faceEncoding) {
          setErrorMessage("Data wajah tidak ditemukan. Silakan daftarkan wajah Anda terlebih dahulu.")
          setIsLoading(false)
          return
        }
        userFaceDescriptorRef.current = new Float32Array(faceEncoding)

        // Get location settings
        const settings = await getLocationSettings()
        if (!settings) {
          setErrorMessage("Pengaturan lokasi tidak dikonfigurasi. Silakan hubungi admin.")
          setIsLoading(false)
          return
        }
        locationSettingsRef.current = settings

        // Get location name
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${settings.latitude}&lon=${settings.longitude}&zoom=14&addressdetails=1`,
            {
              headers: {
                "Accept-Language": "id",
                "User-Agent": "AttendanceApp/1.0",
              },
            },
          )

          if (response.ok) {
            const data = await response.json()
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
          }
        } catch (error) {
          console.error("Error fetching location name:", error)
          setLocationName("Lokasi tidak diketahui")
        }

        // Get user's current location with better accuracy
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const userLoc = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              setUserLocation(userLoc);

              // Debug koordinat pengguna
              console.log("User position from browser:", {
                lat: userLoc.lat.toFixed(6),
                lng: userLoc.lng.toFixed(6),
                accuracy: position.coords.accuracy,
                timestamp: new Date(position.timestamp).toISOString()
              });

              // Menggunakan isLocationValid dari location-service
              const { valid, distance } = await isLocationValid(userLoc.lat, userLoc.lng);
              setDistance(distance);
              setLocationValid(valid);
              setIsLoading(false);
              
              // Log untuk debugging
              console.log("Location check result:", { 
                userLocation: {
                  lat: userLoc.lat.toFixed(6),
                  lng: userLoc.lng.toFixed(6)
                },
                distance,
                valid,
                locationSettings: locationSettingsRef.current ? {
                  lat: locationSettingsRef.current.latitude.toFixed(6),
                  lng: locationSettingsRef.current.longitude.toFixed(6),
                  radius: locationSettingsRef.current.radius
                } : null
              });
            } catch (error) {
              console.error("Error validating location:", error);
              setErrorMessage("Gagal memvalidasi lokasi Anda.");
              setIsLoading(false);
            }
          },
          (error) => {
            console.error("Error getting location:", error);
            setErrorMessage(`Gagal mendapatkan lokasi: ${error.message || error.code}`);
            setIsLoading(false);
          },
          { 
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0
          }
        );
      } catch (error) {
        console.error("Error loading data:", error)
        setErrorMessage("Gagal memuat data yang diperlukan. Silakan coba lagi.")
        setIsLoading(false)
      }
    }

    loadModelsAndData()

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    if (!modelsLoaded || isLoading || errorMessage) return

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (error) {
        console.error("Error accessing camera:", error)
        setErrorMessage("Akses kamera ditolak. Silakan izinkan akses kamera.")
      }
    }

    startVideo()
  }, [modelsLoaded, isLoading, errorMessage])

  const startFaceVerification = async () => {
    if (!videoRef.current || !canvasRef.current || !userFaceDescriptorRef.current || !userLocation) {
      setErrorMessage("Data yang diperlukan untuk verifikasi tidak lengkap.")
      return
    }

    setIsProcessing(true)

    try {
      // Periksa lokasi lagi sebelum proses (lokasi bisa berubah seiring waktu)
      const { valid: locValid, distance: locDistance } = await isLocationValid(
        userLocation.lat, 
        userLocation.lng
      );
      
      // Update state lokasi
      setLocationValid(locValid);
      setDistance(locDistance);
      
      // Jika lokasi tidak valid, berhenti dan tampilkan pesan
      if (!locValid) {
        setErrorMessage(`Anda berada ${locDistance}m jauh dari lokasi yang diizinkan.`);
        setIsProcessing(false);
        
        // Catat absensi gagal karena lokasi
        await recordAttendance({
          location: userLocation,
          faceMatchScore: 0,
          isSuccessful: false,
        });
        
        return;
      }

      const video = videoRef.current
      const canvas = canvasRef.current
      const displaySize = { width: video.width, height: video.height }
      faceapi.matchDimensions(canvas, displaySize)

      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        setFaceDetected(false)
        setErrorMessage("Tidak ada wajah terdeteksi. Silakan posisikan wajah Anda di dalam bingkai.")
        setIsProcessing(false)
        return
      }

      setFaceDetected(true)

      // Draw face detection on canvas
      const resizedDetections = faceapi.resizeResults(detection, displaySize)
      const context = canvas.getContext("2d")
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height)
        faceapi.draw.drawDetections(canvas, resizedDetections)
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
      }

      // Compare face with stored face encoding
      const distance = faceapi.euclideanDistance(detection.descriptor, userFaceDescriptorRef.current)

      // Threshold for face matching (lower is better match)
      const isMatch = distance < 0.6
      setFaceMatched(isMatch)

      // If both face and location are valid, record attendance
      if (isMatch && locValid) {
        // Take a snapshot for attendance record
        const snapshot = canvas.toDataURL("image/jpeg")

        // Record attendance
        const result = await recordAttendance({
          location: userLocation,
          faceMatchScore: 1 - distance, // Convert distance to similarity score (0-1)
          faceSnapshot: snapshot,
          isSuccessful: true,
        })

        // Jika ada error dari server (misalnya terlalu awal untuk check-out)
        if (!result.success) {
          setErrorMessage(result.error || "Gagal mencatat absensi")
          setIsProcessing(false)
          return
        }

        setAttendanceSuccess(true)

        // Periksa jika ada indikator keterlambatan
        if (result.attendance?.isLate && result.attendance?.lateMessage) {
          toast({
            title: "Absensi Tercatat",
            description: `Absensi Anda telah berhasil dicatat. ${result.attendance.lateMessage}`,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Absensi Tercatat",
            description: "Absensi Anda telah berhasil dicatat.",
          })
        }

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push("/dashboard")
        }, 3000)
      } else {
        // Record failed attempt
        const result = await recordAttendance({
          location: userLocation,
          faceMatchScore: isMatch ? 1 - distance : 0,
          isSuccessful: false,
        })

        if (!result.success) {
          setErrorMessage(result.error || "Gagal mencatat absensi")
        } else if (!isMatch) {
          setErrorMessage("Verifikasi wajah gagal. Silakan coba lagi.")
        } else if (!locValid) {
          setErrorMessage(`Anda berada ${locDistance}m jauh dari lokasi yang diizinkan.`)
        }
      }
    } catch (error) {
      console.error("Error during face verification:", error)
      setErrorMessage("Terjadi kesalahan selama verifikasi. Silakan coba lagi.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Format date as DD-MM-YYYY
  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }

  // Format time as 24-hour format (HH:MM)
  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    return `${hours}:${minutes}`
  }

  // Fungsi untuk mengatur ulang status pemindaian
  const handleRetryFaceScan = () => {
    setFaceDetected(false);
    setFaceMatched(null);
    setErrorMessage("");
    
    // Mulai ulang video jika diperlukan
    if (!videoRef.current?.srcObject) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error("Error accessing camera on retry:", err);
          setErrorMessage("Gagal mengakses kamera. Silakan izinkan akses kamera.");
        });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-white shadow-sm flex flex-col">
        {/* App header */}
        <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
            ← Kembali
          </Button>
          <h1 className="text-lg font-bold text-center">Absensi</h1>
          <div className="w-16"></div> {/* Spacer for centering */}
        </header>

        {/* App content */}
        <main className="flex-1 overflow-auto p-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Verifikasi Wajah</CardTitle>
              <CardDescription>Lihat ke kamera untuk memverifikasi identitas Anda</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 w-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                  <p className="mt-4 text-gray-600">Memuat...</p>
                </div>
              ) : !modelsLoaded ? (
                <ModelInstructions />
              ) : errorMessage ? (
                <>
                  <Alert variant="default" className="mb-4 border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800">Perhatian</AlertTitle>
                    <AlertDescription className="text-amber-700">{errorMessage}</AlertDescription>
                  </Alert>
                  
                  {/* Tombol Ulangi Scan - ditampilkan hanya jika ada error */}
                  <Button 
                    onClick={handleRetryFaceScan} 
                    className="w-full mb-4 bg-blue-600 hover:bg-blue-700"
                  >
                    Ulangi Scan
                  </Button>
                </>
              ) : (
                <div className="relative w-full">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    width={400}
                    height={300}
                    className="rounded-lg w-full h-auto bg-black"
                    onPlay={() => {
                      if (canvasRef.current) {
                        canvasRef.current.width = videoRef.current?.videoWidth || 400
                        canvasRef.current.height = videoRef.current?.videoHeight || 300
                      }
                    }}
                  />
                  <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              {!attendanceSuccess && !isLoading && modelsLoaded && !errorMessage && (
                <Button onClick={startFaceVerification} className="w-full" disabled={isProcessing || !userLocation}>
                  {isProcessing ? "Memverifikasi..." : "Verifikasi & Absen"}
                </Button>
              )}

              {/* Location information */}
              <div className="w-full">
                <div className="bg-blue-50 rounded-md p-3 mb-2">
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Lokasi Absensi:</p>
                      <p className="text-sm text-blue-700">{locationName || "Memuat lokasi..."}</p>
                    </div>
                  </div>
                </div>

                {userLocation && modelsLoaded && !errorMessage && (
                  <div className="flex items-center gap-2 text-sm justify-center">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span>
                      {locationValid === true
                        ? "Lokasi terverifikasi"
                        : locationValid === false
                          ? `${distance}m jauh dari lokasi yang diizinkan`
                          : "Memeriksa lokasi..."}
                    </span>
                  </div>
                )}
              </div>

              {attendanceSuccess && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Berhasil!</AlertTitle>
                  <AlertDescription className="text-green-700">Absensi Anda telah berhasil dicatat.</AlertDescription>
                </Alert>
              )}

              <div className="text-center text-xs text-gray-500">
                <p>
                  Tanggal: {formatDate(new Date())} | Waktu: {formatTime(new Date())}
                </p>
              </div>
            </CardFooter>
          </Card>
        </main>
      </div>
    </div>
  )
}
